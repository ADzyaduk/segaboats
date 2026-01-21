# 🛥️ Boats2026 - Система бронирования яхт

Веб-приложение для аренды яхт в Сочи с интеграцией Telegram бота и автоматизацией через n8n.

## 🚀 Быстрый старт

### Установка на чистый сервер

```bash
# 1. Подключитесь к серверу
ssh root@your_server_ip

# 2. Установите Git (если нет)
apt-get update && apt-get install -y git

# 3. Клонируйте и запустите установку
cd /opt
git clone https://github.com/ADzyaduk/segaboats boats2026
cd boats2026
chmod +x scripts/fresh-server-deploy.sh
sudo ./scripts/fresh-server-deploy.sh
```

**Подробная инструкция:** [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📋 Технологии

- **Frontend/Backend:** Nuxt.js 3
- **Database:** PostgreSQL 16
- **Automation:** n8n
- **Reverse Proxy:** Nginx (системный)
- **Containerization:** Docker & Docker Compose

## 📁 Структура проекта

```
boats2026/
├── app/                    # Nuxt приложение
├── server/                 # API сервер
├── docker/                 # Docker конфигурация
├── nginx/                  # Nginx конфигурация
├── scripts/                # Скрипты развертывания
│   ├── fresh-server-deploy.sh  # Автоматическая установка
│   ├── install-docker.sh       # Установка Docker
│   ├── setup-system-nginx.sh   # Настройка Nginx
│   └── create-tables.sql       # SQL для БД
├── docker-compose.yml      # Docker Compose конфигурация
├── env.example            # Шаблон .env файла
└── DEPLOYMENT.md          # Инструкция по развертыванию
```

## ⚙️ Настройка

После установки отредактируйте `.env` файл:

```bash
nano /opt/boats2026/.env
```

Заполните обязательные поля:
- `TELEGRAM_BOT_TOKEN` - токен Telegram бота
- `TELEGRAM_BOT_USERNAME` - username бота
- `N8N_HOST` - ваш домен
- `NUXT_PUBLIC_APP_URL` - URL вашего сайта

## 🔧 Управление

```bash
# Статус контейнеров
docker compose ps

# Логи
docker compose logs -f

# Перезапуск
docker compose restart

# Обновление
git pull
docker compose build --no-cache app
docker compose up -d
```

## 📚 Документация

### Развёртывание и настройка
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Полная инструкция по развёртыванию обновлений
- [docs/SSL_SETUP.md](./docs/SSL_SETUP.md) - Настройка SSL для v-more.ru
- [env.example](./env.example) - Шаблон переменных окружения
- [docs/ENV_SETUP.md](./docs/ENV_SETUP.md) - Подробная настройка .env файла

### Telegram
- [docs/TELEGRAM_MINIAPP_SETUP.md](./docs/TELEGRAM_MINIAPP_SETUP.md) - Настройка Telegram Mini App
- [server/api/telegram/](./server/api/telegram/) - API для Telegram интеграции

### n8n Automation
- [n8n-workflows/README.md](./n8n-workflows/README.md) - Описание workflows
- [n8n-workflows/](./n8n-workflows/) - JSON файлы workflows для импорта

### Утилиты
- [scripts/diagnose-server.sh](./scripts/diagnose-server.sh) - Диагностика сервера
- [scripts/check-config.sh](./scripts/check-config.sh) - Проверка конфигурации

## 🐛 Решение проблем

См. раздел "Troubleshooting" в [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
