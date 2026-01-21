# Настройка SSL для v-more.ru

## Важно: Переход с v-more.store на v-more.ru

Теперь **v-more.ru** является основным доменом, а v-more.store автоматически редиректит на него.

## Шаг 1: Установить Certbot

```bash
# SSH на сервер
ssh root@193.42.127.120

# Установить Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

## Шаг 2: Получить SSL сертификат для v-more.ru

### Вариант A: С использованием Nginx

```bash
# Остановить Nginx временно (если запущен)
sudo systemctl stop nginx

# Получить сертификат для v-more.ru и www.v-more.ru
sudo certbot certonly --standalone \
  -d v-more.ru \
  -d www.v-more.ru \
  --non-interactive \
  --agree-tos \
  --email your-email@example.com

# Запустить Nginx
sudo systemctl start nginx
```

### Вариант B: Без остановки Nginx (webroot)

```bash
# Создать директорию для вебрута
sudo mkdir -p /var/www/certbot

# Получить сертификат
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d v-more.ru \
  -d www.v-more.ru \
  --non-interactive \
  --agree-tos \
  --email your-email@example.com
```

## Шаг 3: Получить SSL для v-more.store (для редиректа)

```bash
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d v-more.store \
  -d www.v-more.store \
  --non-interactive \
  --agree-tos \
  --email your-email@example.com
```

## Шаг 4: Проверить сертификаты

```bash
# Посмотреть список сертификатов
sudo certbot certificates

# Должно показать:
# Certificate Name: v-more.ru
#   Domains: v-more.ru www.v-more.ru
#   Expiry Date: ...
#   Certificate Path: /etc/letsencrypt/live/v-more.ru/fullchain.pem
#   Private Key Path: /etc/letsencrypt/live/v-more.ru/privkey.pem

# Certificate Name: v-more.store
#   Domains: v-more.store www.v-more.store
#   ...
```

## Шаг 5: Обновить Nginx конфигурацию

Конфигурация уже использует правильные пути к сертификатам:

```nginx
# v-more.ru
ssl_certificate /etc/letsencrypt/live/v-more.ru/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/v-more.ru/privkey.pem;

# v-more.store (для редиректа)
ssl_certificate /etc/letsencrypt/live/v-more.ru/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/v-more.ru/privkey.pem;
```

Перезагрузить Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Шаг 6: Автоматическое обновление сертификатов

```bash
# Проверить автообновление
sudo certbot renew --dry-run

# Добавить в cron (если не добавлено автоматически)
sudo crontab -e

# Добавить строку:
0 0,12 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

## Проверка работы

### 1. Проверить v-more.ru

```bash
curl -I https://v-more.ru/
# Должно вернуть 200 OK

curl -I https://www.v-more.ru/
# Должно редиректить на https://v-more.ru/ (301)
```

### 2. Проверить редирект с v-more.store

```bash
curl -I https://v-more.store/
# Должно редиректить на https://v-more.ru/ (301)

curl -I http://v-more.store/
# Должно редиректить на https://v-more.ru/ (301)
```

### 3. Проверить SSL рейтинг

Откройте: https://www.ssllabs.com/ssltest/analyze.html?d=v-more.ru

Должен быть рейтинг **A** или **A+**.

## Troubleshooting

### Ошибка "Address already in use"

```bash
# Найти процесс на порту 80
sudo lsof -i :80

# Остановить Nginx
sudo systemctl stop nginx

# Попробовать снова
sudo certbot certonly --standalone -d v-more.ru -d www.v-more.ru
```

### Ошибка "too many certificates"

Let's Encrypt имеет лимит 5 сертификатов в неделю на домен.

Подождите неделю или используйте staging сервер для тестов:

```bash
sudo certbot certonly --staging \
  -d v-more.ru -d www.v-more.ru
```

### Сертификат не обновляется автоматически

```bash
# Проверить статус таймера
sudo systemctl status certbot.timer

# Включить таймер
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Nginx показывает "certificate not found"

Проверьте пути в конфигурации:

```bash
# Проверить что сертификат существует
ls -la /etc/letsencrypt/live/v-more.ru/

# Проверить конфигурацию Nginx
sudo nginx -t

# Если ошибка - проверьте пути в nginx/system-nginx.conf
```

## Полезные команды

```bash
# Список всех сертификатов
sudo certbot certificates

# Обновить все сертификаты вручную
sudo certbot renew

# Удалить сертификат
sudo certbot delete --cert-name v-more.ru

# Проверить срок действия
echo | openssl s_client -servername v-more.ru -connect v-more.ru:443 2>/dev/null | openssl x509 -noout -dates
```

---

## После получения сертификатов

1. Скопируйте обновлённую конфигурацию Nginx:

```bash
cd /root/segaboats
sudo cp nginx/system-nginx.conf /etc/nginx/sites-available/boats2026
sudo nginx -t
sudo systemctl reload nginx
```

2. Проверьте что всё работает:

```bash
# Основной домен
curl -I https://v-more.ru/

# Редирект с www
curl -I https://www.v-more.ru/

# Редирект с .store
curl -I https://v-more.store/

# n8n
curl -I https://v-more.ru/n8n/
```

Готово! 🎉
