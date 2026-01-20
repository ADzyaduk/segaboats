#!/bin/bash
# Скрипт для деплоя проекта на новый сервер

set -e

PROJECT_DIR=${1:-"/opt/boats2026"}
GIT_REPO=${2:-""}

echo "🚀 Деплой проекта на сервер..."
echo "📁 Директория проекта: $PROJECT_DIR"

# Проверка root прав
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Запустите скрипт от root: sudo ./scripts/deploy-to-server.sh"
  exit 1
fi

# Создание директории проекта
echo "📁 Создание директории проекта..."
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Клонирование репозитория (если указан)
if [ -n "$GIT_REPO" ]; then
  echo "📥 Клонирование репозитория..."
  git clone "$GIT_REPO" .
else
  echo "⚠️  GIT_REPO не указан, пропускаю клонирование"
  echo "⚠️  Скопируйте файлы проекта в $PROJECT_DIR вручную"
fi

# Создание .env файла если его нет
if [ ! -f .env ]; then
  echo "📝 Создание .env файла..."
  cat > .env << EOF
# Database
POSTGRES_USER=boats
POSTGRES_PASSWORD=boats2026secret
POSTGRES_DB=boats2026

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret

# n8n
N8N_USER=admin
N8N_PASSWORD=admin2026
N8N_HOST=your_server_ip
N8N_WEBHOOK_URL=http://n8n:5678/webhook
N8N_API_KEY=your_n8n_api_key

# Admin
ADMIN_PASSWORD=admin2026

# Nginx
NGINX_HTTP_PORT=80
EOF
  echo "✅ .env файл создан, отредактируйте его!"
fi

# Установка прав
echo "🔐 Установка прав..."
chown -R $SUDO_USER:$SUDO_USER "$PROJECT_DIR" 2>/dev/null || true

# Сборка и запуск контейнеров
echo "🐳 Сборка и запуск Docker контейнеров..."
cd "$PROJECT_DIR"
docker compose build
docker compose up -d

echo ""
echo "✅ Деплой завершен!"
echo ""
echo "📝 Проверьте статус:"
echo "   docker compose ps"
echo ""
echo "📝 Просмотрите логи:"
echo "   docker compose logs -f"
echo ""
echo "📝 Отредактируйте .env файл:"
echo "   nano $PROJECT_DIR/.env"
echo "   docker compose restart"
