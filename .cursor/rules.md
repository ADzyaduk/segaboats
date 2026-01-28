# Cursor Rules — Nuxt 4.3.0 + Nuxt UI 4.4.0

These rules are **authoritative** for all code generation, refactors, and suggestions in this repository.

They are derived directly from the project Best Practices and must be followed strictly.

---

## Tech Stack (Do Not Deviate)

- Nuxt **4.3.0**
- Vue **3** — Composition API only
- TypeScript — strict mode
- Pinia — state management
- Nuxt UI **4.4.0** — default UI system

If Nuxt or Nuxt UI provides a solution, **it must be used**.

---

## Project Structure Rules

- Use the **Nuxt 4 app-first structure**
- Prefer `app/` over root-level directories

Allowed directories:

- `app/components`
- `app/composables`
- `app/layouts`
- `app/middleware`
- `app/pages`
- `app/plugins`
- `app/utils`
- `server/api`
- `server/middleware`
- `server/utils`

Do NOT invent alternative folder structures.

---

## File Naming Rules (Strict)

- Components: `PascalCase.vue`
- Composables: `usePascalCase.ts`
- Pages, layouts, middleware, plugins, stores: `kebab-case`

Never mix naming conventions.

---

## Component Rules

- Use `<script setup lang="ts">` only
- Do NOT use Options API
- Do NOT use mixins
- Organize logic via composables

---

## UI Rules (Nuxt UI — Mandatory)

Nuxt UI is the **only allowed UI layer**.

### Required

- Prefer Nuxt UI components over raw HTML
- Use slot-based APIs instead of boolean or layout props
- Rely on Nuxt UI for accessibility, keyboard navigation, and focus handling

### Preferred Components

- `UHeader`
- `UFooter`
- `UNavigationMenu`
- `UButton`
- `UCard`
- `UModal`
- `USlideover`
- `UInput`, `USelect`, `UTextarea`

### Forbidden

- `<button>`, `<input>`, `<nav>` when Nuxt UI provides an equivalent
- Re-implementing accessibility logic already handled by Nuxt UI
- Wrapping Nuxt UI components without reason

---

## Layout Rules

- Global layout lives in `app/layouts/default.vue`
- Layout structure must be:
  1. `UHeader`
  2. `<slot />`
  3. `UFooter`

Do NOT implement custom headers or footers if Nuxt UI provides them.

---

## Data Fetching Rules (SSR-Safe Only)

- Use `useFetch` or `useAsyncData` exclusively
- Do NOT fetch data in lifecycle hooks (`onMounted`, etc.)
- Handle errors explicitly using `createError`

---

## State Management (Pinia)

- One store per domain
- No direct state mutation outside actions
- No async logic inside getters
- Stores must be fully typed

---

## Routing & Middleware

- Use Nuxt route middleware for auth and guards
- Prefer synchronous middleware
- Avoid side effects in middleware

---

## Performance Rules

- Use `<NuxtLink>` for internal navigation
- Lazy-load components via `Lazy*` prefix
- Use `routeRules` for rendering strategy
- Always use `<NuxtImg>` for images

---

## Styling Rules

- Use Nuxt UI theming via `app.config.ts`
- Avoid inline styles and custom CSS
- Do not override Nuxt UI accessibility styles

---

## Security Rules (Server First)

- All server logic lives in `server/api`
- Always validate input on the server (Zod preferred)
- Never trust client-side validation
- Use secure cookies (`httpOnly`, `secure`, `sameSite`)

---

## Forbidden Patterns (Never Generate)

- Options API
- Mixins
- Manual DOM manipulation
- Fetching data outside Nuxt composables
- Raw HTML UI when Nuxt UI exists
- Skipping server-side validation

---

## Final Rule

If uncertain:
1. Check Nuxt 4 documentation
2. Check Nuxt UI 4 documentation
3. Only then consider custom implementation

If a built-in solution exists — **use it**.
