#!/bin/bash
# Скрипт для тестирования n8n webhook
# Использование: ./scripts/test-webhook.sh [webhook-path]

WEBHOOK_PATH=${1:-"test-booking"}
WEBHOOK_URL="http://localhost:5678/webhook/$WEBHOOK_PATH"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
START_DATE=$(date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%SZ")
BOOKING_ID="test-$(date +%Y%m%d%H%M%S)"

BODY=$(cat <<EOF
{
  "event": "booking.created",
  "data": {
    "bookingId": "$BOOKING_ID",
    "customerName": "Иван Иванов",
    "customerPhone": "+7 (900) 123-45-67",
    "boatName": "Тестовая яхта",
    "startDate": "$START_DATE",
    "hours": 3,
    "totalPrice": 45000
  },
  "timestamp": "$TIMESTAMP"
}
EOF
)

echo "🧪 Тестирование webhook: $WEBHOOK_URL"
echo "📤 Отправка данных:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$BODY")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY_RESPONSE=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo "✅ Успешный ответ (HTTP $HTTP_CODE):"
    echo "$BODY_RESPONSE" | jq '.' 2>/dev/null || echo "$BODY_RESPONSE"
else
    echo "❌ Ошибка (HTTP $HTTP_CODE):"
    echo "$BODY_RESPONSE"
    exit 1
fi
