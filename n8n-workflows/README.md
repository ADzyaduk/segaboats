# n8n Workflows для Яхты Сочи

## Установка

1. Откройте n8n UI: `https://v-more.store:5678` или через прокси
2. Импортируйте workflows через меню: **Workflows → Import from File**

## Настройка Credentials

### 1. PostgreSQL Boats
- **Type**: PostgreSQL
- **Host**: `postgres` (имя сервиса в docker-compose)
- **Port**: `5432`
- **Database**: `boats2026`
- **User**: `boats`
- **Password**: `boats2026secret` (или из .env)

### 2. OpenRouter API
- **Type**: HTTP Header Auth
- **Name**: `OpenRouter API`
- **Header Name**: `Authorization`
- **Header Value**: `Bearer YOUR_OPENROUTER_API_KEY`

Получить ключ: https://openrouter.ai/keys

### 3. Telegram Bot
- **Type**: Telegram
- **Bot Token**: Токен от @BotFather

## Workflows

### 1. `ai-booking-notification.json`
**Умное уведомление о новом бронировании**

- Триггер: Webhook POST `/webhook/booking-created`
- AI генерирует персонализированное сообщение для админа
- AI генерирует подтверждение для клиента (если есть Telegram)
- Fallback: уведомление только админу

### 2. `smart-booking-reminder.json`
**Автоматические напоминания**

- Триггер: Schedule (каждый час)
- Проверяет бронирования на ближайшие 24 часа
- AI генерирует персонализированное напоминание
- Для клиентов без Telegram — уведомляет админа для ручного звонка

### 3. `booking-created-notification.json` (legacy)
Простое уведомление админу без AI.

### 4. `booking-confirmed-customer.json` (legacy)
Уведомление клиенту о подтверждении.

## Переменные окружения

Добавьте в `.env` на сервере:

```env
OPENROUTER_API_KEY=sk-or-v1-...
TELEGRAM_ADMIN_CHAT_ID=123456789
```

`TELEGRAM_ADMIN_CHAT_ID` — ID чата/группы для уведомлений админа.
Узнать свой chat_id: напишите боту @userinfobot

## Тестирование

```bash
# Тест webhook
curl -X POST https://v-more.store/webhook/booking-created \
  -H "Content-Type: application/json" \
  -d '{
    "event": "booking.created",
    "data": {
      "bookingId": "test123",
      "customerName": "Иван Тест",
      "customerPhone": "+7 900 123-45-67",
      "boatName": "Яхта Мечта",
      "startDate": "2026-01-25 14:00",
      "hours": 3,
      "totalPrice": 15000
    }
  }'
```
