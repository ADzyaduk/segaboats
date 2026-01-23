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

// Get admin chat ID from config (exported for testing)
// Uses the same logic as test-notification endpoint
export function getAdminChatId(): string | null {
  try {
    const config = useRuntimeConfig()
    
    // Use the same logic as test-notification endpoint
    const adminChatId = config.telegramAdminChatId
    
    if (!adminChatId || String(adminChatId) === 'undefined' || String(adminChatId) === 'null') {
      console.error('[notifications] ❌ TELEGRAM_ADMIN_CHAT_ID not configured in runtime config')
      console.error('[notifications] config.telegramAdminChatId:', adminChatId)
      return null
    }
    
    const chatIdStr = String(adminChatId).trim()
    if (!chatIdStr || chatIdStr === '') {
      console.error('[notifications] ❌ TELEGRAM_ADMIN_CHAT_ID is invalid:', adminChatId)
      return null
    }
    
    return chatIdStr
  } catch (error) {
    console.error('[notifications] ❌ Error getting admin chat ID:', error)
    return null
  }
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
  console.log('[notifications] 📤 Attempting to notify admin about new booking:', booking.id)
  
  try {
    const adminChatId = getAdminChatId()
    if (!adminChatId) {
      console.error('[notifications] ❌ Cannot notify admin: TELEGRAM_ADMIN_CHAT_ID not configured')
      return { success: false }
    }

    console.log('[notifications] ✓ Admin chat ID found, formatting message...')
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

    console.log('[notifications] 📨 Sending notification to admin chat:', adminChatId)
    const result = await sendAdminNotification(adminChatId, formattedMessage, buttons)
    
    if (result.success) {
      console.log('[notifications] ✅ Successfully notified admin about booking:', booking.id, 'Message ID:', result.messageId)
    } else {
      console.error('[notifications] ❌ Failed to notify admin about booking:', booking.id)
      console.error('[notifications] Result details:', result)
    }
    
    return result
  } catch (error: any) {
    console.error('[notifications] ❌ Error notifying admin about new booking:', booking.id)
    console.error('[notifications] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
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
  adultTickets?: number
  childTickets?: number
}): Promise<{ success: boolean; messageId?: number }> {
  console.log('[notifications] 📤 Attempting to notify admin about new ticket:', ticket.id)
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/fcafbc82-373d-455c-ae65-b91ce9c6082f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'notifications.ts:notifyAdminNewTicket',message:'Entry: notifyAdminNewTicket called',data:{ticketId:ticket.id,serviceTitle:ticket.serviceTitle,totalPrice:ticket.totalPrice,adultTickets:ticket.adultTickets,childTickets:ticket.childTickets},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  try {
    const adminChatId = getAdminChatId()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fcafbc82-373d-455c-ae65-b91ce9c6082f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'notifications.ts:notifyAdminNewTicket',message:'Got adminChatId',data:{adminChatId,hasAdminChatId:!!adminChatId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!adminChatId) {
      console.error('[notifications] ❌ Cannot notify admin: TELEGRAM_ADMIN_CHAT_ID not configured')
      return { success: false }
    }

    console.log('[notifications] ✓ Admin chat ID found, formatting message...')
    const formattedMessage = formatTicketMessage({
      type: 'new',
      ticketId: ticket.id,
      serviceTitle: ticket.serviceTitle,
      customerName: ticket.customerName,
      customerPhone: ticket.customerPhone,
      desiredDate: ticket.desiredDate,
      totalPrice: ticket.totalPrice,
      serviceType: ticket.serviceType,
      adultTickets: ticket.adultTickets ?? 1,
      childTickets: ticket.childTickets ?? 0
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

    console.log('[notifications] 📨 Sending notification to admin chat:', adminChatId)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fcafbc82-373d-455c-ae65-b91ce9c6082f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'notifications.ts:notifyAdminNewTicket',message:'Before sendAdminNotification',data:{adminChatId,messageLength:formattedMessage.length,hasButtons:!!buttons,buttons:JSON.stringify(buttons)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const result = await sendAdminNotification(adminChatId, formattedMessage, buttons)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fcafbc82-373d-455c-ae65-b91ce9c6082f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'notifications.ts:notifyAdminNewTicket',message:'After sendAdminNotification',data:{success:result.success,messageId:result.messageId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    if (result.success) {
      console.log('[notifications] ✅ Successfully notified admin about ticket:', ticket.id, 'Message ID:', result.messageId)
    } else {
      console.error('[notifications] ❌ Failed to notify admin about ticket:', ticket.id)
      console.error('[notifications] Result details:', result)
    }
    
    return result
  } catch (error: any) {
    console.error('[notifications] ❌ Error notifying admin about new ticket:', ticket.id)
    console.error('[notifications] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
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
