#!/bin/bash
# Скрипт проверки готовности сервера к деплою

echo "🔍 Проверка готовности сервера к деплою Boats2026"
echo "================================================"
echo ""

# Проверка ОС
echo "📋 Информация о системе:"
echo "  OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "  Kernel: $(uname -r)"
echo "  Architecture: $(uname -m)"
echo ""

# Проверка Docker
echo "🐳 Проверка Docker:"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "  ✅ Docker установлен: $DOCKER_VERSION"
    
    # Проверка прав доступа
    if docker ps &> /dev/null; then
        echo "  ✅ Права доступа к Docker: OK"
    else
        echo "  ⚠️  Нет прав доступа к Docker. Выполните:"
        echo "     sudo usermod -aG docker \$USER"
        echo "     newgrp docker"
    fi
else
    echo "  ❌ Docker не установлен"
    echo "     Установите: curl -fsSL https://get.docker.com | sh"
fi
echo ""

# Проверка Docker Compose
echo "🐙 Проверка Docker Compose:"
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo "  ✅ Docker Compose установлен: $COMPOSE_VERSION"
elif docker compose version &> /dev/null; then
    echo "  ✅ Docker Compose (v2) доступен"
else
    echo "  ❌ Docker Compose не установлен"
    echo "     Установите: sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "     sudo chmod +x /usr/local/bin/docker-compose"
fi
echo ""

# Проверка Git
echo "📦 Проверка Git:"
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo "  ✅ Git установлен: $GIT_VERSION"
else
    echo "  ❌ Git не установлен"
    echo "     Установите: sudo apt install git -y"
fi
echo ""

# Проверка свободного места
echo "💾 Проверка дискового пространства:"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo "  ✅ Свободное место: OK ($DISK_USAGE% использовано)"
else
    echo "  ⚠️  Мало свободного места: $DISK_USAGE% использовано"
fi
df -h / | tail -1
echo ""

# Проверка портов
echo "🔌 Проверка портов:"
PORTS=(80 443 3000 5432 5678)
for port in "${PORTS[@]}"; do
    if sudo netstat -tuln | grep -q ":$port "; then
        PROCESS=$(sudo netstat -tulnp | grep ":$port " | awk '{print $7}' | head -1)
        echo "  ⚠️  Порт $port занят: $PROCESS"
    else
        echo "  ✅ Порт $port свободен"
    fi
done
echo ""

# Проверка .env файла
echo "📝 Проверка конфигурации:"
if [ -f .env ]; then
    echo "  ✅ Файл .env существует"
    
    # Проверка обязательных переменных
    REQUIRED_VARS=("DATABASE_URL" "TELEGRAM_BOT_TOKEN" "TELEGRAM_BOT_USERNAME")
    MISSING_VARS=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^${var}=" .env 2>/dev/null; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -eq 0 ]; then
        echo "  ✅ Все обязательные переменные заполнены"
    else
        echo "  ⚠️  Отсутствуют переменные: ${MISSING_VARS[*]}"
    fi
else
    echo "  ❌ Файл .env не найден"
    echo "     Создайте: cp .env.example .env"
fi
echo ""

# Проверка проекта
echo "📁 Проверка проекта:"
if [ -f docker-compose.yml ]; then
    echo "  ✅ docker-compose.yml найден"
else
    echo "  ❌ docker-compose.yml не найден"
    echo "     Убедитесь, что вы в корне проекта"
fi

if [ -f docker/Dockerfile ]; then
    echo "  ✅ Dockerfile найден"
else
    echo "  ❌ Dockerfile не найден"
fi

if [ -d nginx ]; then
    echo "  ✅ Директория nginx найдена"
else
    echo "  ❌ Директория nginx не найдена"
fi
echo ""

# Итоговая оценка
echo "================================================"
echo "📊 Итоговая оценка готовности:"
echo ""

ALL_OK=true

if ! command -v docker &> /dev/null; then ALL_OK=false; fi
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then ALL_OK=false; fi
if [ ! -f .env ]; then ALL_OK=false; fi
if [ ! -f docker-compose.yml ]; then ALL_OK=false; fi

if [ "$ALL_OK" = true ]; then
    echo "✅ Сервер готов к деплою!"
    echo ""
    echo "Следующие шаги:"
    echo "  1. Убедитесь, что .env заполнен правильно"
    echo "  2. Запустите: ./scripts/deploy.sh"
    echo "  3. Или вручную: docker-compose up -d --build"
else
    echo "⚠️  Сервер не готов. Исправьте проблемы выше."
fi

echo ""
