#!/bin/bash
# Скрипт деплоя Boats2026
# Использование: ./scripts/deploy.sh [production|staging]

set -e  # Остановка при ошибке

ENVIRONMENT=${1:-production}
echo "🚀 Деплой в окружение: $ENVIRONMENT"

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "📝 Создайте .env на основе .env.example:"
    echo "   cp .env.example .env"
    echo "   nano .env  # Заполните все переменные"
    exit 1
fi

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен!"
    exit 1
fi

echo "📦 Остановка существующих контейнеров..."
docker-compose down

echo "🔨 Сборка Docker образов..."
docker-compose build --no-cache

echo "🚀 Запуск контейнеров..."
docker-compose up -d

echo "⏳ Ожидание готовности базы данных..."
sleep 10

echo "🗄️  Инициализация базы данных..."
docker-compose exec -T app npm run db:generate || true
docker-compose exec -T app npm run db:push || true

echo "🌱 Заполнение базы данных (опционально)..."
read -p "Заполнить базу тестовыми данными? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose exec -T app npm run db:seed || true
fi

echo "✅ Проверка статуса контейнеров..."
docker-compose ps

echo "📊 Логи приложения:"
docker-compose logs --tail=50 app

echo ""
echo "✅ Деплой завершен!"
echo "🌐 Приложение доступно на: http://localhost"
echo "📝 Проверьте логи: docker-compose logs -f app"
echo "🔄 Перезапуск: docker-compose restart app"
