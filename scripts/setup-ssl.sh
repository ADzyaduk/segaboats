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

# 3. Подготовка временного конфига Nginx для выпуска сертификата (только HTTP)
echo "📝 Настройка временного конфига Nginx (только HTTP для выпуска сертификата)..."
PROJECT_DIR=$(pwd)
if [ ! -f "$PROJECT_DIR/nginx/system-nginx.conf" ]; then
    echo "❌ Ошибка: запустите скрипт из корня проекта"
    exit 1
fi

# Создаем временный конфиг БЕЗ SSL (только на 80 порту)
sudo tee /etc/nginx/sites-available/boats2026-temp > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN v-more.ru www.v-more.ru;

    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Проксируем на приложение (пока без редиректа на HTTPS)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

# Создаем симлинк и убираем дефолтный конфиг
sudo ln -sf /etc/nginx/sites-available/boats2026-temp /etc/nginx/sites-enabled/boats2026
sudo rm -f /etc/nginx/sites-enabled/default

# Проверяем и перезапускаем nginx
sudo nginx -t
sudo systemctl reload nginx || sudo systemctl start nginx

# 4. Выпуск сертификата
echo "🔐 Запрос сертификата у Let's Encrypt (расширяем существующий)..."
sudo certbot certonly --webroot -w /var/www/certbot \
    -d $DOMAIN -d www.$DOMAIN -d v-more.ru -d www.v-more.ru \
    --email $EMAIL --agree-tos --non-interactive --expand

# 5. Применяем полный конфиг с SSL
echo "🛠 Финальная настройка Nginx с SSL..."

# Проверяем, что сертификаты были созданы
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "❌ Ошибка: сертификаты не были созданы!"
    exit 1
fi

# Копируем полный конфиг с SSL
sudo cp "$PROJECT_DIR/nginx/system-nginx.conf" /etc/nginx/sites-available/boats2026

# Удаляем временный конфиг
sudo rm -f /etc/nginx/sites-available/boats2026-temp

# Обновляем симлинк на полный конфиг
sudo ln -sf /etc/nginx/sites-available/boats2026 /etc/nginx/sites-enabled/boats2026

# Проверяем конфиг и перезапускаем nginx
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "✅ SSL успешно настроен!"
echo "🌍 Теперь ваш сайт доступен по адресу: https://$DOMAIN"
echo ""
echo "🔄 Автопродление сертификата уже включено (certbot.timer)"
