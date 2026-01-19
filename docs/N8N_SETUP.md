# Настройка n8n для автоматизации

## Обзор

n8n используется для автоматизации бизнес-процессов в системе бронирования яхт:
- Отправка уведомлений (SMS, Email, Telegram)
- Автоматизация подтверждений
- Интеграции с внешними сервисами

## Установка n8n

### Вариант 1: Docker (рекомендуется)

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### Вариант 2: npm

```bash
npm install n8n -g
n8n start
```

### Вариант 3: n8n Cloud

Используйте облачный сервис n8n: https://n8n.io/cloud

## Настройка переменных окружения

Добавьте в `.env`:

```env
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
N8N_API_KEY=your-api-key-here
```

## Webhook endpoints

Система отправляет события на следующие webhook пути:

- `/webhook/booking-created` - новое бронирование
- `/webhook/booking-confirmed` - бронирование подтверждено
- `/webhook/booking-cancelled` - бронирование отменено
- `/webhook/payment-received` - получена оплата
- `/webhook/user-registered` - новый пользователь зарегистрирован

## Примеры Workflows

### 1. Уведомление админу о новом бронировании

**Триггер:** Webhook
- Метод: POST
- Путь: `/booking-created`

**Действия:**
1. Telegram Bot - отправить сообщение админу
2. Email - отправить уведомление на email админа

**Пример payload:**
```json
{
  "event": "booking.created",
  "data": {
    "bookingId": "cmk...",
    "boatId": "cmk...",
    "boatName": "Лазурная мечта",
    "customerName": "Иван Иванов",
    "customerPhone": "+7 (900) 123-45-67",
    "startDate": "2026-01-15T10:00:00Z",
    "hours": 3,
    "totalPrice": 45000
  },
  "timestamp": "2026-01-12T10:00:00Z"
}
```

### 2. Подтверждение бронирования клиенту

**Триггер:** Webhook
- Метод: POST
- Путь: `/booking-confirmed`

**Действия:**
1. Telegram Bot - отправить сообщение клиенту (если есть telegramId)
2. SMS - отправить SMS с подтверждением
3. Email - отправить письмо с деталями

### 3. Напоминание за 24 часа

**Триггер:** Cron (каждый час)
- Проверяет бронирования через 24 часа

**Действия:**
1. HTTP Request - получить список бронирований через API
2. Filter - отфильтровать бронирования через 24 часа
3. Telegram Bot - отправить напоминание
4. SMS - отправить SMS напоминание

### 4. Автоматическая отмена неоплаченных

**Триггер:** Cron (каждые 30 минут)
- Проверяет неоплаченные бронирования старше 2 часов

**Действия:**
1. HTTP Request - получить неоплаченные бронирования
2. Filter - отфильтровать старше 2 часов
3. HTTP Request - отменить бронирование через API
4. Telegram Bot - уведомить клиента об отмене

## Интеграция с Telegram Bot

### Настройка Telegram Bot в n8n

1. Создайте бота через @BotFather
2. Получите токен бота
3. В n8n добавьте узел "Telegram"
4. Введите токен бота
5. Выберите метод "Send Message"

**Пример конфигурации:**
```
Chat ID: {{ $json.data.adminChatId }} (для админов)
Text: Новое бронирование!
Яхта: {{ $json.data.boatName }}
Клиент: {{ $json.data.customerName }}
Телефон: {{ $json.data.customerPhone }}
Дата: {{ $json.data.startDate }}
Стоимость: {{ $json.data.totalPrice }} ₽
```

## Интеграция с SMS сервисом

### Пример с Twilio

1. Добавьте узел "Twilio"
2. Настройте Account SID и Auth Token
3. Укажите номер отправителя
4. Настройте шаблон сообщения

### Пример с SMS.ru

1. Добавьте узел "HTTP Request"
2. URL: `https://sms.ru/sms/send`
3. Метод: POST
4. Headers: `X-API-KEY: your-api-key`
5. Body:
```json
{
  "to": "{{ $json.data.customerPhone }}",
  "msg": "Ваше бронирование подтверждено! Дата: {{ $json.data.startDate }}"
}
```

## Интеграция с Email

### SMTP настройка

1. Добавьте узел "Email Send"
2. Настройте SMTP сервер
3. Укажите отправителя и получателя
4. Настройте шаблон письма

**Пример шаблона:**
```
Тема: Подтверждение бронирования яхты

Здравствуйте, {{ $json.data.customerName }}!

Ваше бронирование подтверждено:
Яхта: {{ $json.data.boatName }}
Дата: {{ $json.data.startDate }}
Продолжительность: {{ $json.data.hours }} часов
Стоимость: {{ $json.data.totalPrice }} ₽

Мы свяжемся с вами для уточнения деталей.
```

## Синхронизация с Google Calendar

1. Добавьте узел "Google Calendar"
2. Авторизуйтесь через OAuth
3. Настройте создание события:

**Параметры события:**
- Summary: `Бронирование: {{ $json.data.boatName }}`
- Start: `{{ $json.data.startDate }}`
- End: `{{ $json.data.endDate }}`
- Description: `Клиент: {{ $json.data.customerName }}, Телефон: {{ $json.data.customerPhone }}`

## API для управления из n8n

Система предоставляет API endpoints для управления бронированиями:

### Получить список бронирований

```
GET /api/admin/bookings
Authorization: Bearer {admin-token}
```

### Обновить статус бронирования

```
PUT /api/admin/bookings/{id}
Authorization: Bearer {admin-token}
Body: { "status": "CONFIRMED" }
```

## Тестирование workflows

### Использование Postman/curl

```bash
curl -X POST https://your-n8n-instance.com/webhook/booking-created \
  -H "Content-Type: application/json" \
  -d '{
    "event": "booking.created",
    "data": {
      "bookingId": "test-123",
      "boatName": "Тестовая яхта",
      "customerName": "Тестовый клиент",
      "customerPhone": "+7 (900) 123-45-67",
      "startDate": "2026-01-15T10:00:00Z",
      "hours": 3,
      "totalPrice": 45000
    }
  }'
```

## Мониторинг и логи

- Все webhook запросы логируются в консоль сервера
- n8n сохраняет историю выполнения workflows
- Проверяйте логи на ошибки: `docker logs n8n`

## Безопасность

1. **Используйте API ключи** для защиты webhooks
2. **Ограничьте доступ** к n8n только из внутренней сети
3. **Используйте HTTPS** для всех webhook URL
4. **Валидируйте данные** в workflows перед обработкой

## Troubleshooting

### Webhook не срабатывает

1. Проверьте URL в `.env`
2. Убедитесь, что n8n доступен из сети
3. Проверьте логи сервера на ошибки
4. Проверьте, что workflow активен в n8n

### Ошибки в workflows

1. Проверьте логи выполнения в n8n UI
2. Убедитесь, что все credentials настроены
3. Проверьте формат данных в payload
4. Используйте Debug режим в n8n

## Дополнительные ресурсы

- [Документация n8n](https://docs.n8n.io/)
- [Примеры workflows](https://n8n.io/workflows/)
- [Интеграции n8n](https://n8n.io/integrations/)
