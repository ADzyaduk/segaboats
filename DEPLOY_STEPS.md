# 🚀 Инструкция по деплою

## Шаг 1: Закоммитьте и запушьте изменения

**На локальной машине:**

```powershell
# Проверьте изменения
git status

# Добавьте все изменения
git add .

# Закоммитьте
git commit -m "Настройка домена Beget для Telegram webhook"

# Запушьте в репозиторий
git push
```

## Шаг 2: На сервере - обновите код

**Подключитесь к серверу:**
```bash
ssh root@155.212.189.214
# или
ssh user@155.212.189.214
```

**Обновите код:**
```bash
cd /opt/segaboats
git pull
```

## Шаг 3: Обновите .env файл

```bash
nano .env
```

**Обновите строку:**
```env
APP_URL=https://klernesokof.beget.app
```

**Сохраните:** `Ctrl+O`, `Enter`, `Ctrl+X`

## Шаг 4: Перезапустите контейнеры

```bash
# Перезапустите nginx (чтобы применить новую конфигурацию)
docker-compose restart nginx

# Или пересоберите и перезапустите все
docker-compose down
docker-compose up -d --build
```

## Шаг 5: Проверьте, что все работает

```bash
# Проверьте статус контейнеров
docker-compose ps

# Проверьте логи nginx
docker-compose logs nginx

# Проверьте доступность домена
curl https://klernesokof.beget.app/health
```

## Шаг 6: Настройте Telegram webhook

```bash
curl -X POST "https://api.telegram.org/bot8533883256:AAGGtdzBkMiPdswF49zAiYesz3eaqVyafkU/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://klernesokof.beget.app/api/telegram/webhook",
    "secret_token": "test-secret-123",
    "allowed_updates": ["message", "callback_query"]
  }'
```

## Шаг 7: Проверьте webhook

```bash
curl "https://api.telegram.org/bot8533883256:AAGGtdzBkMiPdswF49zAiYesz3eaqVyafkU/getWebhookInfo"
```

**Должен вернуться:**
```json
{
  "ok": true,
  "result": {
    "url": "https://klernesokof.beget.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## Быстрая команда (все сразу)

Если хотите сделать все одной командой на сервере:

```bash
cd /opt/segaboats && \
git pull && \
docker-compose restart nginx && \
curl -X POST "https://api.telegram.org/bot8533883256:AAGGtdzBkMiPdswF49zAiYesz3eaqVyafkU/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://klernesokof.beget.app/api/telegram/webhook", "secret_token": "test-secret-123", "allowed_updates": ["message", "callback_query"]}'
```

**⚠️ Не забудьте обновить .env файл вручную!**
