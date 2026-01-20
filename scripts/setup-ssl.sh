#!/bin/bash
# Автоматическая настройка SSL для v-more.store

set -e

DOMAIN="v-more.store"
EMAIL="info@v-more.store" # Замените на вашу почту если нужно

echo "🚀 Начинаем настройку SSL для $DOMAIN..."

# 1. Установка необходимых пакетов
echo "📦 Установка certbot и nginx..."
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx nginx

# 2. Создание папки для проверки certbot
echo "📁 Создание папки для certbot..."
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot

# 3. Подготовка временного конфига Nginx для выпуска сертификата
echo "📝 Настройка временного конфига Nginx..."
PROJECT_DIR=$(pwd)
if [ ! -f "$PROJECT_DIR/nginx/system-nginx.conf" ]; then
    echo "❌ Ошибка: запустите скрипт из корня проекта"
    exit 1
fi

# Копируем конфиг в sites-available
sudo cp "$PROJECT_DIR/nginx/system-nginx.conf" /etc/nginx/sites-available/boats2026

# Временно закомментируем SSL секцию, чтобы Nginx смог запуститься без сертификатов
sudo sed -i 's/listen 443 ssl/listen 443 ssl; #/g' /etc/nginx/sites-available/boats2026
# (Но проще сначала выпустить сертификат, используя только 80 порт)

# Создаем симлинк и убираем дефолтный конфиг
sudo ln -sf /etc/nginx/sites-available/boats2026 /etc/nginx/sites-enabled/boats2026
sudo rm -f /etc/nginx/sites-enabled/default

# Проверяем и перезапускаем nginx
sudo nginx -t
sudo systemctl reload nginx || sudo systemctl start nginx

# 4. Выпуск сертификата
echo "🔐 Запрос сертификата у Let's Encrypt..."
sudo certbot certonly --webroot -w /var/www/certbot \
    -d $DOMAIN -d www.$DOMAIN \
    --email $EMAIL --agree-tos --non-interactive

# 5. Возвращаем SSL в конфиг (раскомментируем)
echo "🛠 Финальная настройка Nginx..."
sudo cp "$PROJECT_DIR/nginx/system-nginx.conf" /etc/nginx/sites-available/boats2026

# Проверяем пути к сертификатам (на всякий случай)
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "❌ Ошибка: сертификаты не были созданы!"
    exit 1
fi

# Перезапуск nginx с полным конфигом
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "✅ SSL успешно настроен!"
echo "🌍 Теперь ваш сайт доступен по адресу: https://$DOMAIN"
echo ""
echo "🔄 Автопродление сертификата уже включено (certbot.timer)"
