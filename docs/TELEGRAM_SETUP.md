# Настройка Telegram бота

## Обзор

Telegram бот используется для:
- Telegram Mini App (веб-приложение внутри Telegram)
- Уведомления пользователям
- Уведомления админам
- Обработка команд

## Создание бота

### 1. Создание через BotFather

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Введите имя бота (например: "Яхты Сочи")
4. Введите username бота (должен заканчиваться на `bot`, например: `yachts_sochi_bot`)
5. Сохраните токен бота (формат: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Настройка бота

```bash
# Установить описание
/setdescription @your_bot_username
Описание: Аренда яхт в Сочи. Онлайн бронирование яхт и катеров.

# Установить команды
/setcommands @your_bot_username
start - Начать работу с ботом
help - Помощь
catalog - Открыть каталог яхт
```

### 3. Настройка Mini App

```bash
# Установить кнопку меню
/setmenubutton @your_bot_username
# Введите текст кнопки: "Открыть каталог"
# Введите URL: https://your-domain.com
```

## Настройка переменных окружения

Добавьте в `.env`:

```env
TELEGRAM_BOT_TOKEN=your-bot-token-here
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_WEBHOOK_SECRET=your-secret-token-here
```

## Настройка Webhook

### Вариант 1: Через API (рекомендуется)

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/telegram/webhook",
    "secret_token": "your-webhook-secret",
    "allowed_updates": ["message", "callback_query"]
  }'
```

### Вариант 2: Через код

Используйте скрипт `scripts/setup-telegram-webhook.ts`:

```bash
npm run setup:telegram-webhook
```

### Проверка Webhook

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

Ответ должен содержать:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-domain.com/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## Telegram Mini App

### Настройка домена

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/newapp`
3. Выберите вашего бота
4. Введите название приложения
5. Укажите короткое описание
6. Загрузите иконку (512x512px)
7. Укажите URL: `https://your-domain.com`
8. Сохраните полученный App ID

### Настройка в приложении

В `nuxt.config.ts` уже настроена поддержка Telegram Mini App.

В компонентах используйте:

```typescript
const { isTelegram, user, themeParams } = useTelegram()

// Проверка, что приложение открыто в Telegram
if (isTelegram.value) {
  // Telegram специфичная логика
}

// Получение данных пользователя
const userName = user.value?.first_name

// Применение темы Telegram
const bgColor = themeParams.value.bg_color
```

## Команды бота

### /start

Приветственное сообщение с кнопкой для открытия Mini App.

**Реализация:** `server/api/telegram/webhook.post.ts`

### /help

Справка по использованию бота.

### /catalog

Открывает каталог яхт в Mini App.

## Уведомления

### Отправка уведомлений пользователям

```typescript
import { sendTelegramMessage } from '~~/server/utils/telegram'

await sendTelegramMessage({
  chat_id: userTelegramId,
  text: 'Ваше бронирование подтверждено!',
  parse_mode: 'HTML'
})
```

### Отправка уведомлений админам

```typescript
// Получить chat_id админа из базы данных или конфига
const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID

await sendTelegramMessage({
  chat_id: adminChatId,
  text: 'Новое бронирование!',
  reply_markup: {
    inline_keyboard: [[
      { text: 'Подтвердить', callback_data: 'confirm_123' },
      { text: 'Отменить', callback_data: 'cancel_123' }
    ]]
  }
})
```

## Валидация WebApp данных

Система автоматически валидирует данные Telegram WebApp для безопасности.

**Как это работает:**
1. Telegram отправляет `initData` в Mini App
2. Приложение отправляет `initData` на `/api/telegram/auth`
3. Сервер валидирует подпись используя bot token
4. Если валидация успешна, создается/обновляется пользователь

**Безопасность:**
- Все данные подписаны HMAC-SHA256
- Проверяется время создания (не старше 24 часов)
- Используется секретный ключ на основе bot token

## Тестирование

### Локальное тестирование

1. Используйте [ngrok](https://ngrok.com/) для туннелирования:
```bash
ngrok http 3000
```

2. Установите webhook на ngrok URL:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-ngrok-url.ngrok.io/api/telegram/webhook"
```

3. Откройте бота в Telegram и протестируйте команды

### Тестирование Mini App

1. Откройте бота в Telegram
2. Нажмите на кнопку меню или отправьте `/start`
3. Нажмите на кнопку "Открыть каталог"
4. Mini App должно открыться в Telegram

## Troubleshooting

### Webhook не работает

1. **Проверьте URL:**
   - Должен быть HTTPS
   - Должен быть доступен из интернета
   - Должен возвращать 200 OK

2. **Проверьте логи:**
   ```bash
   pm2 logs boats2026
   # или
   docker logs boats2026-app
   ```

3. **Проверьте webhook info:**
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```

### Mini App не открывается

1. **Проверьте домен:**
   - Должен быть HTTPS
   - Должен быть в списке разрешенных доменов бота

2. **Проверьте консоль браузера:**
   - Откройте DevTools в Telegram Desktop
   - Проверьте ошибки JavaScript

3. **Проверьте CORS:**
   - Убедитесь, что сервер разрешает запросы из Telegram

### Ошибки валидации

1. **Проверьте bot token:**
   - Убедитесь, что токен правильный
   - Проверьте, что токен не истек

2. **Проверьте время:**
   - Убедитесь, что время сервера синхронизировано
   - initData не должен быть старше 24 часов

## Безопасность

### Рекомендации

1. **Храните токен в безопасности:**
   - Никогда не коммитьте токен в git
   - Используйте переменные окружения
   - Ограничьте доступ к `.env` файлу

2. **Используйте webhook secret:**
   - Генерируйте случайный секретный токен
   - Проверяйте secret_token в webhook запросах

3. **Валидируйте все данные:**
   - Всегда валидируйте initData
   - Проверяйте подписи
   - Не доверяйте данным от клиента

4. **Ограничьте доступ:**
   - Используйте firewall
   - Ограничьте IP адреса Telegram (если возможно)

## Дополнительные ресурсы

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [BotFather](https://t.me/BotFather)
