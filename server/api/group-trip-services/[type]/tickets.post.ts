// Purchase ticket for a group trip service (without specific trip)

import { prisma } from '~~/server/utils/db'
import { notifyAdminNewTicket } from '~~/server/utils/notifications'

interface TicketBody {
  customerName: string
  customerPhone: string
  customerEmail?: string
  desiredDate?: string // ISO date string
  telegramUserId?: string
  quantity?: number // Number of tickets to purchase (default: 1)
}

export default defineEventHandler(async (event) => {
  try {
    const serviceType = getRouterParam(event, 'type') as string
    const body = await readBody<TicketBody>(event)

    if (!serviceType) {
      throw createError({
        statusCode: 400,
        message: 'Тип услуги не указан'
      })
    }

    // Validate type
    const validTypes = ['SHORT', 'MEDIUM', 'FISHING']
    if (!validTypes.includes(serviceType)) {
      throw createError({
        statusCode: 400,
        message: 'Некорректный тип услуги'
      })
    }

    // Validate required fields
    if (!body.customerName || !body.customerName.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Укажите ваше имя'
      })
    }

    if (!body.customerPhone || !body.customerPhone.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Укажите номер телефона для связи'
      })
    }

    // Validate phone format (basic check)
    const phoneRegex = /^\+?7\s?\(?\d{3}\)?\s?\d{3}[- ]?\d{2}[- ]?\d{2}$/
    const cleanedPhone = body.customerPhone.replace(/[^\d+]/g, '')
    if (cleanedPhone.length < 11 || !phoneRegex.test(body.customerPhone.replace(/\s/g, ''))) {
      throw createError({
        statusCode: 400,
        message: 'Некорректный формат телефона. Используйте формат: +7 (900) 123-45-67'
      })
    }

    // Get service
    const service = await prisma.groupTripService.findUnique({
      where: {
        type: serviceType as 'SHORT' | 'MEDIUM' | 'FISHING'
      }
    })

    if (!service) {
      throw createError({
        statusCode: 404,
        message: 'Услуга не найдена'
      })
    }

    if (!service.isActive) {
      throw createError({
        statusCode: 400,
        message: 'Услуга недоступна для покупки'
      })
    }

    // Validate price
    if (!service.price || service.price <= 0) {
      throw createError({
        statusCode: 500,
        message: 'Цена услуги не настроена. Обратитесь к администратору.'
      })
    }

    // Validate desired date if provided
    let desiredDateObj: Date | null = null
    if (body.desiredDate) {
      desiredDateObj = new Date(body.desiredDate)
      
      if (isNaN(desiredDateObj.getTime())) {
        throw createError({
          statusCode: 400,
          message: 'Некорректный формат даты'
        })
      }
      
      // Compare dates in UTC to avoid timezone issues
      // Extract just the date part (YYYY-MM-DD) for comparison
      const desiredDateStr = desiredDateObj.toISOString().split('T')[0]
      const todayStr = new Date().toISOString().split('T')[0]
      
      if (desiredDateStr < todayStr) {
        throw createError({
          statusCode: 400,
          message: 'Желаемая дата не может быть в прошлом'
        })
      }
    }

    // Find or create user
    let user = null
    const telegramId = body.telegramUserId ? String(body.telegramUserId) : null
    if (telegramId) {
      user = await prisma.user.findUnique({
        where: { telegramId }
      })
    }

    if (!user) {
      // Create a placeholder user for non-telegram bookings
      user = await prisma.user.create({
        data: {
          telegramId: telegramId || `temp_${Date.now()}`,
          firstName: body.customerName.split(' ')[0],
          lastName: body.customerName.split(' ').slice(1).join(' ') || null,
          phone: body.customerPhone,
          email: body.customerEmail || null
        }
      })
    }

    // Validate price before creating ticket
    const ticketPrice = Number(service.price)
    if (!ticketPrice || ticketPrice <= 0 || isNaN(ticketPrice)) {
      throw createError({
        statusCode: 500,
        message: 'Некорректная цена услуги. Обратитесь к администратору.'
      })
    }

    // Create ticket (without tripId - will be set later by manager)
    const ticket = await prisma.groupTripTicket.create({
      data: {
        serviceType: serviceType as 'SHORT' | 'MEDIUM' | 'FISHING',
        userId: user.id,
        customerName: body.customerName.trim(),
        customerPhone: body.customerPhone.trim(),
        customerEmail: body.customerEmail?.trim() || null,
        desiredDate: desiredDateObj,
        totalPrice: ticketPrice,
        status: 'PENDING',
        tripId: null // Will be set when manager creates the trip
      },
      include: {
        service: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            telegramId: true
          }
        }
      }
    })

    // Notify admin about new ticket
    await notifyAdminNewTicket({
      id: ticket.id,
      serviceTitle: ticket.service.title,
      customerName: ticket.customerName,
      customerPhone: ticket.customerPhone,
      desiredDate: ticket.desiredDate,
      totalPrice: ticket.totalPrice,
      serviceType: serviceType
    })

    // Send confirmation to customer if they have Telegram
    if (body.telegramUserId) {
      const { sendTelegramMessage } = await import('~~/server/utils/telegram')
      await sendTelegramMessage({
        chat_id: body.telegramUserId,
        text: `
🎫 <b>Билет заказан!</b>

Услуга: ${ticket.service.title}
💰 Сумма: ${ticket.totalPrice.toLocaleString('ru-RU')} ₽

📋 Номер билета: <code>${ticket.id}</code>

Менеджер свяжется с вами для согласования времени. Мы уведомим вас, когда группа соберётся! 🌊
        `.trim(),
        parse_mode: 'HTML'
      })
    }

    return {
      success: true,
      data: ticket,
      message: 'Билет успешно заказан. Менеджер свяжется с вами для согласования времени.'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error purchasing service ticket:', error)
    throw createError({
      statusCode: 500,
      message: error?.message || 'Ошибка при покупке билета'
    })
  }
})
