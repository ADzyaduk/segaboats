# Инструкция по настройке HTTPS

## ⚠️ Важно: Let's Encrypt требует домен!

**Let's Encrypt не выдает сертификаты для IP-адресов**, только для доменов. 

### Варианты:
1. **Использовать домен `klernesokof.beget.app`** (рекомендуется) - валидный SSL
2. **Самоподписанный сертификат для IP** - браузеры покажут предупреждение, Telegram может не работать

---

## Вариант 1: HTTPS с доменом (Let's Encrypt) ✅

## Шаг 1: Подключитесь к серверу через SSH

```bash
ssh ваш_пользователь@155.212.189.214
```

## Шаг 2: Перейдите в директорию проекта

```bash
cd /opt/segaboats
# или где у вас находится проект
```

## Шаг 3: Скопируйте скрипт на сервер (если его еще нет)

Если скрипт уже есть в проекте, пропустите этот шаг.

## Шаг 4: Выполните скрипт

```bash
# Сделайте скрипт исполняемым
chmod +x scripts/setup-https.sh

# Запустите скрипт от root
sudo ./scripts/setup-https.sh klernesokof.beget.app admin@klernesokof.beget.app
```

**Или выполните команды вручную:**

```bash
# 1. Установка certbot
sudo apt-get update
sudo apt-get install -y certbot

# 2. Создание директории для сертификатов
mkdir -p nginx/ssl

# 3. Остановка nginx (освобождаем порт 80)
cd /opt/segaboats
docker-compose stop nginx

# 4. Получение сертификата
sudo certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email admin@klernesokof.beget.app \
  -d klernesokof.beget.app

# 5. Копирование сертификатов
sudo cp /etc/letsencrypt/live/klernesokof.beget.app/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/klernesokof.beget.app/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/*.pem
```

## Шаг 5: Обновите конфигурацию Nginx

Замените содержимое `nginx/conf.d/default.conf` на конфигурацию из `nginx/conf.d/https.conf`:

```bash
# Сделайте backup текущей конфигурации
cp nginx/conf.d/default.conf nginx/conf.d/default.conf.backup

# Скопируйте HTTPS конфигурацию
cp nginx/conf.d/https.conf nginx/conf.d/default.conf
```

## Шаг 6: Обновите переменные окружения

В `.env` файле обновите:

```env
N8N_PROTOCOL=https
N8N_WEBHOOK_URL=https://klernesokof.beget.app/webhook
```

## Шаг 7: Перезапустите сервисы

```bash
docker-compose restart nginx
docker-compose restart app
docker-compose restart n8n
```

## Шаг 8: Проверьте HTTPS

Откройте в браузере: `https://klernesokof.beget.app`

## Автоматическое обновление сертификатов

Let's Encrypt сертификаты действительны 90 дней. Настройте автоматическое обновление:

```bash
# Добавьте в crontab (sudo crontab -e)
0 0 * * * certbot renew --quiet && docker exec boats2026-nginx nginx -s reload
```

Или создайте systemd timer для обновления сертификатов.

---

## Вариант 2: Самоподписанный сертификат для IP ⚠️

**ВНИМАНИЕ:** 
- Браузеры будут показывать предупреждение о безопасности
- Telegram webhooks **НЕ БУДУТ РАБОТАТЬ** (Telegram требует валидный SSL)
- Используйте только для тестирования!

### Шаг 1: Создайте самоподписанный сертификат

```bash
cd /opt/segaboats
chmod +x scripts/setup-self-signed-ssl.sh
sudo ./scripts/setup-self-signed-ssl.sh 155.212.189.214
```

**Или вручную:**

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/C=RU/ST=Moscow/L=Moscow/O=Boats2026/CN=155.212.189.214" \
  -addext "subjectAltName=IP:155.212.189.214"
chmod 644 nginx/ssl/*.pem
```

### Шаг 2: Обновите конфигурацию Nginx

```bash
cp nginx/conf.d/https-ip.conf nginx/conf.d/default.conf
```

### Шаг 3: Перезапустите nginx

```bash
docker-compose restart nginx
```

### Шаг 4: Проверьте

Откройте `https://155.212.189.214` - браузер покажет предупреждение (это нормально для самоподписанного сертификата).

---

## Рекомендация

**Используйте домен `klernesokof.beget.app`** - это бесплатно и даст валидный SSL сертификат, который будет работать с Telegram и всеми сервисами.
