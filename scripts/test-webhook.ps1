# Скрипт для тестирования n8n webhook
# Использование: .\scripts\test-webhook.ps1 [webhook-path]

param(
    [string]$WebhookPath = "test-booking"
)

# Используйте IP сервера или localhost
$n8nHost = if ($env:N8N_HOST) { $env:N8N_HOST } else { "155.212.189.214" }
$n8nPort = if ($env:N8N_PORT) { $env:N8N_PORT } else { "5678" }
$webhookUrl = "http://${n8nHost}:${n8nPort}/webhook/$WebhookPath"

$body = @{
    event = "booking.created"
    data = @{
        bookingId = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
        customerName = "Иван Иванов"
        customerPhone = "+7 (900) 123-45-67"
        boatName = "Тестовая яхта"
        startDate = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
        hours = 3
        totalPrice = 45000
    }
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json -Depth 10

Write-Host "Testing webhook: $webhookUrl" -ForegroundColor Cyan
Write-Host "Sending data:" -ForegroundColor Cyan
Write-Host $body -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "Success response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Green
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Server response: $responseBody" -ForegroundColor Yellow
    }
}
