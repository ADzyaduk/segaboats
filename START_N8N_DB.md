# 🚀 Запуск n8n и базы данных на сервере

## Простая инструкция

### 1. Подключитесь к серверу по SSH

```bash
ssh user@your-server-ip
```

### 2. Перейдите в папку проекта

```bash
cd /path/to/boats2026
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

### 4. Запустите n8n и базу данных

```bash
docker-compose -f docker-compose.test.yml up -d
```

### 5. Проверьте, что все запустилось

```bash
docker-compose -f docker-compose.test.yml ps
```

Должны быть запущены:
- `boats2026-db-test` (PostgreSQL)
- `boats2026-n8n-test` (n8n)

### 6. Откройте n8n в браузере

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
