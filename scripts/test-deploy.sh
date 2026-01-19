#!/bin/bash
# Скрипт тестового деплоя без настройки .env
# Использует значения по умолчанию для быстрого тестирования

set -e

echo "🧪 Тестовый деплой Boats2026 (без настройки .env)"
echo "================================================"
echo ""

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен!"
    exit 1
fi

# Создаем минимальный .env для тестирования, если его нет
if [ ! -f .env ]; then
    echo "📝 Создание минимального .env для тестирования..."
    cat > .env << 'EOF'
# Минимальная конфигурация для тестирования
DATABASE_URL="postgresql://boats:boats2026secret@postgres:5432/boats2026?schema=public"

# Telegram (можно оставить пустым для теста)
TELEGRAM_BOT_TOKEN=test-token
TELEGRAM_BOT_USERNAME=test-bot
TELEGRAM_WEBHOOK_SECRET=test-secret-123

# n8n (опционально)
N8N_WEBHOOK_URL=http://n8n:5678/webhook
N8N_API_KEY=

# App
NODE_ENV=production
APP_URL=http://localhost

# PostgreSQL (для docker-compose)
POSTGRES_USER=boats
POSTGRES_PASSWORD=boats2026secret
POSTGRES_DB=boats2026

# n8n (для docker-compose)
N8N_USER=admin
N8N_PASSWORD=admin2026
N8N_HOST=localhost
EOF
    echo "✅ Создан .env с минимальными настройками"
    echo ""
fi

echo "📦 Остановка существующих контейнеров (если есть)..."
docker-compose down 2>/dev/null || true

echo "🔨 Сборка Docker образов..."
docker-compose build --no-cache

echo "🚀 Запуск контейнеров..."
docker-compose up -d

echo "⏳ Ожидание готовности базы данных..."
sleep 15

echo "🗄️  Инициализация базы данных..."
echo "   (Это может занять некоторое время при первом запуске)"
docker-compose exec -T app npm run db:generate || true
docker-compose exec -T app npm run db:push || true

echo ""
echo "✅ Тестовый деплой завершен!"
echo ""
echo "📊 Статус контейнеров:"
docker-compose ps

echo ""
echo "🌐 Приложение должно быть доступно на:"
echo "   - http://localhost (через nginx)"
echo "   - http://localhost:3000 (напрямую)"
echo "   - http://localhost:5678 (n8n панель)"
echo ""
echo "📝 Полезные команды:"
echo "   docker-compose logs -f app      # Логи приложения"
echo "   docker-compose logs -f nginx     # Логи nginx"
echo "   docker-compose logs -f postgres  # Логи БД"
echo "   docker-compose ps                # Статус контейнеров"
echo "   docker-compose down              # Остановка"
echo ""
echo "🧪 Проверка работоспособности:"
echo "   curl http://localhost/health"
echo "   curl http://localhost/api/health"
echo ""
echo "⚠️  ВАЖНО: Это тестовая конфигурация!"
echo "   - Используются дефолтные пароли"
echo "   - Telegram бот не настроен"
echo "   - Для продакшн используйте: ./scripts/deploy.sh"
echo ""
