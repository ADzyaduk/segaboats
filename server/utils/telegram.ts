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
  try {
    const config = useRuntimeConfig()
    const token = config.telegramBotToken
    
    if (!token) {
      console.error('[telegram] ❌ TELEGRAM_BOT_TOKEN is not configured in runtime config')
      throw new Error('TELEGRAM_BOT_TOKEN is not configured')
    }
    
    const tokenStr = String(token).trim()
    if (!tokenStr || tokenStr === 'undefined' || tokenStr === 'null') {
      console.error('[telegram] ❌ TELEGRAM_BOT_TOKEN is invalid:', token)
      throw new Error('TELEGRAM_BOT_TOKEN is invalid')
    }
    
    return tokenStr
  } catch (error: any) {
    console.error('[telegram] ❌ Error getting bot token:', error?.message)
    throw error
  }
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

// Send message and return message ID
export async function sendTelegramMessageWithId(message: TelegramMessage): Promise<{ success: boolean; messageId?: number }> {
  try {
    const botToken = getBotToken()
    
    if (!botToken || botToken === 'undefined' || botToken === 'null') {
      console.error('[telegram] ❌ Bot token is invalid or not configured')
      return { success: false }
    }
    
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    
    console.log('[telegram] 📤 Sending message to chat:', message.chat_id)
    console.log('[telegram] Message preview:', message.text.substring(0, 100) + '...')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    })

    const result = await response.json()
    
    if (!result.ok) {
      console.error('[telegram] ❌ Telegram API error:', {
        ok: result.ok,
        error_code: result.error_code,
        description: result.description,
        parameters: result.parameters
      })
      return { success: false }
    }

    console.log('[telegram] ✅ Message sent successfully, ID:', result.result.message_id)
    return { success: true, messageId: result.result.message_id }
  } catch (error: any) {
    console.error('[telegram] ❌ Error sending Telegram message:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    return { success: false }
  }
}

// Send admin notification with inline buttons
export async function sendAdminNotification(
  chatId: string | number,
  text: string,
  buttons?: { inline_keyboard: any[][] }
): Promise<{ success: boolean; messageId?: number }> {
  const message: TelegramMessage = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML'
  }

  if (buttons) {
    message.reply_markup = buttons
  }

  return sendTelegramMessageWithId(message)
}

// Format booking message for admin
export function formatBookingMessage(data: {
  type: 'new' | 'update'
  bookingId: string
  boatName: string
  customerName: string
  customerPhone: string
  startDate: Date
  hours: number
  totalPrice: number
  passengers: number
  customerEmail?: string | null
  customerNotes?: string | null
  status?: string
}): string {
  const dateStr = data.startDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const timeStr = data.startDate.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })

  let message = ''
  
  if (data.type === 'new') {
    message = `🆕 <b>Новое бронирование</b>\n\n`
  } else {
    message = `📝 <b>Бронирование обновлено</b>\n\n`
  }

  message += `🛥 <b>Яхта:</b> ${data.boatName}\n`
  message += `👤 <b>Клиент:</b> ${data.customerName}\n`
  message += `📞 <b>Телефон:</b> ${data.customerPhone}\n`
  if (data.customerEmail) {
    message += `📧 <b>Email:</b> ${data.customerEmail}\n`
  }
  message += `📅 <b>Дата:</b> ${dateStr}\n`
  message += `🕐 <b>Время:</b> ${timeStr}\n`
  message += `⏱ <b>Продолжительность:</b> ${data.hours} ч.\n`
  message += `👥 <b>Пассажиров:</b> ${data.passengers}\n`
  message += `💰 <b>Сумма:</b> ${data.totalPrice.toLocaleString('ru-RU')} ₽\n`
  
  if (data.status) {
    const statusEmoji = {
      'PENDING': '⏳',
      'CONFIRMED': '✅',
      'PAID': '💳',
      'CANCELLED': '❌',
      'COMPLETED': '✔️'
    }
    message += `\n📊 <b>Статус:</b> ${statusEmoji[data.status as keyof typeof statusEmoji] || ''} ${data.status}\n`
  }

  if (data.customerNotes) {
    message += `\n📝 <b>Примечания:</b> ${data.customerNotes}\n`
  }

  message += `\n📋 <b>ID:</b> <code>${data.bookingId}</code>`

  return message
}

// Format ticket message for admin
export function formatTicketMessage(data: {
  type: 'new' | 'update'
  ticketId: string
  serviceTitle: string
  customerName: string
  customerPhone: string
  desiredDate?: Date | null
  totalPrice: number
  serviceType: string
  status?: string
  adultTickets?: number
  childTickets?: number
}): string {
  let message = ''
  
  if (data.type === 'new') {
    message = `🎫 <b>Новый билет</b>\n\n`
  } else {
    message = `📝 <b>Билет обновлён</b>\n\n`
  }

  message += `🎯 <b>Услуга:</b> ${data.serviceTitle}\n`
  message += `👤 <b>Клиент:</b> ${data.customerName}\n`
  message += `📞 <b>Телефон:</b> ${data.customerPhone}\n`
  
  if (data.desiredDate) {
    const dateStr = data.desiredDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    message += `📅 <b>Желаемая дата:</b> ${dateStr}\n`
  }
  
  const adultTickets = data.adultTickets ?? 1
  const childTickets = data.childTickets ?? 0
  const totalTickets = adultTickets + childTickets
  
  if (totalTickets > 1 || childTickets > 0) {
    message += `🎫 <b>Билетов:</b> ${totalTickets} (взрослых: ${adultTickets}, детских: ${childTickets})\n`
    if (adultTickets > 0 && childTickets > 0) {
      // Calculate prices from total (approximate)
      const estimatedAdultPrice = Math.floor(data.totalPrice / (adultTickets + childTickets * 0.5))
      const estimatedChildPrice = Math.floor(estimatedAdultPrice * 0.5)
      message += `💰 <b>Взрослых:</b> ${adultTickets} × ${estimatedAdultPrice.toLocaleString('ru-RU')} ₽ = ${(estimatedAdultPrice * adultTickets).toLocaleString('ru-RU')} ₽\n`
      message += `💰 <b>Детских:</b> ${childTickets} × ${estimatedChildPrice.toLocaleString('ru-RU')} ₽ = ${(estimatedChildPrice * childTickets).toLocaleString('ru-RU')} ₽\n`
    }
    message += `💰 <b>Общая сумма:</b> ${data.totalPrice.toLocaleString('ru-RU')} ₽\n`
  } else {
    message += `💰 <b>Сумма:</b> ${data.totalPrice.toLocaleString('ru-RU')} ₽\n`
  }
  
  if (data.status) {
    const statusEmoji = {
      'PENDING': '⏳',
      'CONFIRMED': '✅',
      'CANCELLED': '❌'
    }
    message += `\n📊 <b>Статус:</b> ${statusEmoji[data.status as keyof typeof statusEmoji] || ''} ${data.status}\n`
  }

  message += `\n📋 <b>ID:</b> <code>${data.ticketId}</code>`

  return message
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
