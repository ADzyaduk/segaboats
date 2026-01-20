# 🚀 Инструкция по развертыванию на чистом сервере

Полная инструкция по установке проекта Boats2026 на новый чистый Ubuntu сервер.

## 📋 Требования

- Ubuntu 20.04+ или 22.04+
- Root доступ (sudo)
- Минимум 2GB RAM
- Минимум 10GB свободного места

## 🎯 Быстрая установка

### Шаг 1: Подключение к серверу

```bash
ssh root@your_server_ip
```

### Шаг 2: Установка Git (если нет)

```bash
apt-get update
apt-get install -y git
```

### Шаг 3: Клонирование и запуск

```bash
# Клонируйте репозиторий
cd /opt
git clone https://github.com/ADzyaduk/segaboats boats2026

# Перейдите в директорию проекта
cd boats2026

# Запустите скрипт автоматической установки
chmod +x scripts/fresh-server-deploy.sh
sudo ./scripts/fresh-server-deploy.sh
```

Скрипт автоматически выполнит:
1. ✅ Установку Docker и Docker Compose
2. ✅ Клонирование репозитория
3. ✅ Создание .env файла
4. ✅ Сборку Docker образов
5. ✅ Запуск контейнеров
6. ✅ Создание таблиц базы данных
7. ✅ Настройку системного Nginx

### Шаг 4: Настройка .env файла

После установки отредактируйте `.env` файл:

```bash
nano /opt/boats2026/.env
```

**Обязательно заполните:**
- `TELEGRAM_BOT_TOKEN` - токен Telegram бота
- `TELEGRAM_BOT_USERNAME` - username бота
- `TELEGRAM_WEBHOOK_SECRET` - секретный ключ для webhook
- `N8N_HOST` - ваш домен (например: `dequadomiror.beget.app`)
- `N8N_WEBHOOK_URL` - URL для webhook (например: `https://dequadomiror.beget.app/webhook`)
- `NUXT_PUBLIC_APP_URL` - URL вашего сайта (например: `https://dequadomiror.beget.app`)

**Опционально:**
- `ADMIN_PASSWORD` - пароль для админ-панели (по умолчанию: `admin2026`)
- `N8N_USER` и `N8N_PASSWORD` - логин/пароль для n8n (по умолчанию: `admin`/`admin2026`)

### Шаг 5: Перезапуск контейнеров

После редактирования .env:

```bash
cd /opt/boats2026
docker compose restart
```

### Шаг 6: Проверка

```bash
# Проверьте статус контейнеров
docker compose ps

# Проверьте логи
docker compose logs -f

# Проверьте доступность сайта
curl http://localhost
```

## 🔧 Ручная установка (пошагово)

Если автоматический скрипт не подходит, выполните шаги вручную:

### 1. Установка Docker

```bash
sudo ./scripts/install-docker.sh
```

### 2. Клонирование репозитория

```bash
cd /opt
git clone https://github.com/ADzyaduk/segaboats boats2026
cd boats2026
```

### 3. Создание .env файла

```bash
cp .env.example .env
nano .env
```

### 4. Сборка и запуск

```bash
# Сборка образа приложения
docker compose build --no-cache app

# Запуск базы данных
docker compose up -d postgres
sleep 10

# Создание таблиц
docker exec -i boats2026-db psql -U boats -d boats2026 < scripts/create-tables.sql

# Запуск приложения и n8n
docker compose up -d app n8n
```

### 5. Настройка Nginx

```bash
sudo ./scripts/setup-system-nginx.sh
```

## 🌐 Настройка домена

### DNS настройки

Настройте A-запись в DNS вашего домена:
```
@  A  YOUR_SERVER_IP
www A  YOUR_SERVER_IP
```

### Nginx конфигурация

Конфигурация Nginx уже настроена в `nginx/system-nginx.conf` и автоматически копируется при запуске `setup-system-nginx.sh`.

Если нужно изменить домен, отредактируйте:
```bash
nano /opt/boats2026/nginx/system-nginx.conf
# Измените server_name на ваш домен
sudo cp /opt/boats2026/nginx/system-nginx.conf /etc/nginx/sites-available/boats2026
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 Полезные команды

### Управление контейнерами

```bash
# Статус
docker compose ps

# Логи
docker compose logs -f
docker compose logs -f app
docker compose logs -f n8n

# Перезапуск
docker compose restart
docker compose restart app

# Остановка
docker compose stop

# Запуск
docker compose up -d
```

### База данных

```bash
# Подключение к БД
docker exec -it boats2026-db psql -U boats -d boats2026

# Список таблиц
docker exec -it boats2026-db psql -U boats -d boats2026 -c "\dt"

# Бэкап
docker exec boats2026-db pg_dump -U boats boats2026 > backup.sql

# Восстановление
docker exec -i boats2026-db psql -U boats -d boats2026 < backup.sql
```

### Nginx

```bash
# Проверка конфигурации
sudo nginx -t

# Перезагрузка
sudo systemctl reload nginx

# Статус
sudo systemctl status nginx

# Логи
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔐 Безопасность

1. **Измените пароли по умолчанию:**
   - `ADMIN_PASSWORD` в .env
   - `N8N_PASSWORD` в .env
   - `POSTGRES_PASSWORD` в .env

2. **Настройте firewall:**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Регулярно обновляйте систему:**
   ```bash
   sudo apt-get update
   sudo apt-get upgrade -y
   ```

## 🐛 Решение проблем

### Порт 80 занят

```bash
# Проверьте что занимает порт
sudo lsof -i :80

# Остановите Docker nginx (если запущен)
docker compose stop nginx
docker compose rm -f nginx
```

### База данных не работает

```bash
# Проверьте логи
docker compose logs postgres

# Пересоздайте таблицы
docker exec -i boats2026-db psql -U boats -d boats2026 < scripts/create-tables.sql
```

### Приложение не запускается

```bash
# Проверьте логи
docker compose logs app

# Пересоберите образ
docker compose build --no-cache app
docker compose up -d app
```

### Nginx не работает

```bash
# Проверьте конфигурацию
sudo nginx -t

# Проверьте логи
sudo tail -f /var/log/nginx/error.log

# Перезапустите
sudo systemctl restart nginx
```

## 📝 Структура проекта

```
boats2026/
├── docker-compose.yml      # Конфигурация Docker
├── .env                    # Переменные окружения (создается автоматически)
├── .env.example           # Шаблон .env
├── scripts/
│   ├── fresh-server-deploy.sh  # Автоматическая установка
│   ├── install-docker.sh       # Установка Docker
│   ├── setup-system-nginx.sh  # Настройка Nginx
│   └── create-tables.sql      # SQL для создания таблиц
├── nginx/
│   └── system-nginx.conf      # Конфигурация Nginx
└── docker/
    └── Dockerfile             # Dockerfile для приложения
```

## 🔄 Обновление

```bash
cd /opt/boats2026
git pull
docker compose build --no-cache app
docker compose up -d
docker compose restart
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker compose logs -f`
2. Проверьте статус: `docker compose ps`
3. Проверьте Nginx: `sudo systemctl status nginx`
