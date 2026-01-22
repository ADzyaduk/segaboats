<script setup lang="ts">
const route = useRoute()
const colorMode = useColorMode()

// SEO defaults
useHead({
  titleTemplate: '%s | В Море!'
})

// Navigation items for bottom nav
const navItems = [
  { to: '/', icon: 'i-heroicons-home', label: 'Главная' },
  { to: '/boats', icon: 'i-heroicons-lifebuoy', label: 'Каталог' },
  { to: '/group-trips', icon: 'i-heroicons-user-group', label: 'Поездки' },
  { to: '/contacts', icon: 'i-heroicons-phone', label: 'Контакты' }
]
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
      <!-- Header -->
      <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <UContainer>
          <div class="flex items-center justify-between h-16">
            <!-- Logo -->
            <NuxtLink to="/" class="flex items-center gap-3">
              <NuxtImg
                src="/log.png"
                alt="В Море!"
                class="h-12 w-auto md:h-14"
                width="56"
                height="56"
                loading="eager"
                preload
              />
              <span class="font-bold text-xl md:text-2xl text-gray-900 dark:text-white">
                В Море!
              </span>
            </NuxtLink>

            <!-- Navigation -->
            <nav class="hidden md:flex items-center gap-6">
              <NuxtLink 
                to="/boats" 
                class="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors font-medium"
              >
                Каталог
              </NuxtLink>
              <NuxtLink 
                to="/group-trips" 
                class="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors font-medium"
              >
                Групповые поездки
              </NuxtLink>
              <NuxtLink 
                to="/about" 
                class="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors font-medium"
              >
                О нас
              </NuxtLink>
              <NuxtLink 
                to="/contacts" 
                class="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors font-medium"
              >
                Контакты
              </NuxtLink>
            </nav>


            <!-- Actions -->
            <div class="hidden md:flex items-center gap-3">
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
                class="hover:scale-[1.02] transition-all duration-200"
                aria-label="Позвонить"
              >
                +7 (900) 123-45-67
              </UButton>
            </div>
          </div>
        </UContainer>
      </header>


      <!-- Main Content -->
      <main class="pb-20 md:pb-0">
        <slot />
      </main>

      <!-- Mobile Bottom Navigation -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 safe-area-pb">
        <div class="flex items-center justify-around h-16">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors duration-200"
            :class="route.path === item.to || (item.to !== '/' && route.path.startsWith(item.to))
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-primary-500'"
          >
            <UIcon :name="item.icon" class="w-6 h-6" />
            <span class="text-xs font-medium">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </nav>

      <!-- Footer -->
      <footer class="bg-gray-900 text-gray-300 py-12 mt-20">
        <UContainer>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Brand -->
            <div>
              <div class="flex items-center gap-3 mb-4">
                <NuxtImg
                  src="/log.png"
                  alt="В Море!"
                  class="h-16 w-auto"
                  width="64"
                  height="64"
                  loading="lazy"
                />
                <span class="font-bold text-2xl text-white">В Море!</span>
              </div>
              <p class="text-gray-400">
                Аренда яхт и катеров в Сочи. Незабываемые морские прогулки, рыбалка и праздники на воде.
              </p>
            </div>

            <!-- Links -->
            <div>
              <h2 class="font-semibold text-white mb-4 text-lg">Навигация</h2>
              <ul class="space-y-2">
                <li>
                  <NuxtLink to="/boats" class="hover:text-white transition-colors">
                    Каталог яхт
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/group-trips" class="hover:text-white transition-colors">
                    Групповые поездки
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/about" class="hover:text-white transition-colors">
                    О компании
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/contacts" class="hover:text-white transition-colors">
                    Контакты
                  </NuxtLink>
                </li>
              </ul>
            </div>

            <!-- Contact -->
            <div>
              <h2 class="font-semibold text-white mb-4 text-lg">Контакты</h2>
              <ul class="space-y-2">
                <li class="flex items-center gap-2">
                  <UIcon name="i-heroicons-phone" />
                  <a href="tel:+79001234567" class="hover:text-white transition-colors">
                    +7 (900) 123-45-67
                  </a>
                </li>
                <li class="flex items-center gap-2">
                  <UIcon name="i-heroicons-envelope" />
                  <a href="mailto:info@yachts-sochi.ru" class="hover:text-white transition-colors">
                    info@yachts-sochi.ru
                  </a>
                </li>
                <li class="flex items-center gap-2">
                  <UIcon name="i-heroicons-map-pin" />
                  <span>Сочи, Морской порт</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>© {{ new Date().getFullYear() }} Яхты Сочи. Все права защищены.</p>
          </div>
        </UContainer>
      </footer>
    </div>
  </UApp>
</template>

<style scoped>
/* Safe area padding for iOS devices */
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
