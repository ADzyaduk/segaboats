# ⚡ Быстрый старт

## Установка на чистый Ubuntu сервер

### 1. Подключитесь к серверу

```bash
ssh root@your_server_ip
```

### 2. Выполните одну команду

```bash
cd /opt && git clone https://github.com/ADzyaduk/segaboats boats2026 && cd boats2026 && chmod +x scripts/fresh-server-deploy.sh && sudo ./scripts/fresh-server-deploy.sh
```

### 3. Настройте .env файл

```bash
nano /opt/boats2026/.env
```

**Обязательно заполните:**
- `TELEGRAM_BOT_TOKEN` - токен вашего Telegram бота
- `TELEGRAM_BOT_USERNAME` - username бота (без @)
- `TELEGRAM_WEBHOOK_SECRET` - любой случайный секретный ключ
- `N8N_HOST` - ваш домен (например: `example.com`)
- `N8N_WEBHOOK_URL` - `https://your_domain/webhook`
- `NUXT_PUBLIC_APP_URL` - `https://your_domain`

### 4. Перезапустите контейнеры

```bash
cd /opt/boats2026
docker compose restart
```

### 5. Проверьте

```bash
# Статус
docker compose ps

# Логи
docker compose logs -f

# Сайт
curl http://localhost
```

## ✅ Готово!

Откройте ваш домен в браузере. Сайт должен работать.

**Подробная инструкция:** [DEPLOYMENT.md](./DEPLOYMENT.md)
