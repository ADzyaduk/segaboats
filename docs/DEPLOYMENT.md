# Руководство по развертыванию

## Обзор

Это руководство описывает процесс развертывания приложения "Яхты Сочи" на продакшн сервер.

## Требования

- Node.js 20+ или Docker
- PostgreSQL или SQLite (для разработки)
- n8n (опционально, для автоматизации)
- Telegram Bot Token
- VPS или облачный сервер (Ubuntu 20.04+ рекомендуется)

## Вариант 1: Развертывание с Docker

### 1. Подготовка

Склонируйте репозиторий:

```bash
git clone <repository-url>
cd boats2026
```

### 2. Настройка переменных окружения

Создайте файл `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/boats2026"

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=your-bot-username
TELEGRAM_WEBHOOK_SECRET=your-webhook-secret

# n8n
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
N8N_API_KEY=your-n8n-api-key

# App
NODE_ENV=production
APP_URL=https://your-domain.com
```

### 3. Сборка Docker образа

```bash
docker build -t boats2026:latest -f docker/Dockerfile .
```

### 4. Запуск с Docker Compose

```bash
docker-compose up -d
```

Это запустит:
- Приложение Nuxt
- PostgreSQL базу данных
- Nginx reverse proxy

### 5. Инициализация базы данных

```bash
docker-compose exec app npm run db:push
docker-compose exec app npm run db:seed
```

## Вариант 2: Развертывание на VPS

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Установка Nginx
sudo apt install -y nginx

# Установка PM2 для управления процессами
sudo npm install -g pm2
```

### 2. Настройка PostgreSQL

```bash
# Создание базы данных
sudo -u postgres psql
CREATE DATABASE boats2026;
CREATE USER boatsuser WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE boats2026 TO boatsuser;
\q
```

### 3. Клонирование и настройка приложения

```bash
# Клонирование репозитория
git clone <repository-url> /var/www/boats2026
cd /var/www/boats2026

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env
nano .env  # Отредактируйте файл
```

### 4. Сборка приложения

```bash
# Генерация Prisma клиента
npm run db:generate

# Применение миграций
npm run db:push

# Заполнение тестовыми данными (опционально)
npm run db:seed

# Сборка приложения
npm run build
```

### 5. Настройка PM2

Создайте файл `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'boats2026',
    script: '.output/server/index.mjs',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

Запустите приложение:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Настройка Nginx

Создайте файл `/etc/nginx/sites-available/boats2026`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/boats2026 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Настройка SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Настройка Telegram Bot

### 1. Создание бота

1. Откройте Telegram и найдите @BotFather
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните токен бота

### 2. Настройка Webhook

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-domain.com/api/telegram/webhook" \
  -d "secret_token=your-webhook-secret"
```

### 3. Проверка Webhook

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## Настройка n8n

См. [N8N_SETUP.md](./N8N_SETUP.md) для подробной инструкции.

## Мониторинг

### PM2 мониторинг

```bash
pm2 status
pm2 logs boats2026
pm2 monit
```

### Логи Nginx

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Логи приложения

```bash
pm2 logs boats2026
```

## Обновление приложения

### С Docker

```bash
git pull
docker-compose build
docker-compose up -d
docker-compose exec app npm run db:push
```

### С PM2

```bash
cd /var/www/boats2026
git pull
npm install
npm run db:generate
npm run db:push
npm run build
pm2 restart boats2026
```

## Резервное копирование

### База данных

```bash
# PostgreSQL
pg_dump -U boatsuser boats2026 > backup_$(date +%Y%m%d).sql

# SQLite
cp prisma/dev.db backup_$(date +%Y%m%d).db
```

### Автоматическое резервное копирование

Создайте скрипт `/usr/local/bin/backup-boats2026.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/boats2026"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U boatsuser boats2026 > $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
```

Добавьте в crontab:

```bash
0 2 * * * /usr/local/bin/backup-boats2026.sh
```

## Безопасность

### Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
```

### Защита базы данных

- Используйте сильные пароли
- Ограничьте доступ к PostgreSQL только с localhost
- Регулярно обновляйте PostgreSQL

## Troubleshooting

### Приложение не запускается

1. Проверьте логи: `pm2 logs boats2026`
2. Проверьте переменные окружения
3. Убедитесь, что база данных доступна
4. Проверьте порты: `netstat -tulpn | grep 3000`

### Ошибки базы данных

1. Проверьте подключение: `psql -U boatsuser -d boats2026`
2. Проверьте миграции: `npm run db:push`
3. Проверьте логи PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql-*.log`

### Проблемы с Nginx

1. Проверьте конфигурацию: `sudo nginx -t`
2. Проверьте логи: `sudo tail -f /var/log/nginx/error.log`
3. Перезапустите Nginx: `sudo systemctl restart nginx`

## Производительность

### Оптимизация Node.js

- Используйте PM2 cluster mode
- Настройте правильное количество инстансов (CPU cores)
- Используйте кэширование (Redis)

### Оптимизация базы данных

- Настройте индексы
- Регулярно делайте VACUUM для PostgreSQL
- Используйте connection pooling

### CDN для статики

- Настройте CDN для изображений
- Используйте Cloudflare или аналогичный сервис

## Дополнительные ресурсы

- [Nuxt Deployment Guide](https://nuxt.com/docs/getting-started/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Configuration](https://nginx.org/en/docs/)
