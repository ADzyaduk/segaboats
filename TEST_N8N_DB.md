# 🧪 Тестирование n8n и базы данных

Инструкция по запуску только n8n и PostgreSQL для тестирования, пока не решены проблемы с Nuxt UI.

## 🚀 Быстрый старт

### 1. Подготовка

Убедитесь, что у вас есть файл `.env` с минимальными настройками:

```env
# PostgreSQL
POSTGRES_USER=boats
POSTGRES_PASSWORD=boats2026secret
POSTGRES_DB=boats2026

# n8n
N8N_USER=admin
N8N_PASSWORD=admin2026
N8N_HOST=localhost
N8N_DB_NAME=n8n
```

### 2. Запуск сервисов

**Windows PowerShell:**
```powershell
docker-compose -f docker-compose.test.yml up -d
```

**Linux/Mac:**
```bash
docker-compose -f docker-compose.test.yml up -d
```

### 3. Проверка статуса

```bash
docker-compose -f docker-compose.test.yml ps
```

Должны быть запущены:
- `boats2026-db-test` (PostgreSQL)
- `boats2026-n8n-test` (n8n)

## ✅ Проверка работы

### PostgreSQL

**Проверка подключения:**
```bash
# Windows PowerShell
docker exec -it boats2026-db-test psql -U boats -d boats2026

# Linux/Mac
docker exec -it boats2026-db-test psql -U boats -d boats2026
```

**Создание тестовой таблицы:**
```sql
CREATE TABLE test_bookings (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO test_bookings (customer_name, phone) 
VALUES ('Тестовый клиент', '+7 (900) 123-45-67');

SELECT * FROM test_bookings;
```

**Выход:** `\q`

### n8n

**Доступ к интерфейсу:**
- URL: http://localhost:5678
- Логин: `admin` (или значение из `N8N_USER`)
- Пароль: `admin2026` (или значение из `N8N_PASSWORD`)

**Проверка логов:**
```bash
docker logs boats2026-n8n-test -f
```

## 🧪 Тестирование Webhook

### 1. Создание простого workflow в n8n

1. Откройте http://localhost:5678
2. Войдите с учетными данными
3. Создайте новый workflow
4. Добавьте узел **Webhook**
5. Настройте:
   - Method: `POST`
   - Path: `test-booking`
   - Response Mode: `Last Node`
6. Добавьте узел **Respond to Webhook**
7. Настройте ответ:
   ```json
   {
     "status": "success",
     "message": "Webhook received",
     "data": {{ $json }}
   }
   ```
8. Активируйте workflow (переключатель в правом верхнем углу)

### 2. Тестирование webhook

**Windows PowerShell:**
```powershell
$body = @{
    event = "booking.created"
    data = @{
        bookingId = "test-123"
        customerName = "Иван Иванов"
        customerPhone = "+7 (900) 123-45-67"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5678/webhook/test-booking" -Method Post -Body $body -ContentType "application/json"
```

**Linux/Mac/curl:**
```bash
curl -X POST http://localhost:5678/webhook/test-booking \
  -H "Content-Type: application/json" \
  -d '{
    "event": "booking.created",
    "data": {
      "bookingId": "test-123",
      "customerName": "Иван Иванов",
      "customerPhone": "+7 (900) 123-45-67"
    }
  }'
```

**Ожидаемый ответ:**
```json
{
  "status": "success",
  "message": "Webhook received",
  "data": {
    "event": "booking.created",
    "data": {
      "bookingId": "test-123",
      "customerName": "Иван Иванов",
      "customerPhone": "+7 (900) 123-45-67"
    }
  }
}
```

## 🔗 Интеграция с базой данных

### Создание workflow для записи в БД

1. В n8n создайте новый workflow
2. Добавьте узел **Webhook** (как выше)
3. Добавьте узел **Postgres**
4. Настройте подключение:
   - Host: `postgres`
   - Database: `boats2026`
   - User: `boats`
   - Password: `boats2026secret`
   - Port: `5432`
5. Выберите операцию: `Execute Query`
6. SQL запрос:
   ```sql
   INSERT INTO test_bookings (customer_name, phone)
   VALUES ($1, $2)
   RETURNING id, customer_name, phone, created_at;
   ```
7. Параметры:
   - `$1`: `{{ $json.data.customerName }}`
   - `$2`: `{{ $json.data.customerPhone }}`

### Тестирование записи в БД

Отправьте webhook запрос (как выше), и проверьте базу данных:

```bash
docker exec -it boats2026-db-test psql -U boats -d boats2026 -c "SELECT * FROM test_bookings;"
```

## 📊 Полезные команды

### Просмотр логов

```bash
# Все сервисы
docker-compose -f docker-compose.test.yml logs -f

# Только PostgreSQL
docker logs boats2026-db-test -f

# Только n8n
docker logs boats2026-n8n-test -f
```

### Остановка сервисов

```bash
docker-compose -f docker-compose.test.yml down
```

### Остановка с удалением данных

⚠️ **Внимание:** Это удалит все данные!

```bash
docker-compose -f docker-compose.test.yml down -v
```

### Перезапуск

```bash
docker-compose -f docker-compose.test.yml restart
```

### Проверка использования ресурсов

```bash
docker stats boats2026-db-test boats2026-n8n-test
```

## 🔧 Настройка для продакшн

Когда будете готовы к продакшн использованию:

1. Измените пароли в `.env`
2. Настройте SSL для n8n (если нужен внешний доступ)
3. Ограничьте доступ к портам через firewall
4. Настройте регулярные бэкапы базы данных

## 🆘 Troubleshooting

### n8n не запускается

```bash
# Проверьте логи
docker logs boats2026-n8n-test

# Проверьте, что PostgreSQL доступен
docker exec boats2026-db-test pg_isready -U boats
```

### Проблемы с подключением к БД

```bash
# Проверьте статус PostgreSQL
docker exec boats2026-db-test pg_isready -U boats

# Проверьте логи
docker logs boats2026-db-test
```

### Порт 5678 занят

Измените порт в `docker-compose.test.yml`:

```yaml
n8n:
  ports:
    - "5679:5678"  # Используйте другой порт
```

### Порт 5432 занят

Измените порт в `docker-compose.test.yml`:

```yaml
postgres:
  ports:
    - "5433:5432"  # Используйте другой порт
```

И обновите подключение в n8n на `postgres:5432` (внутри Docker сети порт остается 5432).

## 📝 Следующие шаги

После успешного тестирования:

1. ✅ Убедитесь, что n8n работает корректно
2. ✅ Проверьте подключение к базе данных
3. ✅ Создайте тестовые workflows
4. ✅ Протестируйте webhook endpoints
5. 🔄 Решите проблемы с Nuxt UI
6. 🔄 Запустите полный стек с `docker-compose.yml`

---

**Готово!** Теперь вы можете тестировать n8n и базу данных независимо от основного приложения.
