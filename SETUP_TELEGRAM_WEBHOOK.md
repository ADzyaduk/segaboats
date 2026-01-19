# 📱 Настройка Telegram Webhook

## Шаг 1: Получите токен бота

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Введите имя бота (например: "Яхты Сочи")
4. Введите username бота (должен заканчиваться на `bot`, например: `yachts_sochi_bot`)
5. **Скопируйте токен** (формат: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Шаг 2: Заполните .env файл

```env
TELEGRAM_BOT_TOKEN=ваш-токен-от-BotFather
TELEGRAM_BOT_USERNAME=yachts_sochi_bot
TELEGRAM_WEBHOOK_SECRET=случайная-строка-для-безопасности
```

**Генерация секретного токена:**
```bash
# На Linux/Mac
openssl rand -hex 32

# Или просто придумайте случайную строку
# Например: mySecretToken2026RandomString
```

## Шаг 3: Настройте webhook

**На сервере выполните:**

```bash
# Замените YOUR_BOT_TOKEN и YOUR_SECRET на ваши значения из .env
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://155.212.189.214/api/telegram/webhook",
    "secret_token": "YOUR_SECRET",
    "allowed_updates": ["message", "callback_query"]
  }'
```

**Или через скрипт (если есть):**
```bash
cd /opt/segaboats
# Заполните .env
# Затем выполните команду выше с вашими значениями
```

## Шаг 4: Проверка webhook

```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

**Должен вернуться ответ:**
```json
{
  "ok": true,
  "result": {
    "url": "http://155.212.189.214/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## Шаг 5: Тестирование

1. Найдите вашего бота в Telegram
2. Отправьте команду `/start`
3. Бот должен ответить приветственным сообщением

## Troubleshooting

### Webhook не работает

1. Проверьте, что приложение запущено:
   ```bash
   docker-compose ps app
   ```

2. Проверьте логи:
   ```bash
   docker-compose logs app | grep telegram
   ```

3. Проверьте доступность endpoint:
   ```bash
   curl http://155.212.189.214/api/telegram/webhook
   ```

4. Убедитесь, что порт 80 открыт в firewall:
   ```bash
   sudo ufw allow 80/tcp
   ```

### "Invalid Telegram webhook secret"

- Проверьте, что `TELEGRAM_WEBHOOK_SECRET` в `.env` совпадает с `secret_token` в команде `setWebhook`
- Перезапустите контейнер после изменения `.env`:
  ```bash
  docker-compose restart app
  ```

### Бот не отвечает

1. Проверьте токен в `.env`
2. Проверьте логи приложения
3. Убедитесь, что webhook настроен правильно
