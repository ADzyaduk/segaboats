# 🚀 Запуск n8n и базы данных на сервере

## Простая инструкция

### 1. Подключитесь к серверу по SSH

```bash
ssh user@your-server-ip
```

### 2. Перейдите в папку проекта

**Если проект уже склонирован, проверьте где:**
```bash
# Обычные места:
cd /opt/boats2026        # системная папка
# или
cd ~/boats2026           # домашняя папка пользователя
# или
cd /var/www/boats2026    # веб-папка
```

**Если проект еще не склонирован:**
```bash
# Выберите папку (рекомендуется /opt):
cd /opt
git clone <your-repo-url> boats2026
cd boats2026
```

**Если не знаете где проект, найдите его:**
```bash
find / -name "boats2026" -type d 2>/dev/null
```

### 3. Создайте .env файл (если его нет)

```bash
nano .env
```

Добавьте минимум:
```env
POSTGRES_USER=boats
POSTGRES_PASSWORD=boats2026secret
POSTGRES_DB=boats2026
N8N_USER=admin
N8N_PASSWORD=admin2026
```

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

### 4. Создайте базу данных для n8n

```bash
# Подключитесь к PostgreSQL
docker exec -it boats2026-db-test psql -U boats -d boats2026

# Создайте базу данных для n8n
CREATE DATABASE n8n;

# Выйдите
\q
```

**Или одной командой:**
```bash
docker exec -it boats2026-db-test psql -U boats -d boats2026 -c "CREATE DATABASE n8n;"
```

### 5. Запустите n8n и базу данных

```bash
docker-compose -f docker-compose.test.yml up -d
```

**Если получили ошибку про secure cookie, обновите конфигурацию:**
```bash
# Обновите docker-compose.test.yml (добавьте N8N_SECURE_COOKIE=false)
# Или выполните:
git pull
docker-compose -f docker-compose.test.yml up -d --force-recreate n8n
```

### 6. Проверьте, что все запустилось

```bash
docker-compose -f docker-compose.test.yml ps
```

Должны быть запущены:
- `boats2026-db-test` (PostgreSQL)
- `boats2026-n8n-test` (n8n)

### 7. Откройте n8n в браузере

```
http://your-server-ip:5678
```

Логин: `admin`  
Пароль: `admin2026`

---

## Полезные команды

**Посмотреть логи:**
```bash
docker-compose -f docker-compose.test.yml logs -f
```

**Остановить:**
```bash
docker-compose -f docker-compose.test.yml down
```

**Перезапустить:**
```bash
docker-compose -f docker-compose.test.yml restart
```

**Подключиться к базе данных:**
```bash
docker exec -it boats2026-db-test psql -U boats -d boats2026
```

---

## Если порты заняты

Измените порты в `docker-compose.test.yml`:
- PostgreSQL: `5433:5432` (вместо 5432)
- n8n: `5679:5678` (вместо 5678)
