# ✅ Проверенный .env файл

## Проблемы, которые были исправлены:

1. ❌ Отсутствовал `ADMIN_PASSWORD` - добавлен
2. ❌ `N8N_HOST=localhost` - изменено на IP сервера
3. ❌ `APP_URL=http://localhost` - изменено на IP сервера
4. ✅ Telegram токены заполнены корректно
5. ✅ База данных настроена правильно

## Исправленный .env файл:

```env
# ============================================
# База данных PostgreSQL
# ============================================
POSTGRES_USER=boats
POSTGRES_PASSWORD=boats2026secret
POSTGRES_DB=boats2026
DATABASE_URL=postgresql://boats:boats2026secret@postgres:5432/boats2026?schema=public

# ============================================
# Админ-панель (ОБЯЗАТЕЛЬНО!)
# ============================================
ADMIN_PASSWORD=Admin2026

# ============================================
# Telegram Bot
# ============================================
TELEGRAM_BOT_TOKEN=8533883256:AAGGtdzBkMiPdswF49zAiYesz3eaqVyafkU
TELEGRAM_BOT_USERNAME=kazan8nbot
TELEGRAM_WEBHOOK_SECRET=test-secret-123

# ============================================
# n8n Automation
# ============================================
N8N_WEBHOOK_URL=http://n8n:5678/webhook
N8N_API_KEY=
N8N_USER=admin
N8N_PASSWORD=Admin2026
N8N_HOST=155.212.189.214

# ============================================
# Приложение
# ============================================
NODE_ENV=production
APP_URL=https://klernesokof.beget.app

# ============================================
# Nginx (опционально)
# ============================================
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
```

## Что изменилось:

1. ✅ Добавлен `ADMIN_PASSWORD=Admin2026` (используйте надежный пароль!)
2. ✅ `N8N_HOST` изменен с `localhost` на `155.212.189.214`
3. ✅ `APP_URL` изменен с `http://localhost` на `http://155.212.189.214`
4. ✅ Убраны кавычки из `DATABASE_URL` (не обязательны в .env)

## Следующие шаги:

1. **Скопируйте исправленный .env на сервер:**
   ```bash
   # На сервере
   cd /opt/segaboats
   nano .env
   # Вставьте исправленную версию выше
   ```

2. **Настройте Telegram webhook:**
   ```bash
   curl -X POST "https://api.telegram.org/bot8533883256:AAGGtdzBkMiPdswF49zAiYesz3eaqVyafkU/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://klernesokof.beget.app/api/telegram/webhook",
       "secret_token": "test-secret-123",
       "allowed_updates": ["message", "callback_query"]
     }'
   ```

3. **Проверьте webhook:**
   ```bash
   curl "https://api.telegram.org/bot8533883256:AAGGtdzBkMiPdswF49zAiYesz3eaqVyafkU/getWebhookInfo"
   ```

4. **Перезапустите контейнеры:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

## Важно:

- 🔒 **ADMIN_PASSWORD** - используйте надежный пароль (не используйте `Admin2026` в продакшене!)
- 🌐 **N8N_HOST** и **APP_URL** должны указывать на IP сервера, а не localhost
- 📱 Telegram webhook должен быть настроен после деплоя
