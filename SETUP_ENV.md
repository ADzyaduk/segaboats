# ⚙️ Настройка .env файла

## Создание .env файла

**На сервере:**

```bash
cd /opt/segaboats
cp .env.example .env
nano .env  # или vi .env
```

## Минимально необходимые переменные

```env
# База данных
POSTGRES_USER=boats
POSTGRES_PASSWORD=boats2026secret
POSTGRES_DB=boats2026
DATABASE_URL=postgresql://boats:boats2026secret@postgres:5432/boats2026?schema=public

# Админ-панель
ADMIN_PASSWORD=ваш-надежный-пароль

# Telegram (если используется)
TELEGRAM_BOT_TOKEN=your-token
TELEGRAM_BOT_USERNAME=your-bot-username
TELEGRAM_WEBHOOK_SECRET=random-secret-string

# n8n
N8N_WEBHOOK_URL=http://n8n:5678/webhook
N8N_USER=admin
N8N_PASSWORD=admin2026

# Приложение
NODE_ENV=production
APP_URL=http://155.212.189.214
```

## Важно

- ⚠️ **НЕ коммитьте `.env` в git** (он уже в `.gitignore`)
- 🔒 **Используйте надежный пароль** для `ADMIN_PASSWORD`
- 📝 **Сохраните пароль** в безопасном месте

## Пароль админ-панели

- **Email:** `admin@yachts-sochi.ru` (должен быть в базе данных)
- **Пароль:** значение из `ADMIN_PASSWORD` в `.env`

Если админа нет в базе, создайте его через seed:
```bash
docker-compose exec app npm run db:seed
```

Или вручную через SQL (см. `prisma/seed.ts`).
