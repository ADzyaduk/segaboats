# Скрипты деплоя

## deploy.sh (Linux/Mac)

Автоматизированный скрипт деплоя для Unix-систем.

**Использование:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh [production|staging]
```

**Что делает:**
1. Проверяет наличие `.env` файла
2. Проверяет установку Docker и Docker Compose
3. Останавливает существующие контейнеры
4. Собирает Docker образы
5. Запускает контейнеры
6. Инициализирует базу данных
7. Опционально заполняет тестовыми данными

## deploy.ps1 (Windows)

Автоматизированный скрипт деплоя для Windows PowerShell.

**Использование:**
```powershell
.\scripts\deploy.ps1 [production|staging]
```

**Что делает:**
- То же самое, что и `deploy.sh`, но для Windows

## Ручной деплой

Если скрипты не работают, используйте команды вручную:

```bash
# 1. Создайте .env файл
cp .env.example .env
# Отредактируйте .env

# 2. Соберите и запустите
docker-compose up -d --build

# 3. Инициализируйте БД
docker-compose exec app npm run db:push
docker-compose exec app npm run db:seed  # опционально
```

## Troubleshooting

### Ошибка прав доступа (Linux/Mac)

```bash
chmod +x scripts/deploy.sh
```

### Ошибка выполнения политики (Windows)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Docker не найден

Убедитесь, что Docker и Docker Compose установлены:
```bash
docker --version
docker-compose --version
```
