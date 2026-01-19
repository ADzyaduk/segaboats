# 🌐 Настройка домена Beget для Telegram Webhook

## Проверка домена

Ваш домен: `https://klernesokof.beget.app/`

Это **HTTPS домен**, который можно использовать для Telegram webhook!

## Шаг 1: Проверьте, что домен указывает на ваш сервер

```bash
# Проверьте DNS запись
nslookup klernesokof.beget.app

# Должен вернуться IP: 155.212.189.214
```

Если IP не совпадает, нужно настроить DNS в панели Beget.

## Шаг 2: Настройте nginx для работы с доменом

Обновите `nginx/conf.d/default.conf`:

```nginx
server {
    listen 80;
    server_name klernesokof.beget.app;

    # Redirect HTTP to HTTPS (Beget автоматически предоставляет SSL)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name klernesokof.beget.app;

    # SSL сертификаты (Beget предоставляет автоматически)
    # Если нужно указать вручную, используйте:
    # ssl_certificate /etc/nginx/ssl/fullchain.pem;
    # ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # Основное приложение
    location / {
        proxy_pass http://nuxt_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://nuxt_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Telegram webhook endpoint
    location /api/telegram/webhook {
        proxy_pass http://nuxt_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Telegram-Bot-Api-Secret-Token $http_x_telegram_bot_api_secret_token;
    }

    # n8n webhooks
    location /webhook/ {
        proxy_pass http://n8n_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static images
    location /images/ {
        proxy_pass http://nuxt_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

## Шаг 3: Обновите .env файл

```env
APP_URL=https://klernesokof.beget.app
```

## Шаг 4: Настройте Telegram webhook

```bash
curl -X POST "https://api.telegram.org/bot8533883256:AAGGtdzBkMiPdswF49zAiYesz3eaqVyafkU/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://klernesokof.beget.app/api/telegram/webhook",
    "secret_token": "test-secret-123",
    "allowed_updates": ["message", "callback_query"]
  }'
```

## Шаг 5: Проверка

1. **Проверьте webhook:**
   ```bash
   curl "https://api.telegram.org/bot8533883256:AAGGtdzBkMiPdswF49zAiYesz3eaqVyafkU/getWebhookInfo"
   ```

2. **Проверьте доступность домена:**
   ```bash
   curl https://klernesokof.beget.app/health
   ```

3. **Протестируйте бота:**
   - Найдите бота в Telegram
   - Отправьте `/start`
   - Бот должен ответить

## Важно

- ✅ Beget автоматически предоставляет SSL сертификат
- ✅ Домен должен указывать на IP: `155.212.189.214`
- ✅ Если домен не работает, проверьте настройки DNS в панели Beget
- ✅ После настройки nginx перезапустите контейнер: `docker-compose restart nginx`

## Если домен не указывает на ваш сервер

В панели Beget:
1. Зайдите в управление DNS
2. Добавьте A-запись:
   - Имя: `klernesokof` (или `@` для корневого домена)
   - Тип: `A`
   - Значение: `155.212.189.214`
   - TTL: `3600`

Подождите несколько минут для распространения DNS.
