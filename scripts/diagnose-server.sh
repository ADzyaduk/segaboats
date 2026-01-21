#!/bin/bash
# Server Diagnostics Script for Boats2026
# Run on server: bash diagnose-server.sh

echo "========================================"
echo "🔍 Boats2026 Server Diagnostics"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Docker containers status
echo "📦 Docker Containers:"
echo "----------------------------------------"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "boats2026|NAMES"
echo ""

# 2. Check if containers are running
APP_STATUS=$(docker inspect -f '{{.State.Status}}' boats2026-app 2>/dev/null)
DB_STATUS=$(docker inspect -f '{{.State.Status}}' boats2026-db 2>/dev/null)
N8N_STATUS=$(docker inspect -f '{{.State.Status}}' boats2026-n8n 2>/dev/null)

echo "📊 Container Status:"
echo "----------------------------------------"
if [ "$APP_STATUS" = "running" ]; then
    echo -e "  App:  ${GREEN}✓ Running${NC}"
else
    echo -e "  App:  ${RED}✗ Not Running ($APP_STATUS)${NC}"
fi

if [ "$DB_STATUS" = "running" ]; then
    echo -e "  DB:   ${GREEN}✓ Running${NC}"
else
    echo -e "  DB:   ${RED}✗ Not Running ($DB_STATUS)${NC}"
fi

if [ "$N8N_STATUS" = "running" ]; then
    echo -e "  n8n:  ${GREEN}✓ Running${NC}"
else
    echo -e "  n8n:  ${RED}✗ Not Running ($N8N_STATUS)${NC}"
fi
echo ""

# 3. Database connection test
echo "🗄️ Database Check:"
echo "----------------------------------------"
DB_TABLES=$(docker exec boats2026-db psql -U boats -d boats2026 -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
if [ -n "$DB_TABLES" ] && [ "$DB_TABLES" -gt 0 ]; then
    echo -e "  Tables: ${GREEN}$DB_TABLES tables found${NC}"
else
    echo -e "  Tables: ${RED}No tables found or connection failed${NC}"
fi

# Check for admin user
ADMIN_COUNT=$(docker exec boats2026-db psql -U boats -d boats2026 -t -c "SELECT COUNT(*) FROM \"user\" WHERE role IN ('ADMIN', 'OWNER');" 2>/dev/null | tr -d ' ')
if [ -n "$ADMIN_COUNT" ] && [ "$ADMIN_COUNT" -gt 0 ]; then
    echo -e "  Admin users: ${GREEN}$ADMIN_COUNT${NC}"
else
    echo -e "  Admin users: ${YELLOW}No admin users found!${NC}"
fi

# Check boats count
BOATS_COUNT=$(docker exec boats2026-db psql -U boats -d boats2026 -t -c "SELECT COUNT(*) FROM boat;" 2>/dev/null | tr -d ' ')
echo "  Boats: $BOATS_COUNT"
echo ""

# 4. App health check
echo "🩺 App Health:"
echo "----------------------------------------"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null)
if [ "$HEALTH" = "200" ]; then
    echo -e "  Health endpoint: ${GREEN}✓ OK (200)${NC}"
else
    echo -e "  Health endpoint: ${RED}✗ Failed ($HEALTH)${NC}"
fi
echo ""

# 5. Recent app logs
echo "📋 Recent App Logs (last 10 lines):"
echo "----------------------------------------"
docker logs boats2026-app --tail 10 2>&1
echo ""

# 6. Environment check
echo "🔧 Environment Variables:"
echo "----------------------------------------"
echo "  Checking ADMIN_PASSWORD..."
ADMIN_PASS=$(docker exec boats2026-app printenv ADMIN_PASSWORD 2>/dev/null)
if [ -n "$ADMIN_PASS" ]; then
    echo -e "  ADMIN_PASSWORD: ${GREEN}✓ Set${NC}"
else
    echo -e "  ADMIN_PASSWORD: ${YELLOW}Not set (using default)${NC}"
fi

echo "  Checking TELEGRAM_BOT_TOKEN..."
TG_TOKEN=$(docker exec boats2026-app printenv TELEGRAM_BOT_TOKEN 2>/dev/null)
if [ -n "$TG_TOKEN" ]; then
    echo -e "  TELEGRAM_BOT_TOKEN: ${GREEN}✓ Set${NC}"
else
    echo -e "  TELEGRAM_BOT_TOKEN: ${RED}Not set${NC}"
fi
echo ""

# 7. Disk usage
echo "💾 Disk Usage:"
echo "----------------------------------------"
df -h / | tail -1 | awk '{print "  Used: " $3 " / " $2 " (" $5 ")"}'
echo ""

# 8. Memory usage
echo "🧠 Memory Usage:"
echo "----------------------------------------"
free -h | grep Mem | awk '{print "  Used: " $3 " / " $2}'
echo ""

echo "========================================"
echo "✅ Diagnostics Complete"
echo "========================================"
