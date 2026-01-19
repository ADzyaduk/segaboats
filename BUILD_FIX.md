# Исправление ошибки сборки с @nuxt/ui

## Проблема

При сборке возникает ошибка:
```
RollupError: [plugin nuxt:import-protection] This module cannot be imported in the Vue part of your app. [importing `@nuxt/kit` from `node_modules/@nuxt/ui/dist/module.mjs`]
```

Это известная проблема совместимости `@nuxt/ui` v4.3.0 с Nuxt 4.

## Временное решение

Пока проблема не исправлена в `@nuxt/ui`, можно использовать один из вариантов:

### Вариант 1: Использовать dev режим для тестирования

```bash
npm run dev
```

### Вариант 2: Обновить @nuxt/ui когда выйдет патч

Следите за обновлениями:
- https://github.com/nuxt/ui/issues
- https://ui.nuxt.com

### Вариант 3: Использовать альтернативную UI библиотеку

Временно можно заменить `@nuxt/ui` на другую библиотеку, если критично нужна сборка.

## Текущий статус

- ✅ Dev режим работает
- ❌ Production build не работает из-за известного бага в @nuxt/ui
- ⏳ Ожидаем исправления от команды Nuxt UI
