# Скрипт для настройки HTTPS через Let's Encrypt (для Windows/SSH)
# Использование на сервере через SSH

param(
    [string]$Domain = "klernesokof.beget.app",
    [string]$Email = "admin@klernesokof.beget.app"
)

Write-Host "🔒 Настройка HTTPS для домена: $Domain" -ForegroundColor Cyan
Write-Host "📧 Email для Let's Encrypt: $Email" -ForegroundColor Cyan
Write-Host ""
Write-Host "Выполните на сервере следующие команды:" -ForegroundColor Yellow
Write-Host ""
Write-Host "# 1. Установка certbot" -ForegroundColor White
Write-Host "apt-get update" -ForegroundColor Gray
Write-Host "apt-get install -y certbot python3-certbot-nginx" -ForegroundColor Gray
Write-Host ""
Write-Host "# 2. Создание директории для сертификатов" -ForegroundColor White
Write-Host "mkdir -p /opt/segaboats/nginx/ssl" -ForegroundColor Gray
Write-Host ""
Write-Host "# 3. Получение сертификата (standalone режим)" -ForegroundColor White
Write-Host "certbot certonly --standalone --non-interactive --agree-tos --email $Email -d $Domain" -ForegroundColor Gray
Write-Host ""
Write-Host "# 4. Копирование сертификатов в проект" -ForegroundColor White
Write-Host "cp /etc/letsencrypt/live/$Domain/fullchain.pem /opt/segaboats/nginx/ssl/" -ForegroundColor Gray
Write-Host "cp /etc/letsencrypt/live/$Domain/privkey.pem /opt/segaboats/nginx/ssl/" -ForegroundColor Gray
Write-Host "chmod 644 /opt/segaboats/nginx/ssl/*.pem" -ForegroundColor Gray
Write-Host ""
Write-Host "# 5. Обновите nginx/conf.d/default.conf для HTTPS" -ForegroundColor White
Write-Host "# 6. Перезапустите nginx: docker-compose restart nginx" -ForegroundColor White
