# Скрипт для запуска тестовой конфигурации n8n и PostgreSQL
# Использование: .\scripts\test-n8n-db.ps1

Write-Host "🚀 Запуск тестовой конфигурации n8n и PostgreSQL..." -ForegroundColor Green

# Проверка наличия .env файла
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Файл .env не найден. Создаю минимальную конфигурацию..." -ForegroundColor Yellow
    
    $envContent = @"
# PostgreSQL
POSTGRES_USER=boats
POSTGRES_PASSWORD=boats2026secret
POSTGRES_DB=boats2026

# n8n
N8N_USER=admin
N8N_PASSWORD=admin2026
N8N_HOST=localhost
N8N_DB_NAME=n8n
"@
    
    Set-Content -Path ".env" -Value $envContent
    Write-Host "✅ Файл .env создан. Проверьте настройки перед запуском!" -ForegroundColor Green
}

# Проверка Docker
Write-Host "`n🔍 Проверка Docker..." -ForegroundColor Cyan
try {
    $dockerVersion = docker --version
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker: $dockerVersion" -ForegroundColor Green
    Write-Host "✅ Docker Compose: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker не установлен или не запущен!" -ForegroundColor Red
    exit 1
}

# Проверка занятости портов
Write-Host "`n🔍 Проверка портов..." -ForegroundColor Cyan
$port5432 = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
$port5678 = Get-NetTCPConnection -LocalPort 5678 -ErrorAction SilentlyContinue

if ($port5432) {
    Write-Host "⚠️  Порт 5432 уже занят. PostgreSQL может не запуститься." -ForegroundColor Yellow
}
if ($port5678) {
    Write-Host "⚠️  Порт 5678 уже занят. n8n может не запуститься." -ForegroundColor Yellow
}

# Запуск сервисов
Write-Host "`n🚀 Запуск сервисов..." -ForegroundColor Cyan
docker-compose -f docker-compose.test.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Сервисы запущены!" -ForegroundColor Green
    Write-Host "`n📊 Статус контейнеров:" -ForegroundColor Cyan
    docker-compose -f docker-compose.test.yml ps
    
    Write-Host "`n🌐 Доступ к сервисам:" -ForegroundColor Cyan
    Write-Host "  - PostgreSQL: localhost:5432" -ForegroundColor White
    Write-Host "  - n8n: http://localhost:5678" -ForegroundColor White
    Write-Host "    Логин: admin" -ForegroundColor Gray
    Write-Host "    Пароль: admin2026" -ForegroundColor Gray
    
    Write-Host "`n📝 Полезные команды:" -ForegroundColor Cyan
    Write-Host "  - Логи: docker-compose -f docker-compose.test.yml logs -f" -ForegroundColor Gray
    Write-Host "  - Остановка: docker-compose -f docker-compose.test.yml down" -ForegroundColor Gray
    Write-Host "  - Подключение к БД: docker exec -it boats2026-db-test psql -U boats -d boats2026" -ForegroundColor Gray
    
    Write-Host "`n⏳ Ожидание готовности сервисов..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Проверка здоровья PostgreSQL
    Write-Host "`n🔍 Проверка PostgreSQL..." -ForegroundColor Cyan
    $pgReady = docker exec boats2026-db-test pg_isready -U boats 2>&1
    if ($pgReady -match "accepting connections") {
        Write-Host "✅ PostgreSQL готов!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PostgreSQL еще не готов. Подождите несколько секунд." -ForegroundColor Yellow
    }
    
    # Проверка n8n
    Write-Host "`n🔍 Проверка n8n..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5678" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ n8n доступен!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  n8n еще не готов. Подождите несколько секунд и откройте http://localhost:5678" -ForegroundColor Yellow
    }
    
    Write-Host "`n📚 Подробная инструкция: см. TEST_N8N_DB.md" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Ошибка при запуске сервисов!" -ForegroundColor Red
    Write-Host "Проверьте логи: docker-compose -f docker-compose.test.yml logs" -ForegroundColor Yellow
    exit 1
}
