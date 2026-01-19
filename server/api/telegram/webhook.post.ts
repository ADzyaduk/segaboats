import crypto from 'crypto'
import { prisma } from '~~/server/utils/db'
import { sendTelegramMessage } from '~~/server/utils/telegram'

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
        updateId: BigInt(update.update_id),
        updateType: update.message ? 'message' : update.callback_query ? 'callback_query' : 'unknown',
        chatId: update.message?.chat.id ? BigInt(update.message.chat.id) : null,
        userId: update.message?.from.id ? BigInt(update.message.from.id) : null,
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
        // Find or create user
        let dbUser = await prisma.user.findUnique({
          where: { telegramId: BigInt(user.id) }
        })

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              telegramId: BigInt(user.id),
              telegramUsername: user.username,
              firstName: user.first_name,
              lastName: user.last_name
            }
          })
        }

        const webAppUrl = config.public.appUrl || 'https://your-domain.com'
        
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
        await sendTelegramMessage({
          chat_id: chatId,
          text: `📚 <b>Помощь</b>\n\n` +
            `/start - Начать работу с ботом\n` +
            `/boats - Посмотреть каталог яхт\n` +
            `/mybookings - Мои бронирования\n` +
            `/help - Показать эту справку\n\n` +
            `По всем вопросам: @support`,
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
              telegramId: BigInt(user.id)
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
    }

    // Handle callback query
    if (update.callback_query) {
      const { callback_query } = update
      const data = callback_query.data

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
