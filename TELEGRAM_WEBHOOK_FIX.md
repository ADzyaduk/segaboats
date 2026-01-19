# 🔧 Решение проблемы Telegram Webhook (HTTPS required)

## Проблема

Telegram требует **HTTPS** для webhook, но у вас только HTTP:
```
Bad Request: bad webhook: An HTTPS URL must be provided for webhook
```

## Решения

### Вариант 1: Использовать ngrok (быстрое решение для тестирования)

**ngrok** создает HTTPS туннель к вашему серверу.

1. **Установите ngrok на сервере:**
   ```bash
   # Скачайте ngrok
   wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
   tar xvzf ngrok-v3-stable-linux-amd64.tgz
   sudo mv ngrok /usr/local/bin/
   
   # Или через snap
   sudo snap install ngrok
   ```

2. **Зарегистрируйтесь на ngrok.com** и получите токен

3. **Запустите туннель:**
   ```bash
   ngrok config add-authtoken YOUR_NGROK_TOKEN
   ngrok http 80
   ```

4. **Скопируйте HTTPS URL** (например: `https://abc123.ngrok-free.app`)

5. **Настройте webhook с ngrok URL:**
   ```bash
   curl -X POST "https://api.telegram.org/bot8533883256:AAGGtdzBkMiPdswF49zAiYesz3eaqVyafkU/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://abc123.ngrok-free.app/api/telegram/webhook",
       "secret_token": "test-secret-123",
       "allowed_updates": ["message", "callback_query"]
     }'
   ```

**⚠️ Недостаток:** ngrok URL меняется при каждом перезапуске (если не используете платную версию).

---

### Вариант 2: Настроить SSL с Let's Encrypt (рекомендуется для продакшена)

1. **Установите certbot:**
   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Получите сертификат** (нужен домен, указывающий на ваш IP):
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Настройте nginx** для использования SSL (см. `nginx/conf.d/production.conf.example`)

4. **Используйте HTTPS URL:**
   ```bash
   curl -X POST "https://api.telegram.org/bot8533883256:AAGGtdzBkMiPdswF49zAiYesz3eaqVyafkU/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://your-domain.com/api/telegram/webhook",
       "secret_token": "test-secret-123",
       "allowed_updates": ["message", "callback_query"]
     }'
   ```

---

### Вариант 3: Cloudflare Tunnel (бесплатно, стабильно)

1. **Зарегистрируйтесь на Cloudflare**

2. **Установите cloudflared:**
   ```bash
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
   chmod +x cloudflared-linux-amd64
   sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
   ```

3. **Создайте туннель:**
   ```bash
   cloudflared tunnel create boats2026
   cloudflared tunnel route dns boats2026 your-subdomain.yourdomain.com
   cloudflared tunnel run boats2026
   ```

4. **Используйте HTTPS URL от Cloudflare**

---

### Вариант 4: Временное решение - Self-signed certificate (только для тестирования)

⚠️ **Не рекомендуется** - Telegram может не принять self-signed сертификат.

1. **Создайте self-signed сертификат:**
   ```bash
   sudo mkdir -p /opt/segaboats/nginx/ssl
   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /opt/segaboats/nginx/ssl/nginx-selfsigned.key \
     -out /opt/segaboats/nginx/ssl/nginx-selfsigned.crt
   ```

2. **Настройте nginx** для использования SSL

3. **Попробуйте настроить webhook** (может не сработать)

---

## Рекомендация

**Для быстрого тестирования:** Используйте **ngrok** (Вариант 1)

**Для продакшена:** Настройте **Let's Encrypt** (Вариант 2) или **Cloudflare Tunnel** (Вариант 3)

---

## После настройки HTTPS

1. **Проверьте webhook:**
   ```bash
   curl "https://api.telegram.org/bot8533883256:AAGGtdzBkMiPdswF49zAiYesz3eaqVyafkU/getWebhookInfo"
   ```

2. **Протестируйте бота:**
   - Найдите бота в Telegram
   - Отправьте `/start`
   - Бот должен ответить

3. **Проверьте логи:**
   ```bash
   docker-compose logs app | grep telegram
   ```
