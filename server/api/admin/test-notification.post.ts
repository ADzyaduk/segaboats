// Test notification endpoint for debugging
// POST /api/admin/test-notification

import { sendAdminNotification } from '~~/server/utils/telegram'
import { getAdminChatId } from '~~/server/utils/notifications'

export default defineEventHandler(async (event) => {
  try {
    console.log('[test-notification] Testing admin notification...')
    
    const config = useRuntimeConfig()
    const adminChatId = config.telegramAdminChatId
    const botToken = config.telegramBotToken
    
    // Check configuration
    const configStatus = {
      hasBotToken: !!botToken && botToken !== 'undefined' && botToken !== 'null',
      hasAdminChatId: !!adminChatId && String(adminChatId) !== 'undefined' && String(adminChatId) !== 'null',
      adminChatId: adminChatId ? String(adminChatId) : null,
      botTokenPreview: botToken ? `${botToken.substring(0, 10)}...` : null
    }
    
    console.log('[test-notification] Configuration:', configStatus)
    
    if (!configStatus.hasBotToken) {
      return {
        success: false,
        error: 'TELEGRAM_BOT_TOKEN not configured',
        config: configStatus
      }
    }
    
    if (!configStatus.hasAdminChatId) {
      return {
        success: false,
        error: 'TELEGRAM_ADMIN_CHAT_ID not configured',
        config: configStatus
      }
    }
    
    // Send test notification
    const testMessage = `
🧪 <b>Тестовое уведомление</b>

Это тестовое сообщение для проверки системы уведомлений.

✅ Бот токен: настроен
✅ Admin Chat ID: ${adminChatId}
🕐 Время: ${new Date().toLocaleString('ru-RU')}

Если вы получили это сообщение, система уведомлений работает корректно!
    `.trim()
    
    console.log('[test-notification] Sending test message to:', adminChatId)
    const result = await sendAdminNotification(adminChatId!, testMessage)
    
    if (result.success) {
      console.log('[test-notification] ✅ Test notification sent successfully, message ID:', result.messageId)
      return {
        success: true,
        message: 'Тестовое уведомление отправлено успешно',
        messageId: result.messageId,
        config: configStatus,
        timestamp: new Date().toISOString()
      }
    } else {
      console.error('[test-notification] ❌ Failed to send test notification')
      return {
        success: false,
        error: 'Не удалось отправить тестовое уведомление',
        config: configStatus,
        timestamp: new Date().toISOString()
      }
    }
  } catch (error: any) {
    console.error('[test-notification] ❌ Error:', error)
    return {
      success: false,
      error: error?.message || 'Неизвестная ошибка',
      details: error?.stack,
      timestamp: new Date().toISOString()
    }
  }
})
