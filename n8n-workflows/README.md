# n8n Workflows для Boats2026

## Быстрый старт

### 1. Доступ к n8n
```
URL: https://v-more.ru/n8n/
Логин: admin
Пароль: admin2026
```

### 2. Создание Credentials (ОБЯЗАТЕЛЬНО!)

Перед импортом workflow нужно создать credentials в **Settings → Credentials**:

#### Telegram Bot API
1. Нажми "Add Credential" → выбери "Telegram"
2. Название: `Telegram Bot`
3. Bot Token: `твой_токен_от_BotFather`
4. Сохрани

#### PostgreSQL (для напоминаний)
1. Нажми "Add Credential" → выбери "Postgres"
2. Название: `PostgreSQL`
3. Host: `db`
4. Database: `boats2026`
5. User: `boats`
6. Password: `boats2026_db_password` (из .env)
7. Port: `5432`
8. SSL: `disable`
9. Сохрани

### 3. Импорт Workflows

1. В n8n: **Workflows → Import from File**
2. Импортируй нужные файлы:

| Файл | Описание | Webhook путь |
|------|----------|--------------|
| `simple-test-webhook.json` | Тест Telegram | `/webhook/test` |
| `booking-created-notification.json` | Новое бронирование | `/webhook/booking-created` |
| `booking-confirmed-customer.json` | Подтверждение клиенту | `/webhook/booking-confirmed` |
| `ai-booking-notification.json` | AI-уведомление | `/webhook/booking-ai` |
| `smart-booking-reminder.json` | Напоминания (по расписанию) | - |

### 4. Настройка Chat ID

**ВАЖНО!** После импорта замени Chat ID в Telegram нодах на свой:

1. Открой workflow
2. Нажми на ноду "Telegram"
3. В поле "Chat ID" укажи свой ID

**Как узнать свой Chat ID:**
- Напиши боту [@userinfobot](https://t.me/userinfobot) в Telegram
- Он ответит твоим ID (число типа `413553084`)

### 5. Привязка Credentials

После импорта нужно привязать credentials к нодам:

1. Открой workflow
2. Нажми на ноду с красным предупреждением
3. В поле "Credential" выбери созданный credential
4. Повтори для всех нод

### 6. Активация

**КРИТИЧЕСКИ ВАЖНО!** Workflow не работает пока не активирован:

1. Открой workflow
2. В правом верхнем углу переключи **"Inactive" → "Active"**
3. Должна появиться зелёная точка

## Тестирование

### Тест Telegram соединения
```bash
curl -X POST https://v-more.ru/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"message":"Привет из curl!"}'
```

### Тест уведомления о бронировании
```bash
curl -X POST https://v-more.ru/webhook/booking-created \
  -H "Content-Type: application/json" \
  -d '{
    "event": "booking.created",
    "data": {
      "bookingId": "test-123",
      "customerName": "Иван Иванов",
      "customerPhone": "+7 900 123-45-67",
      "boatName": "Яхта Мечта",
      "startDate": "2026-01-25T10:00:00Z",
      "hours": 4,
      "totalPrice": 12000
    }
  }'
```

## Структура данных

### Бронирование (booking-created)
```json
{
  "event": "booking.created",
  "data": {
    "bookingId": "uuid",
    "boatId": "uuid",
    "boatName": "string",
    "customerName": "string",
    "customerPhone": "string",
    "startDate": "ISO date",
    "hours": "number",
    "totalPrice": "number"
  },
  "timestamp": "ISO date"
}
```

## Troubleshooting

### Webhook не срабатывает
1. Проверь что workflow **Active** (зелёная точка)
2. Проверь Executions → там должна быть запись
3. Посмотри логи: `docker logs boats2026-n8n`

### Telegram не отправляет
1. Проверь правильность Bot Token
2. Проверь Chat ID
3. Убедись что бот добавлен в чат (если это группа)

### Ошибка credentials
1. Открой workflow
2. Нажми на проблемную ноду
3. Выбери/создай credential заново
