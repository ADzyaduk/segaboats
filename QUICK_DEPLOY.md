# 🚀 Быстрый деплой Boats2026

## Вариант 1: Docker Compose (Рекомендуется)

### Шаг 1: Подготовка

```bash
# Клонируйте репозиторий (если еще не сделано)
git clone <your-repo-url>
cd boats2026

# Создайте .env файл
cp .env.example .env
# Отредактируйте .env и заполните все переменные
nano .env  # или notepad .env на Windows
```

### Шаг 2: Запуск

**Linux/Mac:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**Windows PowerShell:**
```powershell
.\scripts\deploy.ps1
```

**Или вручную:**
```bash
# Сборка и запуск
docker-compose up -d --build

# Инициализация базы данных
docker-compose exec app npm run db:push
docker-compose exec app npm run db:seed  # опционально
```

### Шаг 3: Проверка

- Приложение: http://localhost
- n8n панель: http://localhost:5678
- Логи: `docker-compose logs -f app`

---

## Вариант 2: Ручной деплой на VPS

### Требования
- Ubuntu 20.04+ или Debian 11+
- Root доступ
- Домен (для SSL)

### Установка

```bash
# 1. Обновление системы
sudo apt update && sudo apt upgrade -y

# 2. Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 3. Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Клонирование проекта
cd /opt
sudo git clone <your-repo-url> boats2026
cd boats2026

# 5. Настройка .env
sudo cp .env.example .env
sudo nano .env  # Заполните все переменные

# 6. Запуск
sudo docker-compose up -d --build

# 7. Инициализация БД
sudo docker-compose exec app npm run db:push
```

---

## Настройка SSL (Let's Encrypt)

### 1. Установка Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Получение сертификата

```bash
# Остановите nginx в docker-compose временно
docker-compose stop nginx

# Получите сертификат
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Сертификаты будут в:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### 3. Настройка nginx

```bash
# Скопируйте production конфигурацию
cp nginx/conf.d/production.conf.example nginx/conf.d/default.conf

# Отредактируйте server_name в default.conf
nano nginx/conf.d/default.conf

# Скопируйте сертификаты в nginx/ssl/
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/*.pem
```

### 4. Обновите docker-compose.yml

Добавьте volume для сертификатов:

```yaml
nginx:
  volumes:
    - ./nginx/ssl:/etc/nginx/ssl:ro
```

### 5. Перезапуск

```bash
docker-compose up -d
```

---

## Настройка Telegram Bot

### 1. Создание бота

1. Откройте Telegram, найдите @BotFather
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Сохраните токен

### 2. Настройка webhook

Добавьте в `.env`:
```env
TELEGRAM_BOT_TOKEN=your-token-here
TELEGRAM_BOT_USERNAME=your-bot-username
TELEGRAM_WEBHOOK_SECRET=random-secret-string
```

### 3. Установка webhook

```bash
# После деплоя
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-domain.com/api/telegram/webhook" \
  -d "secret_token=your-webhook-secret"
```

### 4. Проверка

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

---

## Полезные команды

### Управление контейнерами

```bash
# Статус
docker-compose ps

# Логи
docker-compose logs -f app
docker-compose logs -f nginx
docker-compose logs -f postgres

# Перезапуск
docker-compose restart app

# Остановка
docker-compose down

# Остановка с удалением volumes (⚠️ удалит данные БД)
docker-compose down -v
```

### База данных

```bash
# Подключение к БД
docker-compose exec postgres psql -U boats -d boats2026

# Бэкап
docker-compose exec postgres pg_dump -U boats boats2026 > backup.sql

# Восстановление
docker-compose exec -T postgres psql -U boats boats2026 < backup.sql

# Миграции
docker-compose exec app npm run db:push

# Seed (тестовые данные)
docker-compose exec app npm run db:seed
```

### Обновление приложения

```bash
# 1. Получить обновления
git pull

# 2. Пересобрать и перезапустить
docker-compose up -d --build

# 3. Применить миграции (если есть)
docker-compose exec app npm run db:push
```

---

## Troubleshooting

### Приложение не запускается

```bash
# Проверьте логи
docker-compose logs app

# Проверьте переменные окружения
docker-compose exec app env | grep -E "DATABASE|TELEGRAM|N8N"

# Проверьте подключение к БД
docker-compose exec app npm run db:push
```

### Ошибки базы данных

```bash
# Проверьте статус PostgreSQL
docker-compose ps postgres

# Проверьте логи
docker-compose logs postgres

# Пересоздайте БД (⚠️ удалит данные)
docker-compose down -v
docker-compose up -d postgres
sleep 5
docker-compose exec app npm run db:push
```

### Nginx ошибки

```bash
# Проверьте конфигурацию
docker-compose exec nginx nginx -t

# Перезапустите nginx
docker-compose restart nginx

# Проверьте логи
docker-compose logs nginx
```

### Проблемы с портами

Если порты заняты:

```bash
# Проверьте занятые порты
sudo netstat -tulpn | grep -E "80|443|3000|5432|5678"

# Измените порты в docker-compose.yml
# Например, измените "80:80" на "8080:80"
```

---

## Мониторинг

### Health Check

```bash
# Проверка здоровья приложения
curl http://localhost/health

# Или через docker
docker-compose exec app wget -qO- http://localhost:3000/api/health
```

### Ресурсы

```bash
# Использование ресурсов
docker stats

# Логи в реальном времени
docker-compose logs -f
```

---

## Безопасность

### Firewall (UFW)

```bash
# Разрешить только необходимые порты
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
```

### Обновление системы

```bash
# Регулярно обновляйте систему
sudo apt update && sudo apt upgrade -y

# Перезапуск после обновления ядра
sudo reboot
```

---

## Поддержка

Если возникли проблемы:
1. Проверьте логи: `docker-compose logs`
2. Проверьте документацию: `docs/DEPLOYMENT.md`
3. Проверьте issues в репозитории
