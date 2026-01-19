# Скрипт для тестирования n8n webhook
# Использование: .\scripts\test-n8n.ps1 [webhook-path] [n8n-url]

param(
    [string]$WebhookPath = "test-booking",
    [string]$N8nUrl = "http://localhost:5678"
)

Write-Host "🧪 Тестирование n8n webhook" -ForegroundColor Cyan
Write-Host "n8n URL: $N8nUrl" -ForegroundColor White
Write-Host "Webhook path: $WebhookPath" -ForegroundColor White
Write-Host ""

$webhookUrl = "$N8nUrl/webhook/$WebhookPath"

$testData = @{
    event = "test"
    data = @{
        testId = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
        message = "Тестовый запрос"
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json -Depth 10

Write-Host "📤 Отправка данных:" -ForegroundColor Cyan
Write-Host $testData -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $testData -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
    
    Write-Host "✅ Успешно!" -ForegroundColor Green
    Write-Host "`n📥 Ответ:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "`nСтатус код: $statusCode" -ForegroundColor Yellow
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Ответ сервера:" -ForegroundColor Yellow
            Write-Host $responseBody -ForegroundColor Gray
        } catch {
            Write-Host "Не удалось прочитать ответ сервера" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n💡 Рекомендации:" -ForegroundColor Yellow
    Write-Host "1. Убедитесь, что n8n запущен и доступен на $N8nUrl" -ForegroundColor White
    Write-Host "2. Проверьте, что воркфлоу '$WebhookPath' активен в n8n" -ForegroundColor White
    Write-Host "3. Откройте n8n в браузере и проверьте статус воркфлоу" -ForegroundColor White
    Write-Host "4. Проверьте логи n8n" -ForegroundColor White
}
