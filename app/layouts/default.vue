<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const colorMode = useColorMode()

// SEO defaults
useHead({
  titleTemplate: '%s | В Море!'
})

// Navigation items for header
const navItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Каталог',
    to: '/boats',
    active: route.path.startsWith('/boats')
  },
  {
    label: 'Групповые поездки',
    to: '/group-trips',
    active: route.path.startsWith('/group-trips')
  },
  {
    label: 'О нас',
    to: '/about',
    active: route.path === '/about'
  },
  {
    label: 'Контакты',
    to: '/contacts',
    active: route.path === '/contacts'
  }
])

// Footer navigation items
const footerNavItems: NavigationMenuItem[] = [
  { label: 'Каталог яхт', to: '/boats' },
  { label: 'Групповые поездки', to: '/group-trips' },
  { label: 'О компании', to: '/about' },
  { label: 'Контакты', to: '/contacts' }
]

// Bottom navigation items for mobile
const bottomNavItems = computed(() => [
  {
    label: 'Главная',
    to: '/',
    icon: 'i-heroicons-home',
    active: route.path === '/'
  },
  {
    label: 'Каталог',
    to: '/boats',
    icon: 'i-heroicons-rectangle-stack',
    active: route.path.startsWith('/boats')
  },
  {
    label: 'Поездки',
    to: '/group-trips',
    icon: 'i-heroicons-calendar',
    active: route.path.startsWith('/group-trips')
  },
  {
    label: 'Контакты',
    to: '/contacts',
    icon: 'i-heroicons-phone',
    active: route.path === '/contacts'
  }
])
</script>

<template>
  <div class="min-h-screen bg-default">
    <!-- Header -->
    <UHeader>
        <template #title>
          <NuxtLink to="/" class="flex items-center gap-3">
            <NuxtImg
              src="/logo.png"
              alt="В Море!"
              class="h-8 w-auto md:h-10"
              width="80"
              height="80"
              loading="eager"
              preload
            />
            <span class="font-bold text-xl md:text-2xl text-highlighted">
              В море на яхте?
            </span>
          </NuxtLink>
        </template>

        <UNavigationMenu :items="navItems" />

        <template #right>
          <ClientOnly>
            <UButton
              :icon="colorMode.value === 'dark' ? 'i-heroicons-sun' : 'i-heroicons-moon'"
              color="neutral"
              variant="ghost"
              :aria-label="colorMode.value === 'dark' ? 'Светлая тема' : 'Тёмная тема'"
              @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
            />
          </ClientOnly>
          <UButton
            href="tel:+79001234567"
            color="primary"
            icon="i-heroicons-phone"
            aria-label="Позвонить"
          >
            +7 (900) 123-45-67
          </UButton>
        </template>

        <template #body>
          <UNavigationMenu :items="navItems" orientation="vertical" class="-mx-2.5" />
        </template>
      </UHeader>

      <!-- Main Content -->
      <main class="pb-20 md:pb-0">
        <slot />
      </main>

      <!-- Bottom Navigation (Mobile Only) -->
      <div
        role="navigation"
        aria-label="Основная навигация"
        class="fixed bottom-0 left-0 right-0 z-50 border-t border-default bg-default md:hidden safe-area-pb"
      >
        <div class="grid grid-cols-4 h-16">
          <NuxtLink
            v-for="item in bottomNavItems"
            :key="item.to"
            :to="item.to"
            class="flex flex-col items-center justify-center gap-1 text-xs transition-colors"
            :class="item.active ? 'text-primary' : 'text-muted hover:text-highlighted'"
          >
            <UIcon :name="item.icon" class="w-5 h-5" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Footer -->
      <UFooter class="pb-20 md:pb-0">
        <template #left>
          <p class="text-muted text-sm">
            © {{ new Date().getFullYear() }} В Море!. Все права защищены.
          </p>
        </template>

        <UNavigationMenu :items="footerNavItems" variant="link" class="hidden md:flex" />

        <template #right>
          <UButton
            icon="i-heroicons-phone"
            color="neutral"
            variant="ghost"
            href="tel:+79001234567"
            aria-label="Позвонить"
          />
          <UButton
            icon="i-simple-icons:telegram"
            color="neutral"
            variant="ghost"
            href="https://t.me/v_more_ru"
            target="_blank"
            aria-label="Telegram"
          />
          <UButton
            icon="i-simple-icons:whatsapp"
            color="neutral"
            variant="ghost"
            href="https://wa.me/79001234567"
            target="_blank"
            aria-label="WhatsApp"
          />
        </template>
      </UFooter>
  </div>
</template>
