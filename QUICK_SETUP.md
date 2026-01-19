# 🚀 Быстрая настройка

## 1. Создание .env файла

**На сервере:**

```bash
cd /opt/segaboats
cp .env.example .env
nano .env
```

**Минимальный .env:**

```env
# База данных
POSTGRES_USER=boats
POSTGRES_PASSWORD=boats2026secret
POSTGRES_DB=boats2026
DATABASE_URL=postgresql://boats:boats2026secret@postgres:5432/boats2026?schema=public

# Админ-панель (ИЗМЕНИТЕ ПАРОЛЬ!)
ADMIN_PASSWORD=ваш-надежный-пароль

# Telegram (если используется)
TELEGRAM_BOT_TOKEN=your-token
TELEGRAM_BOT_USERNAME=your-bot-username
TELEGRAM_WEBHOOK_SECRET=random-secret

# n8n
N8N_WEBHOOK_URL=http://n8n:5678/webhook
N8N_USER=admin
N8N_PASSWORD=admin2026

# Приложение
NODE_ENV=production
APP_URL=http://155.212.189.214
```

## 2. Деплой

```bash
cd /opt/segaboats
git pull
docker-compose down
docker-compose up -d --build
sleep 30
docker-compose exec app npx prisma db push --skip-generate
```

## 3. Доступ к админ-панели

- **URL:** `http://155.212.189.214/admin`
- **Email:** `admin@yachts-sochi.ru`
- **Пароль:** значение из `ADMIN_PASSWORD` в `.env` (по умолчанию `admin2026`)

## 4. Загрузка изображений

### Вариант A: Через админ-панель (проще)

1. Войдите в админ-панель
2. Добавьте/отредактируйте яхту
3. Нажмите **"Загрузить файл"**
4. Выберите изображение
5. Готово! Файл сохранится на сервере в `/public/images/boats/`

### Вариант B: Через SSH

```bash
# Загрузите файл на сервер
scp yacht.jpg user@155.212.189.214:/opt/segaboats/public/images/boats/

# Используйте URL в админ-панели:
/images/boats/yacht.jpg
```

## 5. Проверка

```bash
# Проверить контейнеры
docker-compose ps

# Проверить логи
docker-compose logs app --tail 50

# Проверить доступность
curl http://localhost:3000
```

---

**Готово!** 🎉
