# 🚀 Деплой через SSH - Пошаговая инструкция

Выполните эти команды на сервере после подключения по SSH.

## Шаг 1: Проверка окружения

```bash
# Проверьте версию ОС
cat /etc/os-release

# Проверьте Docker
docker --version
docker-compose --version

# Если Docker не установлен, установите его:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker  # или переподключитесь по SSH

# Установка Docker Compose (если нужно)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Шаг 2: Клонирование проекта

```bash
# Выберите директорию для проекта (например, /opt или /home/username)
cd /opt  # или cd ~

# Клонируйте репозиторий
git clone <your-repo-url> boats2026
cd boats2026

# Или если репозиторий уже склонирован:
cd /path/to/boats2026
git pull  # обновить до последней версии
```

## Шаг 3: Настройка переменных окружения

```bash
# Создайте .env файл
cp .env.example .env

# Отредактируйте .env
nano .env  # или vi .env

# Минимально необходимые переменные:
# DATABASE_URL="postgresql://boats:boats2026secret@postgres:5432/boats2026?schema=public"
# TELEGRAM_BOT_TOKEN=your-token-here
# TELEGRAM_BOT_USERNAME=your-bot-username
# TELEGRAM_WEBHOOK_SECRET=random-secret-string
# N8N_WEBHOOK_URL=http://n8n:5678/webhook
# N8N_API_KEY=your-api-key
# APP_URL=https://your-domain.com
```

## Шаг 4: Деплой

### Вариант A: Автоматический (рекомендуется)

```bash
# Сделайте скрипт исполняемым
chmod +x scripts/deploy.sh

# Запустите деплой
./scripts/deploy.sh
```

### Вариант B: Ручной

```bash
# 1. Сборка и запуск контейнеров
docker-compose up -d --build

# 2. Подождите немного для запуска БД
sleep 15

# 3. Инициализация базы данных
docker-compose exec app npm run db:generate
docker-compose exec app npm run db:push

# 4. Опционально: заполнение тестовыми данными
docker-compose exec app npm run db:seed
```

## Шаг 5: Проверка

```bash
# Проверьте статус контейнеров
docker-compose ps

# Проверьте логи
docker-compose logs app
docker-compose logs nginx
docker-compose logs postgres

# Проверьте доступность приложения
curl http://localhost/health
curl http://localhost/api/health

# Если есть домен, проверьте снаружи:
curl http://your-domain.com/health
```

## Шаг 6: Настройка домена и SSL (если нужно)

```bash
# 1. Установите Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# 2. Остановите nginx в docker временно
docker-compose stop nginx

# 3. Получите сертификат
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 4. Скопируйте сертификаты
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/*.pem

# 5. Настройте nginx для продакшн
cp nginx/conf.d/production.conf.example nginx/conf.d/default.conf
nano nginx/conf.d/default.conf  # Замените your-domain.com на ваш домен

# 6. Перезапустите nginx
docker-compose up -d nginx
```

## Шаг 7: Настройка Telegram Webhook

```bash
# После деплоя установите webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-domain.com/api/telegram/webhook" \
  -d "secret_token=<YOUR_WEBHOOK_SECRET>"

# Проверьте webhook
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## Полезные команды

```bash
# Просмотр логов в реальном времени
docker-compose logs -f app

# Перезапуск приложения
docker-compose restart app

# Остановка всех контейнеров
docker-compose down

# Полная пересборка
docker-compose down
docker-compose up -d --build

# Бэкап базы данных
docker-compose exec postgres pg_dump -U boats boats2026 > backup_$(date +%Y%m%d).sql

# Восстановление из бэкапа
docker-compose exec -T postgres psql -U boats boats2026 < backup.sql
```

## Troubleshooting

### Проблема: Docker требует sudo

```bash
# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker  # или переподключитесь
```

### Проблема: Порт 80 занят

```bash
# Проверьте, что использует порт 80
sudo netstat -tulpn | grep :80

# Если nginx уже установлен на хосте, остановите его:
sudo systemctl stop nginx
sudo systemctl disable nginx
```

### Проблема: Недостаточно места на диске

```bash
# Проверьте свободное место
df -h

# Очистите неиспользуемые Docker образы
docker system prune -a
```

### Проблема: Ошибки при сборке

```bash
# Проверьте логи сборки
docker-compose build --no-cache 2>&1 | tee build.log

# Проверьте переменные окружения
docker-compose exec app env | grep -E "DATABASE|TELEGRAM|N8N"
```

## Мониторинг

```bash
# Использование ресурсов
docker stats

# Проверка здоровья
docker-compose ps
curl http://localhost/health

# Автозапуск при перезагрузке сервера
# Docker Compose уже настроен с restart: unless-stopped
# Но убедитесь, что Docker запускается автоматически:
sudo systemctl enable docker
sudo systemctl start docker
```

---

**Готово!** 🎉 Ваше приложение должно быть доступно на http://your-server-ip или https://your-domain.com
