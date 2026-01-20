#!/bin/bash
# Скрипт установки Docker и Docker Compose на новый сервер

set -e

echo "🐳 Установка Docker и Docker Compose..."

# Проверка root прав
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Запустите скрипт от root: sudo ./scripts/install-docker.sh"
  exit 1
fi

# Обновление пакетов
echo "📦 Обновление списка пакетов..."
apt-get update

# Установка зависимостей
echo "📦 Установка зависимостей..."
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Добавление официального GPG ключа Docker
echo "🔑 Добавление GPG ключа Docker..."
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Настройка репозитория
echo "📝 Настройка репозитория Docker..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker Engine
echo "🐳 Установка Docker Engine..."
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Запуск Docker
echo "▶️  Запуск Docker..."
systemctl start docker
systemctl enable docker

# Проверка установки
echo "✅ Проверка установки..."
docker --version
docker compose version

echo ""
echo "✅ Docker и Docker Compose установлены успешно!"
echo ""
echo "📝 Следующие шаги:"
echo "1. Добавьте пользователя в группу docker (опционально):"
echo "   sudo usermod -aG docker $USER"
echo "   newgrp docker"
echo ""
echo "2. Остановите старые сервисы (если запущены):"
echo "   sudo systemctl stop nginx"
echo "   sudo systemctl stop pm2"
echo "   sudo systemctl disable nginx"
echo "   sudo systemctl disable pm2"
echo ""
echo "3. Удалите старые установки (опционально):"
echo "   sudo apt-get remove -y nginx nodejs npm pm2"
echo "   sudo apt-get autoremove -y"
