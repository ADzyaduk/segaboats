# 🚤 Boats2026 - Система бронирования яхт

Веб-приложение для бронирования яхт и катеров в Сочи с интеграцией Telegram бота и автоматизацией через n8n.

## 🚀 Быстрый старт

### Разработка

```bash
# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env

# Запуск dev сервера
npm run dev
```

### Деплой

**Самый простой способ:**
```bash
# Linux/Mac
./scripts/deploy.sh

# Windows
.\scripts\deploy.ps1
```

📖 **Подробная инструкция:** [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)

## 📚 Документация

- [🚀 Быстрый деплой](./QUICK_DEPLOY.md) - пошаговая инструкция по деплою
- [📋 Полное руководство по деплою](./docs/DEPLOYMENT.md) - детальная документация
- [🤖 Настройка Telegram бота](./docs/TELEGRAM_SETUP.md)
- [⚙️ Настройка n8n](./docs/N8N_SETUP.md)
- [👨‍💼 Руководство администратора](./README_ADMIN.md)

## 🛠 Технологии

- **Frontend:** Nuxt 4, Vue 3, Nuxt UI, Tailwind CSS
- **Backend:** Nuxt Server API, Prisma ORM
- **Database:** PostgreSQL / SQLite (dev)
- **Automation:** n8n
- **Deployment:** Docker, Docker Compose, Nginx

## 📦 Структура проекта

```
boats2026/
├── app/              # Nuxt приложение
│   ├── components/   # Vue компоненты
│   ├── pages/        # Страницы
│   ├── stores/       # Pinia stores
│   └── composables/ # Composables
├── server/           # Server API routes
├── prisma/           # Database schema
├── docker/           # Docker конфигурация
├── nginx/            # Nginx конфигурация
└── scripts/          # Скрипты деплоя
```

## 🔧 Команды

```bash
# Разработка
npm run dev          # Запуск dev сервера
npm run build        # Сборка для продакшн
npm run preview      # Превью продакшн сборки

# База данных
npm run db:generate  # Генерация Prisma клиента
npm run db:push      # Применить схему к БД
npm run db:migrate   # Создать миграцию
npm run db:seed      # Заполнить тестовыми данными
npm run db:studio    # Открыть Prisma Studio

# Тестирование
npm run test:api     # Тесты API
npm run test:components # Тесты компонентов
npm run test:full    # Полное тестирование
```

## 🐳 Docker

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f app

# Остановка
docker-compose down
```

## 📝 Переменные окружения

См. [.env.example](./.env.example) для полного списка переменных.

Основные:
- `DATABASE_URL` - строка подключения к БД
- `TELEGRAM_BOT_TOKEN` - токен Telegram бота
- `TELEGRAM_BOT_USERNAME` - username бота
- `TELEGRAM_WEBHOOK_SECRET` - секрет для webhook
- `N8N_WEBHOOK_URL` - URL n8n инстанса
- `N8N_API_KEY` - API ключ n8n

## 🤝 Вклад

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект является частным.

## 🔗 Полезные ссылки

- [Nuxt Documentation](https://nuxt.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [n8n Documentation](https://docs.n8n.io)
- [Docker Documentation](https://docs.docker.com)
