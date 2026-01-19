# Исправление ошибки сборки с @nuxt/ui

## Проблема (РЕШЕНА ✅)

При сборке возникала ошибка:
```
RollupError: [plugin nuxt:import-protection] This module cannot be imported in the Vue part of your app. [importing `@nuxt/kit` from `node_modules/@nuxt/ui/dist/module.mjs`]
```

## Решение

Добавлена настройка в `nuxt.config.ts`:

```typescript
vite: {
  ssr: {
    noExternal: ['@nuxt/ui']
  }
}
```

Это заставляет Vite обрабатывать `@nuxt/ui` как внутренний модуль для SSR, что решает проблему с импортом `@nuxt/kit`.

## Текущий статус

- ✅ Dev режим работает
- ✅ Production build работает
- ✅ Проблема решена
