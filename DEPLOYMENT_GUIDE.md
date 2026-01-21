# Руководство по развёртыванию обновлений

## Что было добавлено

- n8n UI доступен через HTTPS: `https://v-more.ru/n8n/`
- Загрузка фото в админке работает (volume для images)
- Динамический sitemap.xml для SEO
- Обновлённый robots.txt с правилами для AI краулеров
- n8n workflows с GPT-4o-mini для умных уведомлений
- Механизм связи веб-пользователей с Telegram через deep-link
- Редирект с v-more.store на v-more.ru (основной домен)
- Подробная документация по настройке

---

## ⚠️ ВАЖНО: Переход на v-more.ru

Теперь **v-more.ru** — основной домен. v-more.store автоматически редиректит на него.

**Если у вас пока нет SSL сертификата для v-more.ru:**
1. Следуйте инструкции: [`docs/SSL_SETUP.md`](docs/SSL_SETUP.md)
2. Получите сертификаты для обоих доменов
3. Только потом выполняйте шаги ниже

---

## Порядок развёртывания на сервере

### 1. Обновить код

```bash
# SSH на сервер
ssh root@193.42.127.120

# Перейти в папку проекта
cd /root/segaboats

# Обновить из git
git pull origin master
```

### 2. Настроить .env файл

```bash
# Скопировать пример
cp env.example .env

# Отредактировать
nano .env
```

**Обязательно заполните:**
- `TELEGRAM_BOT_TOKEN` - от @BotFather
- `TELEGRAM_BOT_USERNAME` - имя бота без @
- `TELEGRAM_ADMIN_CHAT_ID` - ваш ID от @userinfobot
- `TELEGRAM_WEBHOOK_SECRET` - сгенерируйте: `openssl rand -hex 32`
- `OPENROUTER_API_KEY` - от https://openrouter.ai/keys (для AI)

Подробная инструкция: [`docs/ENV_SETUP.md`](docs/ENV_SETUP.md)

### 3. Создать папки для изображений

```bash
mkdir -p public/images/boats
chown -R 1000:1000 public/images
chmod -R 755 public/images
```

### 4. Проверить конфигурацию

```bash
bash scripts/check-config.sh
```

Скрипт проверит все обязательные переменные.

### 5. Обновить system nginx

```bash
# Скопировать новую конфигурацию
sudo cp nginx/system-nginx.conf /etc/nginx/sites-available/boats2026

# Проверить синтаксис
sudo nginx -t

# Применить изменения
sudo systemctl reload nginx
```

### 6. Перезапустить контейнеры

```bash
# Остановить
docker compose down

# Запустить с пересборкой
docker compose up -d --build

# Проверить статус
docker ps
```

Подождите 1-2 минуты пока контейнеры запустятся.

### 7. Проверить работу

```bash
# Проверить приложение
curl -I https://v-more.ru/

# Проверить n8n
curl -I https://v-more.ru/n8n/

# Проверить sitemap
curl -s https://v-more.ru/sitemap.xml | head -20

# Проверить редирект с .store на .ru
curl -I https://v-more.store/
```

---

## Доступ к системам

После развёртывания:

### Админ-панель
- URL: https://v-more.ru/admin
- Логин: `admin@boats2026.ru`
- Пароль: значение `ADMIN_PASSWORD` из .env (по умолчанию `admin2026`)

### n8n UI
- URL: https://v-more.ru/n8n/
- Логин: значение `N8N_USER` из .env (по умолчанию `admin`)
- Пароль: значение `N8N_PASSWORD` из .env (по умолчанию `admin2026`)

### База данных
- Host: `localhost:5432` (на сервере)
- Database: `boats2026`
- User: `boats`
- Password: значение `POSTGRES_PASSWORD` из .env

---

## Настройка n8n workflows

### 1. Зайти в n8n UI

https://v-more.ru/n8n/

### 2. Настроить Credentials

#### PostgreSQL Boats
- Type: **PostgreSQL**
- Host: `postgres`
- Port: `5432`
- Database: `boats2026`
- User: `boats`
- Password: значение из `POSTGRES_PASSWORD`
- SSL: Disabled

#### OpenRouter API
- Type: **HTTP Header Auth**
- Name: `OpenRouter API`
- Header Name: `Authorization`
- Header Value: `Bearer YOUR_OPENROUTER_KEY`

#### Telegram Bot
- Type: **Telegram**
- Access Token: значение из `TELEGRAM_BOT_TOKEN`

### 3. Импортировать workflows

Workflows → Import from File → выберите:
1. `n8n-workflows/ai-booking-notification.json`
2. `n8n-workflows/smart-booking-reminder.json`

### 4. Активировать workflows

После импорта:
- Откройте каждый workflow
- Проверьте credentials в узлах
- Нажмите **Active** (переключатель в правом верхнем углу)

Подробности: [`n8n-workflows/README.md`](n8n-workflows/README.md)

---

## Настройка Telegram Mini App

### 1. Открыть @BotFather

### 2. Настроить Menu Button

```
/mybots → выберите бота → Bot Settings → Menu Button → Configure menu button
```

Введите:
- Button text: `🛥 Каталог яхт`
- Web App URL: `https://v-more.ru`

### 3. Настроить команды

```
/setcommands → выберите бота
```

Отправьте:
```
start - Начать работу с ботом
boats - Каталог яхт
mybookings - Мои бронирования
help - Помощь
```

### 4. Установить webhook

На сервере выполните (замените YOUR_BOT_TOKEN):

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://v-more.ru/api/telegram/webhook",
    "secret_token": "YOUR_WEBHOOK_SECRET",
    "allowed_updates": ["message", "callback_query"]
  }'
```

Подробности: [`docs/TELEGRAM_MINIAPP_SETUP.md`](docs/TELEGRAM_MINIAPP_SETUP.md)

---

## Тестирование

### 1. Проверить админку

1. Откройте https://v-more.ru/admin
2. Войдите с `admin@boats2026.ru` / `admin2026`
3. Попробуйте добавить яхту с фото

### 2. Проверить загрузку фото

В админке:
1. Яхты → Добавить яхту
2. Заполните название
3. Нажмите кнопку загрузки фото
4. Выберите изображение
5. Фото должно загрузиться и отобразиться

### 3. Проверить Telegram Bot

1. Найдите вашего бота в Telegram
2. Отправьте `/start`
3. Должно прийти приветствие с кнопками
4. Нажмите кнопку меню → откроется Mini App

### 4. Проверить n8n

1. Откройте https://v-more.ru/n8n/
2. Войдите
3. Проверьте что workflows импортированы

### 5. Проверить webhook связывание

1. На сайте забронируйте яхту (через веб, не через Telegram)
2. После бронирования появится блок "Получайте уведомления в Telegram"
3. Нажмите кнопку → откроется бот
4. Бот отправит сообщение "Уведомления подключены!"

---

## Troubleshooting

### n8n не открывается

```bash
# Проверить логи
docker logs boats2026-n8n --tail 50

# Проверить nginx
sudo nginx -t
sudo systemctl status nginx

# Проверить переменную N8N_PATH
docker exec boats2026-n8n printenv | grep N8N_PATH
```

### Фото не загружаются

```bash
# Проверить права
ls -la public/images/

# Исправить права
chown -R 1000:1000 public/images
chmod -R 755 public/images

# Проверить volume
docker inspect boats2026-app | grep -A 5 Mounts
```

### Telegram webhook не работает

```bash
# Проверить webhook status
curl "https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo"

# Проверить логи приложения
docker logs boats2026-app --tail 50 | grep -i telegram
```

### AI уведомления не отправляются

```bash
# Проверить OpenRouter ключ в n8n
docker exec boats2026-n8n printenv | grep OPENROUTER

# Проверить логи n8n
docker logs boats2026-n8n --tail 50

# Проверить баланс на openrouter.ai/activity
```

---

## Полезные команды

```bash
# Перезапустить всё
docker compose restart

# Пересобрать только приложение
docker compose up -d --build app

# Посмотреть логи в реальном времени
docker logs -f boats2026-app

# Подключиться к базе
docker exec -it boats2026-db psql -U boats -d boats2026

# Диагностика сервера
bash scripts/diagnose-server.sh
```

---

## Дополнительные ресурсы

- [SSL_SETUP.md](docs/SSL_SETUP.md) - Настройка SSL сертификатов для v-more.ru
- [ENV_SETUP.md](docs/ENV_SETUP.md) - Подробная настройка переменных
- [TELEGRAM_MINIAPP_SETUP.md](docs/TELEGRAM_MINIAPP_SETUP.md) - Настройка Mini App
- [n8n-workflows/README.md](n8n-workflows/README.md) - Описание workflows
