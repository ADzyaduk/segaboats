# Open Food Facts MCP — развёртывание и использование в n8n

## Обзор

Open Food Facts MCP развёрнут в **отдельном контейнере** и изолирован от остальных сервисов. Используется [mcp-proxy](https://github.com/sparfenyuk/mcp-proxy) для преобразования stdio-транспорта в HTTP/SSE, чтобы n8n мог подключаться к MCP-серверу по URL.

## Архитектура

```
n8n (MCP Client)  ←→  HTTP/SSE  ←→  mcp-proxy  ←→  stdio  ←→  open-food-facts-mcp
```

- **open-food-facts-mcp** — stdio-only MCP сервер (данные Open Food Facts)
- **mcp-proxy** — мост stdio ↔ HTTP/SSE
- **n8n** — подключается по URL (SSE или Streamable HTTP)

## Запуск

```bash
docker compose up -d mcp-openfoodfacts
```

Сервис слушает порт **8080**. Внутри Docker-сети доступен по адресу `http://mcp-openfoodfacts:8080`.

## Подключение в n8n

### 1. MCP Client node

1. Добавьте узел **MCP Client** в воркфлоу.
2. **Server Transport**: выберите **SSE** (или Streamable HTTP, если поддерживается).
3. **MCP Endpoint URL**:
   - внутри Docker: `http://mcp-openfoodfacts:8080/sse`
   - с хоста: `http://localhost:8080/sse`
4. **Authentication**: None (если не настроена авторизация).
5. Выберите нужный **Tool** (список подтягивается автоматически).

### 2. Доступные инструменты (Tools)

| Tool | Описание |
|------|----------|
| `get_product` | Информация о продукте по штрихкоду |
| `search_products` | Поиск продуктов (категории, бренды, Nutri-Score) |
| `analyze_product` | Анализ питательности и Nutri-Score |
| `compare_products` | Сравнение нескольких продуктов |
| `get_product_suggestions` | Рекомендации по продуктам |

### 3. Пример MCP Endpoint URL для n8n

- **Локально (Docker Compose)**: `http://mcp-openfoodfacts:8080/sse`
- **Через внешний домен** (если настроен reverse proxy): `https://mcp.yourdomain.com/sse`

## Изоляция и безопасность

- Сервис работает в отдельном контейнере.
- Нет общих volumes с app, n8n или postgres.
- Сеть: только `boats-network` для доступа из n8n.
- Порт 8080 можно не публиковать, если доступ нужен только из Docker-сети.

## Переменные окружения (опционально)

В `docker-compose.yml` можно добавить:

```yaml
environment:
  - OPEN_FOOD_FACTS_BASE_URL=https://world.openfoodfacts.net
  - OPEN_FOOD_FACTS_USER_AGENT=YourApp/1.0 (contact@example.com)
```

## Проверка работы

```bash
# Проверка, что контейнер запущен
docker compose ps mcp-openfoodfacts

# Логи
docker compose logs -f mcp-openfoodfacts
```

## Ссылки

- [Open Food Facts MCP](https://github.com/caleb-conner/open-food-facts-mcp)
- [mcp-proxy](https://github.com/sparfenyuk/mcp-proxy)
- [n8n MCP Client](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.mcpClient/)
