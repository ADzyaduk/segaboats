import { prisma } from '~~/server/utils/db'
import { n8nEvents } from '~~/server/utils/n8n'
import { sendBookingConfirmation } from '~~/server/utils/telegram'

interface BookingBody {
  boatId: string
  startDate: string
  hours: number
  passengers: number
  customerName: string
  customerPhone: string
  customerEmail?: string
  customerNotes?: string
  telegramUserId?: string | number
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<BookingBody>(event)

    // Validate required fields
    if (!body.boatId || !body.startDate || !body.hours || !body.passengers) {
      throw createError({
        statusCode: 400,
        message: 'Заполните все обязательные поля'
      })
    }

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

    // Get boat
    const boat = await prisma.boat.findUnique({
      where: { id: body.boatId }
    })

    if (!boat) {
      throw createError({
        statusCode: 404,
        message: 'Яхта не найдена'
      })
    }

    if (!boat.isActive || !boat.isAvailable) {
      throw createError({
        statusCode: 400,
        message: 'Яхта недоступна для бронирования'
      })
    }

    // Validate hours (minimum 1 hour)
    if (body.hours < 1) {
      throw createError({
        statusCode: 400,
        message: 'Минимальное время аренды: 1 час'
      })
    }

    // Validate passengers
    if (body.passengers > boat.capacity) {
      throw createError({
        statusCode: 400,
        message: `Максимальная вместимость: ${boat.capacity} человек`
      })
    }

    // Parse dates
    const startDate = new Date(body.startDate)
    const endDate = new Date(startDate.getTime() + body.hours * 60 * 60 * 1000)

    // Check for conflicting bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        boatId: body.boatId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'PAID']
        },
        OR: [
          {
            startDate: { lte: startDate },
            endDate: { gt: startDate }
          },
          {
            startDate: { lt: endDate },
            endDate: { gte: endDate }
          },
          {
            startDate: { gte: startDate },
            endDate: { lte: endDate }
          }
        ]
      }
    })

    if (conflictingBooking) {
      throw createError({
        statusCode: 400,
        message: 'Выбранное время уже занято'
      })
    }

    // Calculate total price
    const totalPrice = boat.pricePerHour * body.hours

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

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        boatId: body.boatId,
        startDate,
        endDate,
        hours: body.hours,
        passengers: body.passengers,
        totalPrice,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail || null,
        customerNotes: body.customerNotes || null,
        status: 'PENDING'
      },
      include: {
        boat: {
          select: {
            name: true,
            thumbnail: true
          }
        }
      }
    })

    // Trigger n8n webhook
    await n8nEvents.onBookingCreated({
      bookingId: booking.id,
      boatId: boat.id,
      boatName: boat.name,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      startDate: startDate.toISOString(),
      hours: body.hours,
      totalPrice
    })

    // Send Telegram confirmation if user has telegram
    if (body.telegramUserId) {
      await sendBookingConfirmation(body.telegramUserId, {
        id: booking.id,
        boatName: boat.name,
        date: startDate.toLocaleDateString('ru-RU'),
        time: startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        hours: body.hours,
        totalPrice
      })
    }

    return {
      success: true,
      data: {
        id: booking.id,
        boatName: booking.boat.name,
        startDate: booking.startDate,
        endDate: booking.endDate,
        hours: booking.hours,
        passengers: booking.passengers,
        totalPrice: booking.totalPrice,
        status: booking.status
      }
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    console.error('Error creating booking:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при создании бронирования'
    })
  }
})
