#!/bin/bash
# Скрипт для настройки HTTPS через Let's Encrypt
# Использование: ./scripts/setup-https.sh your-domain.com

set -e

DOMAIN=${1:-"klernesokof.beget.app"}
EMAIL=${2:-"admin@${DOMAIN}"}

echo "🔒 Настройка HTTPS для домена: $DOMAIN"
echo "📧 Email для Let's Encrypt: $EMAIL"

# Проверка root прав
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Запустите скрипт от root: sudo ./scripts/setup-https.sh"
  exit 1
fi

# Установка certbot
echo "📦 Установка certbot..."
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Создание директории для сертификатов
mkdir -p nginx/ssl

# Получение сертификата
echo "🔐 Получение SSL сертификата..."
certbot certonly --nginx \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN" \
  --cert-path ./nginx/ssl/fullchain.pem \
  --key-path ./nginx/ssl/privkey.pem

if [ $? -eq 0 ]; then
  echo "✅ Сертификат получен успешно!"
  echo "📝 Теперь обновите nginx/conf.d/default.conf для использования HTTPS"
  echo "📝 И перезапустите nginx: docker-compose restart nginx"
else
  echo "❌ Ошибка при получении сертификата"
  exit 1
fi
