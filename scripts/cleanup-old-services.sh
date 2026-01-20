#!/bin/bash
# Скрипт для остановки и удаления старых сервисов (nginx, pm2, nodejs)

set -e

echo "🧹 Очистка старых сервисов..."

# Проверка root прав
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Запустите скрипт от root: sudo ./scripts/cleanup-old-services.sh"
  exit 1
fi

# Остановка сервисов
echo "⏸️  Остановка сервисов..."
systemctl stop nginx 2>/dev/null || true
systemctl stop pm2 2>/dev/null || true
systemctl stop pm2-root 2>/dev/null || true

# Отключение автозапуска
echo "🚫 Отключение автозапуска..."
systemctl disable nginx 2>/dev/null || true
systemctl disable pm2 2>/dev/null || true
systemctl disable pm2-root 2>/dev/null || true

# Удаление пакетов (опционально, раскомментируйте если нужно)
# echo "🗑️  Удаление пакетов..."
# apt-get remove -y nginx nginx-common 2>/dev/null || true
# apt-get remove -y nodejs npm 2>/dev/null || true
# npm uninstall -g pm2 2>/dev/null || true
# apt-get autoremove -y

echo "✅ Очистка завершена!"
echo ""
echo "⚠️  Пакеты НЕ удалены автоматически (закомментировано)"
echo "⚠️  Раскомментируйте строки в скрипте, если хотите удалить пакеты"
