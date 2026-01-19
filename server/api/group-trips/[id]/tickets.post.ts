// Purchase group trip ticket

import { prisma } from '~~/server/utils/db'
import { n8nEvents } from '~~/server/utils/n8n'

interface TicketBody {
  customerName: string
  customerPhone: string
  customerEmail?: string
  telegramUserId?: string
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

    // Create ticket and update available seats atomically
    const ticket = await prisma.$transaction(async (tx) => {
      // Create ticket
      const newTicket = await tx.groupTripTicket.create({
        data: {
          tripId: trip.id,
          userId: user.id,
          customerName: body.customerName,
          customerPhone: body.customerPhone,
          customerEmail: body.customerEmail || null,
          totalPrice: trip.price,
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
          }
        }
      })

      // Update available seats
      await tx.groupTrip.update({
        where: { id: trip.id },
        data: {
          availableSeats: {
            decrement: 1
          }
        }
      })

      return newTicket
    })

    // Trigger n8n webhook for admin notification
    await n8nEvents.onGroupTripTicketPurchased({
      ticketId: ticket.id,
      tripId: trip.id,
      tripType: trip.type,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      departureDate: trip.departureDate.toISOString(),
      price: trip.price,
      availableSeats: trip.availableSeats - 1 // After this ticket
    })

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
