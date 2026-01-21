import crypto from 'crypto'

// Types
export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

export interface TelegramWebAppInitData {
  query_id?: string
  user?: TelegramUser
  auth_date: number
  hash: string
}

export interface TelegramMessage {
  chat_id: number | string
  text: string
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  reply_markup?: any
}

// Get Telegram bot token from runtime config
function getBotToken(): string {
  const config = useRuntimeConfig()
  const token = config.telegramBotToken
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  }
  return token
}

// Validate Telegram WebApp init data
export function validateTelegramWebAppData(initData: string): TelegramWebAppInitData | null {
  try {
    const config = useRuntimeConfig()
    const botToken = config.telegramBotToken
    
    if (!botToken) {
      console.error('Telegram bot token not configured')
      return null
    }

    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    
    if (!hash) {
      return null
    }

    // Remove hash from params for validation
    urlParams.delete('hash')
    
    // Sort params alphabetically and create data-check-string
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    // Create secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    if (calculatedHash !== hash) {
      console.error('Invalid Telegram WebApp hash')
      return null
    }

    // Parse user data
    const userString = urlParams.get('user')
    const user = userString ? JSON.parse(userString) : undefined
    const authDate = parseInt(urlParams.get('auth_date') || '0', 10)

    // Check if data is not too old (24 hours)
    const now = Math.floor(Date.now() / 1000)
    if (now - authDate > 86400) {
      console.error('Telegram WebApp data is too old')
      return null
    }

    return {
      query_id: urlParams.get('query_id') || undefined,
      user,
      auth_date: authDate,
      hash
    }
  } catch (error) {
    console.error('Error validating Telegram WebApp data:', error)
    return null
  }
}

// Send message via Telegram Bot API
export async function sendTelegramMessage(message: TelegramMessage): Promise<boolean> {
  try {
    const botToken = getBotToken()
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    })

    const result = await response.json()
    
    if (!result.ok) {
      console.error('Telegram API error:', result)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending Telegram message:', error)
    return false
  }
}

// Send booking confirmation
export async function sendBookingConfirmation(
  chatId: number | string,
  booking: {
    id: string
    boatName: string
    date: string
    time: string
    hours: number
    totalPrice: number
  }
): Promise<boolean> {
  const text = `
🎉 <b>Бронирование подтверждено!</b>

🛥 Яхта: ${booking.boatName}
📅 Дата: ${booking.date}
🕐 Время: ${booking.time}
⏱ Продолжительность: ${booking.hours} ч.
💰 Стоимость: ${booking.totalPrice.toLocaleString('ru-RU')} ₽

📋 Номер брони: <code>${booking.id}</code>

Ждём вас на причале! 🌊
  `.trim()

  return sendTelegramMessage({
    chat_id: chatId,
    text,
    parse_mode: 'HTML'
  })
}

// Send booking reminder
export async function sendBookingReminder(
  chatId: number | string,
  booking: {
    boatName: string
    date: string
    time: string
    pier: string
  }
): Promise<boolean> {
  const text = `
⏰ <b>Напоминание о бронировании</b>

Завтра у вас прогулка на яхте!

🛥 Яхта: ${booking.boatName}
📅 Дата: ${booking.date}
🕐 Время: ${booking.time}
📍 Место: ${booking.pier}

До встречи! 🌊
  `.trim()

  return sendTelegramMessage({
    chat_id: chatId,
    text,
    parse_mode: 'HTML'
  })
}

// Edit existing message
export async function editTelegramMessage(params: {
  chat_id: number | string
  message_id: number
  text: string
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  reply_markup?: any
}): Promise<boolean> {
  try {
    const botToken = getBotToken()
    const url = `https://api.telegram.org/bot${botToken}/editMessageText`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    const result = await response.json()
    
    if (!result.ok) {
      console.error('Telegram editMessage error:', result)
      return false
    }

    return true
  } catch (error) {
    console.error('Error editing Telegram message:', error)
    return false
  }
}

// Answer callback query (for button clicks)
export async function answerCallbackQuery(params: {
  callback_query_id: string
  text?: string
  show_alert?: boolean
}): Promise<boolean> {
  try {
    const botToken = getBotToken()
    const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    const result = await response.json()
    
    if (!result.ok) {
      console.error('Telegram answerCallbackQuery error:', result)
      return false
    }

    return true
  } catch (error) {
    console.error('Error answering callback query:', error)
    return false
  }
}

// Send booking confirmed notification to customer
export async function sendBookingConfirmedNotification(
  chatId: number | string,
  booking: {
    id: string
    boatName: string
    date: string
    time: string
    hours: number
    totalPrice: number
    pier?: string
  }
): Promise<boolean> {
  const text = `
✅ <b>Ваше бронирование подтверждено!</b>

🛥 Яхта: ${booking.boatName}
📅 Дата: ${booking.date}
🕐 Время: ${booking.time}
⏱ Продолжительность: ${booking.hours} ч.
💰 Стоимость: ${booking.totalPrice.toLocaleString('ru-RU')} ₽
${booking.pier ? `📍 Место: ${booking.pier}` : ''}

📋 Номер брони: <code>${booking.id}</code>

Приходите на причал за 15 минут до начала прогулки.
Ждём вас! 🌊
  `.trim()

  return sendTelegramMessage({
    chat_id: chatId,
    text,
    parse_mode: 'HTML'
  })
}

// Send booking cancelled notification to customer
export async function sendBookingCancelledNotification(
  chatId: number | string,
  booking: {
    id: string
    boatName: string
    date: string
    time: string
  }
): Promise<boolean> {
  const text = `
❌ <b>Бронирование отменено</b>

К сожалению, ваше бронирование было отменено.

🛥 Яхта: ${booking.boatName}
📅 Дата: ${booking.date}
🕐 Время: ${booking.time}

📋 Номер брони: <code>${booking.id}</code>

Если у вас есть вопросы, свяжитесь с нами.
Вы всегда можете забронировать другое время! 🛥
  `.trim()

  return sendTelegramMessage({
    chat_id: chatId,
    text,
    parse_mode: 'HTML'
  })
}
