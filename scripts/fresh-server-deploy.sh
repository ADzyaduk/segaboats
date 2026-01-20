#!/bin/bash
# Полное развертывание на чистом сервере
# Использование: sudo ./scripts/fresh-server-deploy.sh

set -e

PROJECT_DIR="/opt/boats2026"
GIT_REPO="https://github.com/ADzyaduk/segaboats"

echo "🚀 Полное развертывание на чистом сервере..."
echo "📁 Директория проекта: $PROJECT_DIR"

# Проверка root прав
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Запустите скрипт от root: sudo ./scripts/fresh-server-deploy.sh"
  exit 1
fi

# 1. Установка Git (если нет)
echo ""
echo "=========================================="
echo "1️⃣  Проверка Git..."
echo "=========================================="
if ! command -v git &> /dev/null; then
    echo "📦 Установка Git..."
    apt-get update
    apt-get install -y git
else
    echo "✅ Git уже установлен"
fi

# 2. Клонирование репозитория
echo ""
echo "=========================================="
echo "2️⃣  Клонирование репозитория..."
echo "=========================================="
if [ ! -d "$PROJECT_DIR/.git" ]; then
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    echo "📥 Клонирование из $GIT_REPO..."
    git clone "$GIT_REPO" .
else
    echo "✅ Репозиторий уже клонирован, обновляю..."
    cd "$PROJECT_DIR"
    git pull
fi

# 3. Установка Docker
echo ""
echo "=========================================="
echo "3️⃣  Установка Docker и Docker Compose..."
echo "=========================================="
if ! command -v docker &> /dev/null; then
    if [ -f "$PROJECT_DIR/scripts/install-docker.sh" ]; then
        echo "📦 Использование скрипта install-docker.sh..."
        bash "$PROJECT_DIR/scripts/install-docker.sh"
    else
        echo "📦 Установка Docker вручную..."
        apt-get update
        apt-get install -y ca-certificates curl gnupg lsb-release
        mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        systemctl start docker
        systemctl enable docker
    fi
else
    echo "✅ Docker уже установлен"
fi

# 4. Создание .env файла
echo ""
echo "=========================================="
echo "4️⃣  Настройка .env файла..."
echo "=========================================="
if [ ! -f .env ]; then
    if [ -f env.example ]; then
        echo "📝 Копирование env.example в .env..."
        cp env.example .env
    else
        echo "📝 Создание .env файла..."
        cat > .env << 'EOF'
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
N8N_HOST=your_domain_here
N8N_WEBHOOK_URL=https://your_domain_here/webhook
N8N_API_KEY=your_n8n_api_key

# Admin
ADMIN_PASSWORD=admin2026

# App URL
NUXT_PUBLIC_APP_URL=https://your_domain_here
NODE_ENV=production
EOF
    fi
    echo "✅ .env файл создан"
    echo "⚠️  ВАЖНО: Отредактируйте .env файл перед запуском!"
    echo "   nano $PROJECT_DIR/.env"
else
    echo "✅ .env файл уже существует"
fi

# 5. Сборка Docker образов
echo ""
echo "=========================================="
echo "5️⃣  Сборка Docker образов..."
echo "=========================================="
cd "$PROJECT_DIR"
docker compose build --no-cache app

# 6. Запуск контейнеров
echo ""
echo "=========================================="
echo "6️⃣  Запуск Docker контейнеров..."
echo "=========================================="
docker compose up -d postgres
echo "⏳ Ожидание готовности базы данных..."
sleep 10

# 7. Создание таблиц БД
echo ""
echo "=========================================="
echo "7️⃣  Создание таблиц базы данных..."
echo "=========================================="
cd "$PROJECT_DIR"
if [ -f scripts/create-tables.sql ]; then
    echo "📝 Выполнение create-tables.sql..."
    docker exec -i boats2026-db psql -U boats -d boats2026 < scripts/create-tables.sql
    echo "✅ Таблицы созданы"
else
    echo "⚠️  Файл scripts/create-tables.sql не найден"
    echo "⚠️  Пропускаю создание таблиц. Создайте их вручную позже."
fi

# 8. Запуск остальных контейнеров
echo ""
echo "=========================================="
echo "8️⃣  Запуск приложения и n8n..."
echo "=========================================="
docker compose up -d app n8n

# 9. Настройка системного Nginx
echo ""
echo "=========================================="
echo "9️⃣  Настройка системного Nginx..."
echo "=========================================="
cd "$PROJECT_DIR"
if [ -f scripts/setup-system-nginx.sh ]; then
    chmod +x scripts/setup-system-nginx.sh
    bash scripts/setup-system-nginx.sh
else
    echo "⚠️  Скрипт setup-system-nginx.sh не найден"
    echo "⚠️  Настройте Nginx вручную или установите его отдельно"
fi

# 10. Проверка статуса
echo ""
echo "=========================================="
echo "🔟 Проверка статуса..."
echo "=========================================="
echo ""
echo "📊 Статус контейнеров:"
docker compose ps

echo ""
echo "📊 Статус Nginx:"
systemctl status nginx --no-pager | head -10

echo ""
echo "=========================================="
echo "✅ Развертывание завершено!"
echo "=========================================="
echo ""
echo "📝 Следующие шаги:"
echo "1. Отредактируйте .env файл:"
echo "   nano $PROJECT_DIR/.env"
echo ""
echo "2. Перезапустите контейнеры:"
echo "   cd $PROJECT_DIR"
echo "   docker compose restart"
echo ""
echo "3. Проверьте логи:"
echo "   docker compose logs -f"
echo ""
echo "4. Проверьте доступность сайта:"
echo "   curl http://localhost"
echo ""
