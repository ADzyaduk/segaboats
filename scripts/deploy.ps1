# Скрипт деплоя Boats2026 для Windows PowerShell
# Использование: .\scripts\deploy.ps1 [production|staging]

param(
    [string]$Environment = "production"
)

Write-Host "🚀 Деплой в окружение: $Environment" -ForegroundColor Cyan

# Проверка наличия .env файла
if (-not (Test-Path .env)) {
    Write-Host "❌ Файл .env не найден!" -ForegroundColor Red
    Write-Host "📝 Создайте .env на основе .env.example:" -ForegroundColor Yellow
    Write-Host "   Copy-Item .env.example .env" -ForegroundColor Gray
    Write-Host "   notepad .env  # Заполните все переменные" -ForegroundColor Gray
    exit 1
}

# Проверка Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker не установлен!" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose не установлен!" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Остановка существующих контейнеров..." -ForegroundColor Yellow
docker-compose down

Write-Host "🔨 Сборка Docker образов..." -ForegroundColor Yellow
docker-compose build --no-cache

Write-Host "🚀 Запуск контейнеров..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "⏳ Ожидание готовности базы данных..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "🗄️  Инициализация базы данных..." -ForegroundColor Yellow
docker-compose exec -T app npm run db:generate 2>&1 | Out-Null
docker-compose exec -T app npm run db:push 2>&1 | Out-Null

$seedResponse = Read-Host "Заполнить базу тестовыми данными? (y/N)"
if ($seedResponse -eq "y" -or $seedResponse -eq "Y") {
    Write-Host "🌱 Заполнение базы данных..." -ForegroundColor Yellow
    docker-compose exec -T app npm run db:seed 2>&1 | Out-Null
}

Write-Host "✅ Проверка статуса контейнеров..." -ForegroundColor Yellow
docker-compose ps

Write-Host "📊 Последние логи приложения:" -ForegroundColor Yellow
docker-compose logs --tail=50 app

Write-Host ""
Write-Host "✅ Деплой завершен!" -ForegroundColor Green
Write-Host "🌐 Приложение доступно на: http://localhost" -ForegroundColor Cyan
Write-Host "📝 Проверьте логи: docker-compose logs -f app" -ForegroundColor Gray
Write-Host "🔄 Перезапуск: docker-compose restart app" -ForegroundColor Gray
