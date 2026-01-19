#!/bin/bash
# Скрипт для запуска тестовой конфигурации n8n и PostgreSQL
# Использование: ./scripts/test-n8n-db.sh

set -e

echo "🚀 Запуск тестовой конфигурации n8n и PostgreSQL..."

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo "⚠️  Файл .env не найден. Создаю минимальную конфигурацию..."
    cat > .env << EOF
# PostgreSQL
POSTGRES_USER=boats
POSTGRES_PASSWORD=boats2026secret
POSTGRES_DB=boats2026

# n8n
N8N_USER=admin
N8N_PASSWORD=admin2026
N8N_HOST=localhost
N8N_DB_NAME=n8n
EOF
    echo "✅ Файл .env создан. Проверьте настройки перед запуском!"
fi

# Проверка Docker
echo ""
echo "🔍 Проверка Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен!"
    exit 1
fi

echo "✅ Docker: $(docker --version)"
echo "✅ Docker Compose: $(docker-compose --version)"

# Проверка занятости портов
echo ""
echo "🔍 Проверка портов..."
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Порт 5432 уже занят. PostgreSQL может не запуститься."
fi
if lsof -Pi :5678 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Порт 5678 уже занят. n8n может не запуститься."
fi

# Запуск сервисов
echo ""
echo "🚀 Запуск сервисов..."
docker-compose -f docker-compose.test.yml up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Сервисы запущены!"
    echo ""
    echo "📊 Статус контейнеров:"
    docker-compose -f docker-compose.test.yml ps
    
    echo ""
    echo "🌐 Доступ к сервисам:"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - n8n: http://localhost:5678"
    echo "    Логин: admin"
    echo "    Пароль: admin2026"
    
    echo ""
    echo "📝 Полезные команды:"
    echo "  - Логи: docker-compose -f docker-compose.test.yml logs -f"
    echo "  - Остановка: docker-compose -f docker-compose.test.yml down"
    echo "  - Подключение к БД: docker exec -it boats2026-db-test psql -U boats -d boats2026"
    
    echo ""
    echo "⏳ Ожидание готовности сервисов..."
    sleep 5
    
    # Проверка здоровья PostgreSQL
    echo ""
    echo "🔍 Проверка PostgreSQL..."
    if docker exec boats2026-db-test pg_isready -U boats > /dev/null 2>&1; then
        echo "✅ PostgreSQL готов!"
    else
        echo "⚠️  PostgreSQL еще не готов. Подождите несколько секунд."
    fi
    
    # Проверка n8n
    echo ""
    echo "🔍 Проверка n8n..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5678 | grep -q "200\|302"; then
        echo "✅ n8n доступен!"
    else
        echo "⚠️  n8n еще не готов. Подождите несколько секунд и откройте http://localhost:5678"
    fi
    
    echo ""
    echo "📚 Подробная инструкция: см. TEST_N8N_DB.md"
else
    echo ""
    echo "❌ Ошибка при запуске сервисов!"
    echo "Проверьте логи: docker-compose -f docker-compose.test.yml logs"
    exit 1
fi
