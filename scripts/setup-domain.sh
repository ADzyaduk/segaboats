#!/bin/bash
# Скрипт для настройки домена v-more.ru на сервере

set -e

DOMAIN="v-more.ru"
PROJECT_DIR="/opt/boats2026"

echo "🌐 Настройка домена $DOMAIN на сервере..."
echo ""

# Проверка, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Запустите скрипт от root: sudo ./scripts/setup-domain.sh"
  exit 1
fi

cd "$PROJECT_DIR" || exit 1

# 1. Обновление кода
echo "📥 Обновление кода из репозитория..."
git pull

# 2. Обновление .env файла
echo ""
echo "📝 Обновление .env файла..."

if [ ! -f .env ]; then
    echo "❌ Файл .env не найден! Создайте его из env.example:"
    echo "   cp env.example .env"
    exit 1
fi

# Создаем резервную копию
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Обновляем переменные домена
sed -i "s|N8N_HOST=.*|N8N_HOST=$DOMAIN|g" .env
sed -i "s|N8N_WEBHOOK_URL=.*|N8N_WEBHOOK_URL=https://$DOMAIN/webhook|g" .env
sed -i "s|NUXT_PUBLIC_APP_URL=.*|NUXT_PUBLIC_APP_URL=https://$DOMAIN|g" .env

echo "✅ .env файл обновлен"
echo ""
echo "Проверьте изменения:"
grep -E "N8N_HOST|N8N_WEBHOOK_URL|NUXT_PUBLIC_APP_URL" .env

# 3. Обновление Nginx конфигурации
echo ""
echo "🔧 Обновление конфигурации Nginx..."

if [ ! -f nginx/system-nginx.conf ]; then
    echo "❌ Файл nginx/system-nginx.conf не найден!"
    exit 1
fi

cp nginx/system-nginx.conf /etc/nginx/sites-available/boats2026
ln -sf /etc/nginx/sites-available/boats2026 /etc/nginx/sites-enabled/boats2026

# Проверка конфигурации
echo "Проверка конфигурации Nginx..."
if nginx -t; then
    echo "✅ Конфигурация Nginx корректна"
    systemctl reload nginx
    echo "✅ Nginx перезагружен"
else
    echo "❌ Ошибка в конфигурации Nginx!"
    exit 1
fi

# 4. Перезапуск контейнеров
echo ""
echo "🔄 Перезапуск Docker контейнеров..."

if command -v docker-compose &> /dev/null; then
    docker-compose restart
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    docker compose restart
else
    echo "⚠️  Docker Compose не найден, пропускаю перезапуск контейнеров"
fi

echo ""
echo "✅ Настройка домена завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Дождитесь распространения DNS (1-2 часа, максимум 24 часа)"
echo "2. Проверьте DNS: nslookup $DOMAIN"
echo "3. Проверьте сайт: http://$DOMAIN"
echo ""
echo "🔍 Проверка DNS онлайн: https://dnschecker.org/#A/$DOMAIN"
echo ""
