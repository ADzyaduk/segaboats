#!/bin/bash
# Скрипт для настройки HTTPS через Let's Encrypt
# Использование: ./scripts/setup-https.sh your-domain.com

set -e

DOMAIN=${1:-"klernesokof.beget.app"}
EMAIL=${2:-"admin@${DOMAIN}"}
PROJECT_DIR=${PROJECT_DIR:-$(pwd)}

echo "🔒 Настройка HTTPS для домена: $DOMAIN"
echo "📧 Email для Let's Encrypt: $EMAIL"
echo "📁 Директория проекта: $PROJECT_DIR"

# Проверка root прав
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Запустите скрипт от root: sudo ./scripts/setup-https.sh"
  exit 1
fi

# Установка certbot
echo "📦 Установка certbot..."
apt-get update
apt-get install -y certbot

# Создание директории для сертификатов
mkdir -p "$PROJECT_DIR/nginx/ssl"

# Остановка nginx контейнера (освобождаем порт 80)
echo "⏸️  Остановка nginx контейнера..."
cd "$PROJECT_DIR"
docker-compose stop nginx || true

# Получение сертификата (standalone режим)
echo "🔐 Получение SSL сертификата..."
certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN"

if [ $? -eq 0 ]; then
  echo "✅ Сертификат получен успешно!"
  
  # Копирование сертификатов в проект
  echo "📋 Копирование сертификатов..."
  cp /etc/letsencrypt/live/"$DOMAIN"/fullchain.pem "$PROJECT_DIR/nginx/ssl/"
  cp /etc/letsencrypt/live/"$DOMAIN"/privkey.pem "$PROJECT_DIR/nginx/ssl/"
  chmod 644 "$PROJECT_DIR/nginx/ssl"/*.pem
  
  echo "✅ Сертификаты скопированы в $PROJECT_DIR/nginx/ssl/"
  echo ""
  echo "📝 Следующие шаги:"
  echo "1. Обновите nginx/conf.d/default.conf (используйте https.conf как пример)"
  echo "2. Запустите nginx: docker-compose up -d nginx"
  echo "3. Обновите переменные окружения для HTTPS"
else
  echo "❌ Ошибка при получении сертификата"
  echo "🔄 Запускаю nginx обратно..."
  docker-compose up -d nginx || true
  exit 1
fi

# Запуск nginx обратно
echo "▶️  Запуск nginx контейнера..."
docker-compose up -d nginx || echo "⚠️  Запустите nginx вручную после настройки конфигурации"
