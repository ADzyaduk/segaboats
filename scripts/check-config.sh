#!/bin/bash
# Configuration Check Script for Boats2026
# Checks if all required environment variables are set
# Usage: bash scripts/check-config.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo "🔍 Boats2026 Configuration Check"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Файл .env не найден!${NC}"
    echo ""
    echo "Создайте файл .env:"
    echo "  cp env.example .env"
    echo "  nano .env"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Файл .env найден${NC}"
echo ""

# Load .env
export $(grep -v '^#' .env | xargs)

# Required variables
REQUIRED_VARS=(
    "POSTGRES_PASSWORD"
    "ADMIN_PASSWORD"
    "TELEGRAM_BOT_TOKEN"
    "TELEGRAM_BOT_USERNAME"
    "TELEGRAM_ADMIN_CHAT_ID"
)

# Optional but recommended
RECOMMENDED_VARS=(
    "OPENROUTER_API_KEY"
    "TELEGRAM_WEBHOOK_SECRET"
    "N8N_PASSWORD"
)

# Check required variables
echo "📋 Проверка обязательных переменных:"
echo "----------------------------------------"

HAS_ERRORS=0

for VAR in "${REQUIRED_VARS[@]}"; do
    VALUE="${!VAR}"
    
    if [ -z "$VALUE" ]; then
        echo -e "${RED}❌ $VAR - НЕ УСТАНОВЛЕНА${NC}"
        HAS_ERRORS=1
    elif [[ "$VALUE" == *"example"* ]] || [[ "$VALUE" == *"here"* ]] || [[ "$VALUE" == *"abc123"* ]]; then
        echo -e "${YELLOW}⚠️  $VAR - содержит пример, замените на реальное значение${NC}"
        HAS_ERRORS=1
    else
        # Validate format
        case $VAR in
            TELEGRAM_BOT_TOKEN)
                if [[ ! "$VALUE" =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]]; then
                    echo -e "${YELLOW}⚠️  $VAR - некорректный формат (должен быть: 1234567890:ABCdef...)${NC}"
                    HAS_ERRORS=1
                else
                    echo -e "${GREEN}✅ $VAR${NC}"
                fi
                ;;
            TELEGRAM_ADMIN_CHAT_ID)
                if [[ ! "$VALUE" =~ ^-?[0-9]+$ ]]; then
                    echo -e "${YELLOW}⚠️  $VAR - должен быть числом${NC}"
                    HAS_ERRORS=1
                else
                    echo -e "${GREEN}✅ $VAR${NC}"
                fi
                ;;
            *)
                echo -e "${GREEN}✅ $VAR${NC}"
                ;;
        esac
    fi
done

echo ""

# Check recommended variables
echo "💡 Проверка рекомендуемых переменных:"
echo "----------------------------------------"

for VAR in "${RECOMMENDED_VARS[@]}"; do
    VALUE="${!VAR}"
    
    if [ -z "$VALUE" ]; then
        echo -e "${YELLOW}⚠️  $VAR - не установлена (некоторые функции будут недоступны)${NC}"
    elif [[ "$VALUE" == *"example"* ]] || [[ "$VALUE" == *"here"* ]] || [[ "$VALUE" == *"abc123"* ]]; then
        echo -e "${YELLOW}⚠️  $VAR - содержит пример${NC}"
    else
        # Validate OpenRouter key format
        if [ "$VAR" = "OPENROUTER_API_KEY" ]; then
            if [[ "$VALUE" =~ ^sk-or-v1- ]]; then
                echo -e "${GREEN}✅ $VAR${NC}"
            else
                echo -e "${YELLOW}⚠️  $VAR - некорректный формат (должен начинаться с sk-or-v1-)${NC}"
            fi
        else
            echo -e "${GREEN}✅ $VAR${NC}"
        fi
    fi
done

echo ""

# Check directories
echo "📁 Проверка структуры папок:"
echo "----------------------------------------"

if [ ! -d "public" ]; then
    echo -e "${RED}❌ Папка public/ не найдена${NC}"
    HAS_ERRORS=1
else
    echo -e "${GREEN}✅ public/${NC}"
fi

if [ ! -d "public/images" ]; then
    echo -e "${YELLOW}⚠️  Папка public/images/ не существует, будет создана${NC}"
    mkdir -p public/images/boats
    echo -e "${GREEN}✅ Создана: public/images/boats/${NC}"
else
    echo -e "${GREEN}✅ public/images/${NC}"
fi

if [ ! -d "public/images/boats" ]; then
    mkdir -p public/images/boats
    echo -e "${GREEN}✅ Создана: public/images/boats/${NC}"
else
    echo -e "${GREEN}✅ public/images/boats/${NC}"
fi

echo ""

# Check docker-compose.yml
echo "🐳 Проверка Docker конфигурации:"
echo "----------------------------------------"

if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml не найден${NC}"
    HAS_ERRORS=1
else
    echo -e "${GREEN}✅ docker-compose.yml${NC}"
fi

echo ""

# Summary
echo "========================================"
if [ $HAS_ERRORS -eq 1 ]; then
    echo -e "${RED}❌ Конфигурация содержит ошибки!${NC}"
    echo ""
    echo "Исправьте ошибки и запустите снова:"
    echo "  bash scripts/check-config.sh"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Конфигурация корректна!${NC}"
    echo ""
    echo "Следующие шаги:"
    echo "  1. Запустите: docker compose up -d --build"
    echo "  2. Откройте: https://v-more.ru/admin"
    echo "  3. Настройте n8n: https://v-more.ru/n8n/"
    echo ""
fi
echo "========================================"
