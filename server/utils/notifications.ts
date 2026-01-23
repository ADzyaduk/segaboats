// Centralized notification service for Telegram
// Replaces n8n for basic notifications

import { prisma } from './db'
import { 
  sendTelegramMessage, 
  sendBookingConfirmedNotification,
  sendBookingCancelledNotification,
  sendAdminNotification,
  formatBookingMessage,
  formatTicketMessage
} from './telegram'

// Get admin chat ID from config
function getAdminChatId(): string | null {
  const config = useRuntimeConfig()
  const adminChatId = config.telegramAdminChatId
  if (!adminChatId) {
    console.warn('[notifications] TELEGRAM_ADMIN_CHAT_ID not configured')
    return null
  }
  return String(adminChatId)
}

// Check if user has real Telegram ID (not temp)
function hasTelegramId(telegramId: string | null | undefined): boolean {
  if (!telegramId) return false
  return !telegramId.startsWith('temp_')
}

// Notify admin about new booking
export async function notifyAdminNewBooking(booking: {
  id: string
  boatName: string
  customerName: string
  customerPhone: string
  startDate: Date
  hours: number
  totalPrice: number
  passengers: number
  customerEmail?: string | null
  customerNotes?: string | null
}): Promise<{ success: boolean; messageId?: number }> {
  try {
    const adminChatId = getAdminChatId()
    if (!adminChatId) {
      console.warn('[notifications] Cannot notify admin: TELEGRAM_ADMIN_CHAT_ID not set')
      return { success: false }
    }

    const formattedMessage = formatBookingMessage({
      type: 'new',
      bookingId: booking.id,
      boatName: booking.boatName,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      startDate: booking.startDate,
      hours: booking.hours,
      totalPrice: booking.totalPrice,
      passengers: booking.passengers,
      customerEmail: booking.customerEmail,
      customerNotes: booking.customerNotes
    })

    const buttons = {
      inline_keyboard: [
        [
          { text: '✅ Подтвердить', callback_data: `confirm_booking_${booking.id}` },
          { text: '❌ Отклонить', callback_data: `cancel_booking_${booking.id}` }
        ],
        [
          { text: '📞 Позвонить', url: `tel:${booking.customerPhone.replace(/\s/g, '')}` }
        ]
      ]
    }

    const result = await sendAdminNotification(adminChatId, formattedMessage, buttons)
    return result
  } catch (error) {
    console.error('[notifications] Error notifying admin about new booking:', error)
    return { success: false }
  }
}

// Notify admin about new ticket purchase
export async function notifyAdminNewTicket(ticket: {
  id: string
  serviceTitle: string
  customerName: string
  customerPhone: string
  desiredDate?: Date | null
  totalPrice: number
  serviceType: string
}): Promise<{ success: boolean; messageId?: number }> {
  try {
    const adminChatId = getAdminChatId()
    if (!adminChatId) {
      console.warn('[notifications] Cannot notify admin: TELEGRAM_ADMIN_CHAT_ID not set')
      return { success: false }
    }

    const formattedMessage = formatTicketMessage({
      type: 'new',
      ticketId: ticket.id,
      serviceTitle: ticket.serviceTitle,
      customerName: ticket.customerName,
      customerPhone: ticket.customerPhone,
      desiredDate: ticket.desiredDate,
      totalPrice: ticket.totalPrice,
      serviceType: ticket.serviceType
    })

    const buttons = {
      inline_keyboard: [
        [
          { text: '✅ Подтвердить', callback_data: `confirm_ticket_${ticket.id}` },
          { text: '❌ Отклонить', callback_data: `cancel_ticket_${ticket.id}` }
        ],
        [
          { text: '📞 Позвонить', url: `tel:${ticket.customerPhone.replace(/\s/g, '')}` }
        ]
      ]
    }

    const result = await sendAdminNotification(adminChatId, formattedMessage, buttons)
    return result
  } catch (error) {
    console.error('[notifications] Error notifying admin about new ticket:', error)
    return { success: false }
  }
}

// Notify customer about booking confirmation
export async function notifyCustomerBookingConfirmed(booking: {
  id: string
  boatName: string
  startDate: Date
  hours: number
  totalPrice: number
  userTelegramId?: string | null
  boatPier?: string | null
}): Promise<boolean> {
  try {
    if (!hasTelegramId(booking.userTelegramId)) {
      console.log('[notifications] Customer has no Telegram ID, skipping notification')
      return false
    }

    const dateStr = booking.startDate.toLocaleDateString('ru-RU')
    const timeStr = booking.startDate.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })

    return await sendBookingConfirmedNotification(booking.userTelegramId!, {
      id: booking.id,
      boatName: booking.boatName,
      date: dateStr,
      time: timeStr,
      hours: booking.hours,
      totalPrice: booking.totalPrice,
      pier: booking.boatPier || undefined
    })
  } catch (error) {
    console.error('[notifications] Error notifying customer about booking confirmation:', error)
    return false
  }
}

// Notify customer about booking cancellation
export async function notifyCustomerBookingCancelled(booking: {
  id: string
  boatName: string
  startDate: Date
  userTelegramId?: string | null
}): Promise<boolean> {
  try {
    if (!hasTelegramId(booking.userTelegramId)) {
      console.log('[notifications] Customer has no Telegram ID, skipping notification')
      return false
    }

    const dateStr = booking.startDate.toLocaleDateString('ru-RU')
    const timeStr = booking.startDate.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })

    return await sendBookingCancelledNotification(booking.userTelegramId!, {
      id: booking.id,
      boatName: booking.boatName,
      date: dateStr,
      time: timeStr
    })
  } catch (error) {
    console.error('[notifications] Error notifying customer about booking cancellation:', error)
    return false
  }
}

// Notify customer about ticket confirmation
export async function notifyCustomerTicketConfirmed(ticket: {
  id: string
  serviceTitle: string
  totalPrice: number
  tripDate?: Date | null
  userTelegramId?: string | null
}): Promise<boolean> {
  try {
    if (!hasTelegramId(ticket.userTelegramId)) {
      console.log('[notifications] Customer has no Telegram ID, skipping notification')
      return false
    }

    const text = `
✅ <b>Ваш билет подтверждён!</b>

🎫 Услуга: ${ticket.serviceTitle}
${ticket.tripDate ? `📅 Дата: ${ticket.tripDate.toLocaleDateString('ru-RU')}` : ''}
💰 Стоимость: ${ticket.totalPrice.toLocaleString('ru-RU')} ₽

📋 Номер билета: <code>${ticket.id}</code>

Мы уведомим вас о времени отправления! 🌊
    `.trim()

    return await sendTelegramMessage({
      chat_id: ticket.userTelegramId!,
      text,
      parse_mode: 'HTML'
    })
  } catch (error) {
    console.error('[notifications] Error notifying customer about ticket confirmation:', error)
    return false
  }
}

// Notify customer about ticket cancellation
export async function notifyCustomerTicketCancelled(ticket: {
  id: string
  serviceTitle: string
  userTelegramId?: string | null
}): Promise<boolean> {
  try {
    if (!hasTelegramId(ticket.userTelegramId)) {
      console.log('[notifications] Customer has no Telegram ID, skipping notification')
      return false
    }

    const text = `
❌ <b>Билет отменён</b>

К сожалению, ваш билет был отменён.

🎫 Услуга: ${ticket.serviceTitle}
📋 Номер билета: <code>${ticket.id}</code>

Если у вас есть вопросы, свяжитесь с нами.
Вы всегда можете купить билет на другое время! 🛥
    `.trim()

    return await sendTelegramMessage({
      chat_id: ticket.userTelegramId!,
      text,
      parse_mode: 'HTML'
    })
  } catch (error) {
    console.error('[notifications] Error notifying customer about ticket cancellation:', error)
    return false
  }
}

// Send notification to customer after linking Telegram (deep link)
export async function notifyCustomerAfterLinking(bookingOrTicket: {
  type: 'booking' | 'ticket'
  id: string
  status: string
  userTelegramId: string
}): Promise<boolean> {
  try {
    if (bookingOrTicket.type === 'booking') {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingOrTicket.id },
        include: {
          boat: { select: { name: true, pier: true } },
          user: { select: { telegramId: true } }
        }
      })

      if (!booking) return false

      // Send notification based on current status
      if (booking.status === 'CONFIRMED') {
        return await notifyCustomerBookingConfirmed({
          id: booking.id,
          boatName: booking.boat.name,
          startDate: booking.startDate,
          hours: booking.hours,
          totalPrice: booking.totalPrice,
          userTelegramId: booking.user.telegramId,
          boatPier: booking.boat.pier
        })
      } else if (booking.status === 'PENDING') {
        const text = `
✅ <b>Уведомления подключены!</b>

Теперь вы будете получать уведомления о вашем бронировании:

🛥 Яхта: ${booking.boat.name}
📅 Дата: ${booking.startDate.toLocaleDateString('ru-RU')}
🕐 Время: ${booking.startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
💰 Сумма: ${booking.totalPrice.toLocaleString('ru-RU')} ₽

📋 Номер брони: <code>${booking.id}</code>

Мы уведомим вас о подтверждении и напомним перед прогулкой! 🌊
        `.trim()

        return await sendTelegramMessage({
          chat_id: bookingOrTicket.userTelegramId,
          text,
          parse_mode: 'HTML'
        })
      }
    } else if (bookingOrTicket.type === 'ticket') {
      const ticket = await prisma.groupTripTicket.findUnique({
        where: { id: bookingOrTicket.id },
        include: {
          service: true,
          trip: { select: { departureDate: true } },
          user: { select: { telegramId: true } }
        }
      })

      if (!ticket) return false

      // Send notification based on current status
      if (ticket.status === 'CONFIRMED') {
        return await notifyCustomerTicketConfirmed({
          id: ticket.id,
          serviceTitle: ticket.service.title,
          totalPrice: ticket.totalPrice,
          tripDate: ticket.trip?.departureDate || null,
          userTelegramId: ticket.user.telegramId
        })
      } else if (ticket.status === 'PENDING') {
        const text = `
✅ <b>Уведомления подключены!</b>

Теперь вы будете получать уведомления о вашем билете:

🎫 ${ticket.service.title}
💰 Сумма: ${ticket.totalPrice.toLocaleString('ru-RU')} ₽

Мы уведомим вас, когда группа соберётся и о времени отправления! 🌊
        `.trim()

        return await sendTelegramMessage({
          chat_id: bookingOrTicket.userTelegramId,
          text,
          parse_mode: 'HTML'
        })
      }
    }

    return false
  } catch (error) {
    console.error('[notifications] Error notifying customer after linking:', error)
    return false
  }
}
