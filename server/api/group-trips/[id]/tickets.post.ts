// Purchase group trip ticket

import { prisma } from '~~/server/utils/db'
import { notifyAdminNewTicket } from '~~/server/utils/notifications'

interface TicketBody {
  customerName: string
  customerPhone: string
  customerEmail?: string
  telegramUserId?: string
  adultTickets?: number // Number of adult tickets (default: 1)
  childTickets?: number // Number of child tickets (default: 0)
}

export default defineEventHandler(async (event) => {
  try {
    const tripId = getRouterParam(event, 'id')
    const body = await readBody<TicketBody>()

    if (!tripId) {
      throw createError({
        statusCode: 400,
        message: 'ID поездки не указан'
      })
    }

    // Validate required fields
    if (!body.customerName || !body.customerPhone) {
      throw createError({
        statusCode: 400,
        message: 'Укажите имя и телефон для связи'
      })
    }

    // Get trip
    const trip = await prisma.groupTrip.findUnique({
      where: { id: tripId }
    })

    if (!trip) {
      throw createError({
        statusCode: 404,
        message: 'Групповая поездка не найдена'
      })
    }

    if (trip.status !== 'SCHEDULED') {
      throw createError({
        statusCode: 400,
        message: 'Поездка недоступна для бронирования'
      })
    }

    if (trip.availableSeats <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Нет доступных мест'
      })
    }

    // Validate price
    if (!trip.price || trip.price <= 0) {
      throw createError({
        statusCode: 500,
        message: 'Цена поездки не настроена. Обратитесь к администратору.'
      })
    }

    // Find or create user
    let user = null
    if (body.telegramUserId) {
      user = await prisma.user.findUnique({
        where: { telegramId: body.telegramUserId }
      })
    }

    if (!user) {
      // Create placeholder user
      user = await prisma.user.create({
        data: {
          telegramId: body.telegramUserId || `temp_${Date.now()}`,
          firstName: body.customerName.split(' ')[0],
          lastName: body.customerName.split(' ').slice(1).join(' ') || null,
          phone: body.customerPhone,
          email: body.customerEmail || null
        }
      })
    }

    // Check available seats again (race condition protection)
    const currentTrip = await prisma.groupTrip.findUnique({
      where: { id: tripId },
      select: { availableSeats: true, status: true }
    })

    if (!currentTrip || currentTrip.availableSeats <= 0 || currentTrip.status !== 'SCHEDULED') {
      throw createError({
        statusCode: 400,
        message: 'Нет доступных мест'
      })
    }

    // Validate price before creating ticket
    const ticketPrice = Number(trip.price)
    if (!ticketPrice || ticketPrice <= 0 || isNaN(ticketPrice)) {
      throw createError({
        statusCode: 500,
        message: 'Некорректная цена поездки. Обратитесь к администратору.'
      })
    }

    console.log('[tickets] Creating ticket for trip:', {
      tripId: trip.id,
      tripPrice: trip.price,
      ticketPrice,
      tripType: trip.type
    })

    // Get adult and child tickets (default to 1 adult for backward compatibility)
    const adultTickets = body.adultTickets ?? 1
    const childTickets = body.childTickets ?? 0
    
    if (adultTickets < 0 || childTickets < 0) {
      throw createError({
        statusCode: 400,
        message: 'Количество билетов не может быть отрицательным'
      })
    }
    
    const totalTickets = adultTickets + childTickets
    if (totalTickets < 1) {
      throw createError({
        statusCode: 400,
        message: 'Выберите хотя бы один билет'
      })
    }
    
    if (totalTickets > 10) {
      throw createError({
        statusCode: 400,
        message: 'Можно заказать не более 10 билетов'
      })
    }

    if (totalTickets > currentTrip.availableSeats) {
      throw createError({
        statusCode: 400,
        message: `Доступно только ${currentTrip.availableSeats} мест`
      })
    }

    // Calculate prices
    const adultPrice = ticketPrice
    const childPrice = Math.floor(adultPrice * 0.5) // 50% от взрослого
    
    // Calculate total price for all tickets
    const adultTotal = adultPrice * adultTickets
    const childTotal = childPrice * childTickets
    const totalPriceForAllTickets = adultTotal + childTotal

    console.log('[tickets] Ticket calculation:', {
      adultTickets,
      childTickets,
      totalTickets,
      adultPrice,
      childPrice,
      adultTotal,
      childTotal,
      totalPrice: totalPriceForAllTickets,
      availableSeats: currentTrip.availableSeats
    })

    // Create ticket and update available seats atomically
    const ticket = await prisma.$transaction(async (tx) => {
      // Create ticket with adult/child information
      const newTicket = await tx.groupTripTicket.create({
        data: {
          tripId: trip.id,
          serviceType: trip.type,
          userId: user.id,
          customerName: body.customerName,
          customerPhone: body.customerPhone,
          customerEmail: body.customerEmail || null,
          totalPrice: totalPriceForAllTickets, // Total for all tickets
          adultTickets: adultTickets,
          childTickets: childTickets,
          adultPrice: adultPrice,
          childPrice: childPrice,
          status: 'PENDING'
        },
        include: {
          trip: {
            select: {
              type: true,
              duration: true,
              departureDate: true,
              departureTime: true
            }
          },
          service: {
            select: {
              title: true
            }
          }
        }
      })

      // Update available seats (decrement by total tickets)
      await tx.groupTrip.update({
        where: { id: trip.id },
        data: {
          availableSeats: {
            decrement: totalTickets
          }
        }
      })

      return newTicket
    })

    // Notify admin about new ticket
    await notifyAdminNewTicket({
      id: ticket.id,
      serviceTitle: ticket.service.title,
      customerName: ticket.customerName,
      customerPhone: ticket.customerPhone,
      desiredDate: ticket.trip.departureDate,
      totalPrice: ticket.totalPrice,
      serviceType: ticket.trip.type,
      adultTickets: adultTickets,
      childTickets: childTickets
    })

    // Send confirmation to customer if they have Telegram
    if (body.telegramUserId) {
      const { sendTelegramMessage } = await import('~~/server/utils/telegram')
      await sendTelegramMessage({
        chat_id: body.telegramUserId,
        text: `
🎫 <b>Билет заказан!</b>

Услуга: ${ticket.service.title}
📅 Дата: ${ticket.trip.departureDate.toLocaleDateString('ru-RU')}
💰 Сумма: ${ticket.totalPrice.toLocaleString('ru-RU')} ₽

📋 Номер билета: <code>${ticket.id}</code>

Менеджер свяжется с вами для подтверждения. Мы уведомим вас о статусе! 🌊
        `.trim(),
        parse_mode: 'HTML'
      })
    }

    return {
      success: true,
      data: {
        id: ticket.id,
        status: ticket.status,
        totalPrice: ticket.totalPrice,
        trip: ticket.trip
      }
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    console.error('Error creating group trip ticket:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при покупке билета'
    })
  }
})
