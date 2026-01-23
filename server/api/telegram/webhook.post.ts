import crypto from 'crypto'
import { prisma } from '~~/server/utils/db'
import { 
  sendTelegramMessage, 
  editTelegramMessage, 
  answerCallbackQuery,
  formatBookingMessage,
  formatTicketMessage
} from '~~/server/utils/telegram'
import {
  notifyCustomerBookingConfirmed,
  notifyCustomerBookingCancelled,
  notifyCustomerTicketConfirmed,
  notifyCustomerTicketCancelled,
  notifyCustomerAfterLinking
} from '~~/server/utils/notifications'

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
    }
    chat: {
      id: number
      type: string
    }
    date: number
    text?: string
  }
  callback_query?: {
    id: string
    from: {
      id: number
      first_name: string
      last_name?: string
      username?: string
    }
    message?: any
    data?: string
  }
}

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()

    // Verify webhook secret (optional but recommended)
    const secretToken = getHeader(event, 'x-telegram-bot-api-secret-token')
    if (config.telegramWebhookSecret && secretToken !== config.telegramWebhookSecret) {
      console.warn('Invalid Telegram webhook secret')
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }

    const update: TelegramUpdate = await readBody(event)

    // Log update for debugging
    await prisma.telegramLog.create({
      data: {
        updateId: String(update.update_id),
        updateType: update.message ? 'message' : update.callback_query ? 'callback_query' : 'unknown',
        chatId: update.message?.chat.id ? String(update.message.chat.id) : null,
        userId: update.message?.from.id ? String(update.message.from.id) : null,
        payload: update as any
      }
    })

    // Handle message
    if (update.message) {
      const { message } = update
      const chatId = message.chat.id
      const text = message.text || ''
      const user = message.from

      // Handle /start command
      if (text.startsWith('/start')) {
        // Check for deep-link parameters
        const startParam = text.split(' ')[1] // e.g., "booking_abc123" or "ticket_xyz789"

        // Find or create user
        let dbUser = await prisma.user.findUnique({
          where: { telegramId: String(user.id) }
        })

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              telegramId: String(user.id),
              telegramUsername: user.username,
              firstName: user.first_name,
              lastName: user.last_name
            }
          })
        } else {
          // Update user info
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              telegramUsername: user.username,
              firstName: user.first_name,
              lastName: user.last_name
            }
          })
        }

        // Handle booking link: /start booking_ID
        if (startParam?.startsWith('booking_')) {
          const bookingId = startParam.replace('booking_', '')

          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { boat: { select: { name: true } }, user: true }
          })

          if (booking) {
            // Link the booking to this Telegram user if it has a temp ID
            if (booking.user.telegramId.startsWith('temp_')) {
              await prisma.user.update({
                where: { id: booking.user.id },
                data: {
                  telegramId: String(user.id),
                  telegramUsername: user.username,
                  firstName: user.first_name,
                  lastName: user.last_name
                }
              })

              // Send notification about current status
              await notifyCustomerAfterLinking({
                type: 'booking',
                id: booking.id,
                status: booking.status,
                userTelegramId: String(user.id)
              })

              return { ok: true }
            } else {
              // Booking already linked
              await sendTelegramMessage({
                chat_id: chatId,
                text: `ℹ️ Это бронирование уже связано с аккаунтом.\n\n` +
                  `Используйте /mybookings чтобы посмотреть ваши бронирования.`
              })
              return { ok: true }
            }
          } else {
            await sendTelegramMessage({
              chat_id: chatId,
              text: `❌ Бронирование не найдено.\n\nВозможно, ссылка устарела.`
            })
            return { ok: true }
          }
        }

        // Handle ticket link: /start ticket_ID
        if (startParam?.startsWith('ticket_')) {
          const ticketId = startParam.replace('ticket_', '')

          const ticket = await prisma.groupTripTicket.findUnique({
            where: { id: ticketId },
            include: { service: true, user: true }
          })

          if (ticket) {
            // Link the ticket to this Telegram user
            if (ticket.user.telegramId.startsWith('temp_')) {
              await prisma.user.update({
                where: { id: ticket.user.id },
                data: {
                  telegramId: String(user.id),
                  telegramUsername: user.username,
                  firstName: user.first_name,
                  lastName: user.last_name
                }
              })

              // Send notification about current status
              await notifyCustomerAfterLinking({
                type: 'ticket',
                id: ticket.id,
                status: ticket.status,
                userTelegramId: String(user.id)
              })

              return { ok: true }
            }
          }
        }

        // Default welcome message
        const webAppUrl = 'https://v-more.store'

        await sendTelegramMessage({
          chat_id: chatId,
          text: `👋 Добро пожаловать, ${user.first_name}!\n\n🛥 Я помогу вам арендовать яхту в Сочи.\n\nНажмите кнопку ниже, чтобы открыть каталог яхт:`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🛥 Открыть каталог яхт',
                  web_app: { url: webAppUrl }
                }
              ],
              [
                {
                  text: '🎫 Групповые прогулки',
                  web_app: { url: `${webAppUrl}/group-trips` }
                }
              ],
              [
                {
                  text: '📞 Связаться с нами',
                  callback_data: 'contact'
                }
              ]
            ]
          }
        })

        return { ok: true }
      }

      // Handle /help command
      if (text === '/help') {
        const adminChatIdForHelp = config.telegramAdminChatId || '413553084'
        const isAdminUser = String(user.id) === adminChatIdForHelp
        
        let helpText = `📚 <b>Помощь</b>\n\n` +
          `/start - Начать работу с ботом\n` +
          `/boats - Посмотреть каталог яхт\n` +
          `/mybookings - Мои бронирования\n` +
          `/help - Показать эту справку\n\n`
        
        if (isAdminUser) {
          helpText += `🔐 <b>Команды менеджера:</b>\n` +
            `/today - Бронирования на сегодня\n` +
            `/tomorrow - Бронирования на завтра\n` +
            `/pending - Ожидающие подтверждения\n` +
            `/admin - Справка менеджера\n\n`
        }
        
        helpText += `По всем вопросам: @support`

        await sendTelegramMessage({
          chat_id: chatId,
          text: helpText,
          parse_mode: 'HTML'
        })

        return { ok: true }
      }

      // Handle /boats command
      if (text === '/boats') {
        const webAppUrl = config.public.appUrl || 'https://your-domain.com'

        await sendTelegramMessage({
          chat_id: chatId,
          text: '🛥 Нажмите кнопку ниже, чтобы посмотреть наши яхты:',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🛥 Каталог яхт',
                  web_app: { url: `${webAppUrl}/boats` }
                }
              ]
            ]
          }
        })

        return { ok: true }
      }

      // Handle /mybookings command
      if (text === '/mybookings') {
        const bookings = await prisma.booking.findMany({
          where: {
            user: {
              telegramId: String(user.id)
            },
            status: {
              in: ['PENDING', 'CONFIRMED', 'PAID']
            }
          },
          include: {
            boat: {
              select: { name: true }
            }
          },
          orderBy: { startDate: 'asc' },
          take: 5
        })

        if (bookings.length === 0) {
          await sendTelegramMessage({
            chat_id: chatId,
            text: '📋 У вас пока нет активных бронирований.\n\nИспользуйте /boats чтобы выбрать яхту!'
          })
        } else {
          let text = '📋 <b>Ваши бронирования:</b>\n\n'

          for (const booking of bookings) {
            const date = booking.startDate.toLocaleDateString('ru-RU')
            const time = booking.startDate.toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit'
            })

            text += `🛥 ${booking.boat.name}\n`
            text += `📅 ${date} в ${time}\n`
            text += `💰 ${booking.totalPrice.toLocaleString('ru-RU')} ₽\n`
            text += `📌 Статус: ${getStatusEmoji(booking.status)}\n\n`
          }

          await sendTelegramMessage({
            chat_id: chatId,
            text,
            parse_mode: 'HTML'
          })
        }

        return { ok: true }
      }

      // ============================================
      // Manager/Admin Commands
      // ============================================
      const adminChatId = config.telegramAdminChatId || '413553084'
      const isAdmin = String(user.id) === adminChatId

      // Handle /today command (admin only) - bookings for today
      if (text === '/today' && isAdmin) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const bookings = await prisma.booking.findMany({
          where: {
            startDate: {
              gte: today,
              lt: tomorrow
            },
            status: {
              in: ['PENDING', 'CONFIRMED', 'PAID']
            }
          },
          include: {
            boat: { select: { name: true } }
          },
          orderBy: { startDate: 'asc' }
        })

        if (bookings.length === 0) {
          await sendTelegramMessage({
            chat_id: chatId,
            text: '📅 <b>Бронирования на сегодня</b>\n\nНет бронирований на сегодня.',
            parse_mode: 'HTML'
          })
        } else {
          let responseText = `📅 <b>Бронирования на сегодня (${today.toLocaleDateString('ru-RU')}):</b>\n\n`

          for (const booking of bookings) {
            const time = booking.startDate.toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit'
            })

            responseText += `🕐 <b>${time}</b> - ${booking.boat.name}\n`
            responseText += `   👤 ${booking.customerName}\n`
            responseText += `   📱 ${booking.customerPhone}\n`
            responseText += `   ⏱ ${booking.hours} ч. | 💰 ${booking.totalPrice.toLocaleString('ru-RU')} ₽\n`
            responseText += `   ${getStatusEmoji(booking.status)}\n\n`
          }

          responseText += `<i>Всего: ${bookings.length} бронирований</i>`

          await sendTelegramMessage({
            chat_id: chatId,
            text: responseText,
            parse_mode: 'HTML'
          })
        }

        return { ok: true }
      }

      // Handle /tomorrow command (admin only) - bookings for tomorrow
      if (text === '/tomorrow' && isAdmin) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        const dayAfter = new Date(tomorrow)
        dayAfter.setDate(dayAfter.getDate() + 1)

        const bookings = await prisma.booking.findMany({
          where: {
            startDate: {
              gte: tomorrow,
              lt: dayAfter
            },
            status: {
              in: ['PENDING', 'CONFIRMED', 'PAID']
            }
          },
          include: {
            boat: { select: { name: true } }
          },
          orderBy: { startDate: 'asc' }
        })

        if (bookings.length === 0) {
          await sendTelegramMessage({
            chat_id: chatId,
            text: '📅 <b>Бронирования на завтра</b>\n\nНет бронирований на завтра.',
            parse_mode: 'HTML'
          })
        } else {
          let responseText = `📅 <b>Бронирования на завтра (${tomorrow.toLocaleDateString('ru-RU')}):</b>\n\n`

          for (const booking of bookings) {
            const time = booking.startDate.toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit'
            })

            responseText += `🕐 <b>${time}</b> - ${booking.boat.name}\n`
            responseText += `   👤 ${booking.customerName}\n`
            responseText += `   📱 ${booking.customerPhone}\n`
            responseText += `   ⏱ ${booking.hours} ч. | 💰 ${booking.totalPrice.toLocaleString('ru-RU')} ₽\n`
            responseText += `   ${getStatusEmoji(booking.status)}\n\n`
          }

          responseText += `<i>Всего: ${bookings.length} бронирований</i>`

          await sendTelegramMessage({
            chat_id: chatId,
            text: responseText,
            parse_mode: 'HTML'
          })
        }

        return { ok: true }
      }

      // Handle /pending command (admin only) - pending bookings
      if (text === '/pending' && isAdmin) {
        const bookings = await prisma.booking.findMany({
          where: {
            status: 'PENDING'
          },
          include: {
            boat: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })

        if (bookings.length === 0) {
          await sendTelegramMessage({
            chat_id: chatId,
            text: '⏳ <b>Ожидающие подтверждения</b>\n\nНет бронирований, ожидающих подтверждения.',
            parse_mode: 'HTML'
          })
        } else {
          let responseText = `⏳ <b>Ожидающие подтверждения:</b>\n\n`

          for (const booking of bookings) {
            const date = booking.startDate.toLocaleDateString('ru-RU')
            const time = booking.startDate.toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit'
            })

            responseText += `🛥 <b>${booking.boat.name}</b>\n`
            responseText += `   📅 ${date} в ${time}\n`
            responseText += `   👤 ${booking.customerName}\n`
            responseText += `   📱 ${booking.customerPhone}\n`
            responseText += `   💰 ${booking.totalPrice.toLocaleString('ru-RU')} ₽\n\n`
          }

          responseText += `<i>Всего: ${bookings.length} ожидающих</i>`

          await sendTelegramMessage({
            chat_id: chatId,
            text: responseText,
            parse_mode: 'HTML'
          })
        }

        return { ok: true }
      }

      // Handle /admin command - show admin help (admin only)
      if (text === '/admin' && isAdmin) {
        await sendTelegramMessage({
          chat_id: chatId,
          text: `🔐 <b>Команды менеджера</b>\n\n` +
            `/today - Бронирования на сегодня\n` +
            `/tomorrow - Бронирования на завтра\n` +
            `/pending - Ожидающие подтверждения\n` +
            `/admin - Показать эту справку\n\n` +
            `<i>Для подтверждения/отмены используйте кнопки в уведомлениях о новых бронированиях.</i>`,
          parse_mode: 'HTML'
        })

        return { ok: true }
      }
    }

    // Handle callback query
    if (update.callback_query) {
      const { callback_query } = update
      const data = callback_query.data
      const adminChatId = config.telegramAdminChatId || '413553084'
      const isAdmin = String(callback_query.from.id) === String(adminChatId)
      console.log('[webhook] Callback query from user:', {
        userId: callback_query.from.id,
        adminChatId,
        isAdmin,
        callbackData: data
      })

      // Handle booking confirmation (admin only)
      if (data?.startsWith('confirm_booking_') && isAdmin) {
        const bookingId = data.replace('confirm_booking_', '')
        
        try {
          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { 
              boat: { select: { name: true, pier: true } },
              user: { select: { telegramId: true } }
            }
          })

          if (!booking) {
            await answerCallbackQuery({
              callback_query_id: callback_query.id,
              text: 'Бронирование не найдено',
              show_alert: true
            })
            return { ok: true }
          }

          if (booking.status !== 'PENDING') {
            await answerCallbackQuery({
              callback_query_id: callback_query.id,
              text: `Бронирование уже имеет статус: ${booking.status}`,
              show_alert: true
            })
            return { ok: true }
          }

          // Update booking status
          const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: { 
              status: 'CONFIRMED',
              confirmedAt: new Date()
            },
            include: {
              boat: { select: { name: true, pier: true } },
              user: { select: { telegramId: true } }
            }
          })

          // Answer callback
          await answerCallbackQuery({
            callback_query_id: callback_query.id,
            text: 'Бронирование подтверждено!'
          })

          // Update admin message
          if (callback_query.message) {
            const formattedMessage = formatBookingMessage({
              type: 'update',
              bookingId: updatedBooking.id,
              boatName: updatedBooking.boat.name,
              customerName: updatedBooking.customerName,
              customerPhone: updatedBooking.customerPhone,
              startDate: updatedBooking.startDate,
              hours: updatedBooking.hours,
              totalPrice: updatedBooking.totalPrice,
              passengers: updatedBooking.passengers,
              status: 'CONFIRMED'
            })
            
            await editTelegramMessage({
              chat_id: callback_query.message.chat.id,
              message_id: callback_query.message.message_id,
              text: formattedMessage,
              parse_mode: 'HTML',
              reply_markup: undefined // Remove buttons
            })
          }

          // Notify customer
          await notifyCustomerBookingConfirmed({
            id: updatedBooking.id,
            boatName: updatedBooking.boat.name,
            startDate: updatedBooking.startDate,
            hours: updatedBooking.hours,
            totalPrice: updatedBooking.totalPrice,
            userTelegramId: updatedBooking.user.telegramId,
            boatPier: updatedBooking.boat.pier
          })

          return { ok: true }
        } catch (error) {
          console.error('Error confirming booking:', error)
          await answerCallbackQuery({
            callback_query_id: callback_query.id,
            text: 'Ошибка при подтверждении',
            show_alert: true
          })
        }
      }

      // Handle booking cancellation (admin only)
      if (data?.startsWith('cancel_booking_') && isAdmin) {
        const bookingId = data.replace('cancel_booking_', '')
        
        try {
          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { 
              boat: { select: { name: true } },
              user: { select: { telegramId: true } }
            }
          })

          if (!booking) {
            await answerCallbackQuery({
              callback_query_id: callback_query.id,
              text: 'Бронирование не найдено',
              show_alert: true
            })
            return { ok: true }
          }

          if (booking.status === 'CANCELLED') {
            await answerCallbackQuery({
              callback_query_id: callback_query.id,
              text: 'Бронирование уже отменено',
              show_alert: true
            })
            return { ok: true }
          }

          // Update booking status
          const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: { 
              status: 'CANCELLED',
              cancelledAt: new Date()
            },
            include: {
              boat: { select: { name: true } },
              user: { select: { telegramId: true } }
            }
          })

          // Answer callback
          await answerCallbackQuery({
            callback_query_id: callback_query.id,
            text: 'Бронирование отменено'
          })

          // Update admin message
          if (callback_query.message) {
            const formattedMessage = formatBookingMessage({
              type: 'update',
              bookingId: updatedBooking.id,
              boatName: updatedBooking.boat.name,
              customerName: updatedBooking.customerName,
              customerPhone: updatedBooking.customerPhone,
              startDate: updatedBooking.startDate,
              hours: updatedBooking.hours,
              totalPrice: updatedBooking.totalPrice,
              passengers: updatedBooking.passengers,
              status: 'CANCELLED'
            })
            
            await editTelegramMessage({
              chat_id: callback_query.message.chat.id,
              message_id: callback_query.message.message_id,
              text: formattedMessage,
              parse_mode: 'HTML',
              reply_markup: undefined // Remove buttons
            })
          }

          // Notify customer
          await notifyCustomerBookingCancelled({
            id: updatedBooking.id,
            boatName: updatedBooking.boat.name,
            startDate: updatedBooking.startDate,
            userTelegramId: updatedBooking.user.telegramId
          })

          return { ok: true }
        } catch (error) {
          console.error('Error cancelling booking:', error)
          await answerCallbackQuery({
            callback_query_id: callback_query.id,
            text: 'Ошибка при отмене',
            show_alert: true
          })
        }
      }

      // Handle ticket confirmation (admin only)
      // Support both full format (confirm_ticket_xxx) and short format (cfm_xxx)
      let ticketId: string | null = null
      if (data?.startsWith('confirm_ticket_') && isAdmin) {
        ticketId = data.replace('confirm_ticket_', '')
        console.log('[webhook] Processing confirm_ticket callback (full format):', {
          ticketId,
          callbackData: data,
          isAdmin,
          adminChatId: config.telegramAdminChatId,
          userId: callback_query.from.id
        })
      } else if (data?.startsWith('cfm_') && isAdmin) {
        // Short format: cfm_ + last 20 chars of ticket ID
        const shortId = data.replace('cfm_', '')
        // Find ticket by matching last 20 chars of ID using contains (Prisma doesn't support endsWith directly)
        const allTickets = await prisma.groupTripTicket.findMany({
          take: 100 // Limit to recent tickets
        })
        const matchingTicket = allTickets.find(t => t.id.endsWith(shortId))
        if (matchingTicket) {
          ticketId = matchingTicket.id
          console.log('[webhook] Processing confirm_ticket callback (short format):', {
            shortId,
            ticketId,
            callbackData: data,
            isAdmin,
            adminChatId: config.telegramAdminChatId,
            userId: callback_query.from.id
          })
        } else {
          console.error('[webhook] Ticket not found for short callback:', shortId)
          await answerCallbackQuery({
            callback_query_id: callback_query.id,
            text: 'Билет не найден',
            show_alert: true
          })
          return { ok: true }
        }
      }
      
      if (ticketId && isAdmin) {
        
        try {
          const ticket = await prisma.groupTripTicket.findUnique({
            where: { id: ticketId },
            include: {
              service: { select: { title: true } },
              trip: { select: { departureDate: true } },
              user: { select: { telegramId: true } }
            }
          })

          if (!ticket) {
            await answerCallbackQuery({
              callback_query_id: callback_query.id,
              text: 'Билет не найден',
              show_alert: true
            })
            return { ok: true }
          }

          if (ticket.status !== 'PENDING') {
            await answerCallbackQuery({
              callback_query_id: callback_query.id,
              text: `Билет уже имеет статус: ${ticket.status}`,
              show_alert: true
            })
            return { ok: true }
          }

          // Update ticket status
          const updatedTicket = await prisma.groupTripTicket.update({
            where: { id: ticketId },
            data: { 
              status: 'CONFIRMED',
              confirmedAt: new Date()
            },
            include: {
              service: { select: { title: true } },
              trip: { select: { departureDate: true } },
              user: { select: { telegramId: true } }
            }
          })

          // Answer callback
          await answerCallbackQuery({
            callback_query_id: callback_query.id,
            text: 'Билет подтверждён!'
          })

          // Update admin message
          if (callback_query.message) {
            const formattedMessage = formatTicketMessage({
              type: 'update',
              ticketId: updatedTicket.id,
              serviceTitle: updatedTicket.service.title,
              customerName: updatedTicket.customerName,
              customerPhone: updatedTicket.customerPhone,
              desiredDate: updatedTicket.desiredDate,
              totalPrice: updatedTicket.totalPrice,
              serviceType: updatedTicket.serviceType,
              status: 'CONFIRMED'
            })
            
            await editTelegramMessage({
              chat_id: callback_query.message.chat.id,
              message_id: callback_query.message.message_id,
              text: formattedMessage,
              parse_mode: 'HTML',
              reply_markup: undefined // Remove buttons
            })
          }

          // Notify customer
          await notifyCustomerTicketConfirmed({
            id: updatedTicket.id,
            serviceTitle: updatedTicket.service.title,
            totalPrice: updatedTicket.totalPrice,
            tripDate: updatedTicket.trip?.departureDate || null,
            userTelegramId: updatedTicket.user.telegramId
          })

          return { ok: true }
        } catch (error: any) {
          console.error('[webhook] Error confirming ticket:', {
            ticketId,
            error: error?.message,
            stack: error?.stack,
            name: error?.name
          })
          await answerCallbackQuery({
            callback_query_id: callback_query.id,
            text: `Ошибка при подтверждении: ${error?.message || 'Неизвестная ошибка'}`,
            show_alert: true
          })
        }
        return { ok: true }
      } else if (data?.startsWith('confirm_ticket_') || data?.startsWith('cfm_')) {
        // Callback received but user is not admin
        console.warn('[webhook] Non-admin user tried to confirm ticket:', {
          userId: callback_query.from.id,
          callbackData: data,
          adminChatId: config.telegramAdminChatId
        })
        await answerCallbackQuery({
          callback_query_id: callback_query.id,
          text: 'Только администратор может подтверждать билеты',
          show_alert: true
        })
        return { ok: true }
      }

      // Handle ticket cancellation (admin only)
      // Support both full format (cancel_ticket_xxx) and short format (cnl_xxx)
      let cancelTicketId: string | null = null
      if (data?.startsWith('cancel_ticket_') && isAdmin) {
        cancelTicketId = data.replace('cancel_ticket_', '')
        console.log('[webhook] Processing cancel_ticket callback (full format):', {
          ticketId: cancelTicketId,
          callbackData: data,
          isAdmin,
          adminChatId: config.telegramAdminChatId,
          userId: callback_query.from.id
        })
      } else if (data?.startsWith('cnl_') && isAdmin) {
        // Short format: cnl_ + last 20 chars of ticket ID
        const shortId = data.replace('cnl_', '')
        // Find ticket by matching last 20 chars of ID using contains (Prisma doesn't support endsWith directly)
        const allTickets = await prisma.groupTripTicket.findMany({
          take: 100 // Limit to recent tickets
        })
        const matchingTicket = allTickets.find(t => t.id.endsWith(shortId))
        if (matchingTicket) {
          cancelTicketId = matchingTicket.id
          console.log('[webhook] Processing cancel_ticket callback (short format):', {
            shortId,
            ticketId: cancelTicketId,
            callbackData: data,
            isAdmin,
            adminChatId: config.telegramAdminChatId,
            userId: callback_query.from.id
          })
        } else {
          console.error('[webhook] Ticket not found for short cancel callback:', shortId)
          await answerCallbackQuery({
            callback_query_id: callback_query.id,
            text: 'Билет не найден',
            show_alert: true
          })
          return { ok: true }
        }
      }
      
      if (cancelTicketId && isAdmin) {
        
        try {
          const ticket = await prisma.groupTripTicket.findUnique({
            where: { id: cancelTicketId },
            include: {
              service: { select: { title: true } },
              user: { select: { telegramId: true } }
            }
          })

          if (!ticket) {
            await answerCallbackQuery({
              callback_query_id: callback_query.id,
              text: 'Билет не найден',
              show_alert: true
            })
            return { ok: true }
          }

          if (ticket.status === 'CANCELLED') {
            await answerCallbackQuery({
              callback_query_id: callback_query.id,
              text: 'Билет уже отменён',
              show_alert: true
            })
            return { ok: true }
          }

          // Update ticket status
          const updatedTicket = await prisma.groupTripTicket.update({
            where: { id: cancelTicketId },
            data: { 
              status: 'CANCELLED',
              cancelledAt: new Date()
            },
            include: {
              service: { select: { title: true } },
              user: { select: { telegramId: true } }
            }
          })

          // Answer callback
          await answerCallbackQuery({
            callback_query_id: callback_query.id,
            text: 'Билет отменён'
          })

          // Update admin message
          if (callback_query.message) {
            const formattedMessage = formatTicketMessage({
              type: 'update',
              ticketId: updatedTicket.id,
              serviceTitle: updatedTicket.service.title,
              customerName: updatedTicket.customerName,
              customerPhone: updatedTicket.customerPhone,
              desiredDate: updatedTicket.desiredDate,
              totalPrice: updatedTicket.totalPrice,
              serviceType: updatedTicket.serviceType,
              status: 'CANCELLED'
            })
            
            await editTelegramMessage({
              chat_id: callback_query.message.chat.id,
              message_id: callback_query.message.message_id,
              text: formattedMessage,
              parse_mode: 'HTML',
              reply_markup: undefined // Remove buttons
            })
          }

          // Notify customer
          await notifyCustomerTicketCancelled({
            id: updatedTicket.id,
            serviceTitle: updatedTicket.service.title,
            userTelegramId: updatedTicket.user.telegramId
          })

          return { ok: true }
        } catch (error: any) {
          console.error('[webhook] Error cancelling ticket:', {
            ticketId: cancelTicketId,
            error: error?.message,
            stack: error?.stack,
            name: error?.name
          })
          await answerCallbackQuery({
            callback_query_id: callback_query.id,
            text: `Ошибка при отмене: ${error?.message || 'Неизвестная ошибка'}`,
            show_alert: true
          })
        }
        return { ok: true }
      } else if (data?.startsWith('cancel_ticket_') || data?.startsWith('cnl_')) {
        // Callback received but user is not admin
        console.warn('[webhook] Non-admin user tried to cancel ticket:', {
          userId: callback_query.from.id,
          callbackData: data,
          adminChatId: config.telegramAdminChatId
        })
        await answerCallbackQuery({
          callback_query_id: callback_query.id,
          text: 'Только администратор может отменять билеты',
          show_alert: true
        })
        return { ok: true }
      }

      if (data === 'contact') {
        await sendTelegramMessage({
          chat_id: callback_query.from.id,
          text: '📞 <b>Свяжитесь с нами:</b>\n\n' +
            '📱 Телефон: +7 (XXX) XXX-XX-XX\n' +
            '📧 Email: info@yachts-sochi.ru\n' +
            '🌐 Сайт: yachts-sochi.ru',
          parse_mode: 'HTML'
        })
      }
    }

    return { ok: true }
  } catch (error) {
    console.error('Telegram webhook error:', error)

    // Always return 200 to Telegram to prevent retries
    return { ok: false, error: 'Internal error' }
  }
})

function getStatusEmoji(status: string): string {
  const statuses: Record<string, string> = {
    PENDING: '⏳ Ожидает подтверждения',
    CONFIRMED: '✅ Подтверждено',
    PAID: '💳 Оплачено',
    CANCELLED: '❌ Отменено',
    COMPLETED: '🏁 Завершено'
  }
  return statuses[status] || status
}
