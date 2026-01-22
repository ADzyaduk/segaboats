<script setup lang="ts">
import BoatCard from '~/components/shared/BoatCard.vue'

const { formatPrice } = useBoats()
const { fetchServices, services, isLoading: isLoadingServices } = useGroupTripServices()

// Parse JSON fields for featured boats
const parseBoatData = (boats: any[]) => {
  return boats.map(boat => {
    let images = boat.images
    let features = boat.features
    
    // Safely parse images
    if (typeof boat.images === 'string') {
      try {
        images = JSON.parse(boat.images)
      } catch (e) {
        console.warn('Failed to parse boat images:', e)
        images = []
      }
    }
    
    // Safely parse features
    if (typeof boat.features === 'string') {
      try {
        features = JSON.parse(boat.features)
      } catch (e) {
        console.warn('Failed to parse boat features:', e)
        features = []
      }
    }
    
    return {
      ...boat,
      images,
      features
    }
  })
}

// SEO
useSeoMeta({
  title: 'Аренда яхт в Сочи',
  description: 'Арендуйте яхту в Сочи для незабываемых морских прогулок. Катера, яхты, катамараны с капитаном. Онлайн бронирование.',
  ogTitle: 'Яхты Сочи - Аренда яхт и катеров',
  ogDescription: 'Более 50 яхт в каталоге. Онлайн бронирование, опытные капитаны, лучшие цены.',
  ogImage: '/og-image.jpg',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  keywords: 'аренда яхт сочи, катера сочи, морские прогулки, рыбалка сочи, аренда катамарана'
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://yachts-sochi.ru' }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Яхты Сочи',
        description: 'Аренда яхт и катеров в Сочи',
        url: 'https://yachts-sochi.ru',
        telephone: '+7 (900) 123-45-67',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Сочи',
          addressCountry: 'RU'
        }
      })
    }
  ]
})

// Featured boats
const { data: boatsData, error: boatsError } = await useFetch('/api/boats?limit=3')
const featuredBoats = computed(() => {
  if (boatsError.value || !boatsData.value?.data) {
    return []
  }
  const boats = boatsData.value.data
  return parseBoatData(boats)
})

// Fetch group trip services
try {
  await fetchServices()
} catch (e) {
  // Error is handled in composable, just log for debugging
  console.warn('Failed to fetch group trip services:', e)
}

// Features list
const features = [
  {
    icon: 'i-heroicons-shield-check',
    title: 'Безопасность',
    description: 'Все яхты проходят техосмотр. Опытные капитаны с лицензией.'
  },
  {
    icon: 'i-heroicons-clock',
    title: 'Гибкое время',
    description: 'Аренда от 1 часа. Индивидуальный график под ваши планы.'
  },
  {
    icon: 'i-heroicons-credit-card',
    title: 'Удобная оплата',
    description: 'Онлайн бронирование. Оплата картой или наличными.'
  },
  {
    icon: 'i-heroicons-star',
    title: 'Премиум сервис',
    description: 'Напитки, закуски, музыка. Всё для вашего комфорта.'
  }
]

// Stats
const stats = [
  { value: '50+', label: 'Яхт в каталоге' },
  { value: '1000+', label: 'Довольных клиентов' },
  { value: '5 лет', label: 'На рынке' },
  { value: '24/7', label: 'Поддержка' }
]
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section 
      class="relative overflow-hidden min-h-[500px] sm:min-h-[600px] md:min-h-[700px] flex items-center hero-bg" 
      aria-label="Главная секция"
    >
      <!-- Overlay -->
      <div class="absolute inset-0 bg-linear-to-b from-black/75 via-black/70 to-black/65 dark:from-black/40 dark:via-black/40 dark:to-black/40 z-10"></div>

      <UContainer class="relative z-30 py-20 md:py-32">
        <div class="max-w-3xl mx-auto text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-6 text-white animate-slide-up" style="text-shadow: 0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.9);">
            Аренда яхт в Сочи
          </h1>
          <p class="text-xl md:text-2xl text-white mb-8 animate-slide-up" style="animation-delay: 0.1s; text-shadow: 0 3px 8px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9);">
            Незабываемые морские прогулки, романтические свидания, праздники и корпоративы на воде
          </p>
          <div class="flex flex-wrap justify-center gap-4 animate-slide-up" style="animation-delay: 0.2s">
            <UButton 
              to="/boats" 
              size="xl" 
              color="primary"
              class="font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
              aria-label="Перейти к каталогу яхт"
            >
              Выбрать яхту
            </UButton>
            <UButton 
              href="tel:+79001234567"
              size="xl" 
              variant="outline"
              color="neutral"
              icon="i-heroicons-phone"
              class="font-semibold border-2 border-white bg-white/10 text-white! hover:bg-white/20 hover:scale-105 transition-all duration-300"
              aria-label="Позвонить нам"
            >
              Позвоните нам
            </UButton>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-16 pt-8 border-t border-white/40">
          <div v-for="stat in stats" :key="stat.label" class="text-center">
            <div class="text-2xl md:text-3xl lg:text-4xl font-bold text-white" style="text-shadow: 0 3px 10px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9);">{{ stat.value }}</div>
            <div class="text-white text-xs md:text-sm mt-1" style="text-shadow: 0 2px 6px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9);">{{ stat.label }}</div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Features -->
    <section class="py-16 md:py-20 lg:py-28 bg-gray-50 dark:bg-gray-900">
      <UContainer>
        <div class="text-center mb-14">
          <span class="inline-block text-primary-600 dark:text-primary-400 text-sm font-semibold uppercase tracking-wider mb-3">Преимущества</span>
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Почему выбирают нас
          </h2>
          <p class="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Мы предлагаем лучший сервис для вашего комфорта и безопасности
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <UCard v-for="feature in features" :key="feature.title" class="text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 md:p-8">
            <div class="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 md:mb-5 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
              <UIcon :name="feature.icon" class="w-7 h-7 md:w-8 md:h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 class="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3">
              {{ feature.title }}
            </h3>
            <p class="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              {{ feature.description }}
            </p>
          </UCard>
        </div>
      </UContainer>
    </section>

    <!-- Featured Boats -->
    <section class="py-16 md:py-20 lg:py-28">
      <UContainer>
        <div class="text-center mb-14">
          <span class="inline-block text-primary-600 dark:text-primary-400 text-sm font-semibold uppercase tracking-wider mb-3">Каталог</span>
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Популярные яхты
          </h2>
          <p class="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Лучшие предложения для морских прогулок в Сочи
          </p>
        </div>

        <!-- Empty State for Boats -->
        <div v-if="featuredBoats.length === 0" class="text-center mb-10">
          <UCard class="py-12">
            <UIcon name="i-heroicons-boat" class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Яхты не найдены
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Попробуйте позже
            </p>
          </UCard>
        </div>

        <!-- Boats Grid -->
        <div v-else class="grid md:grid-cols-3 gap-6">
          <BoatCard
            v-for="boat in featuredBoats"
            :key="boat.id"
            :boat="boat"
          />
        </div>

        <div v-if="featuredBoats.length > 0" class="text-center mt-10">
          <UButton 
            to="/boats" 
            size="lg" 
            color="primary"
            class="hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
          >
            Смотреть все яхты
          </UButton>
        </div>
      </UContainer>
    </section>

    <!-- How it works -->
    <section id="how-it-works" class="py-16 md:py-20 lg:py-28 bg-gray-50 dark:bg-gray-900">
      <UContainer>
        <div class="text-center mb-14">
          <span class="inline-block text-primary-600 dark:text-primary-400 text-sm font-semibold uppercase tracking-wider mb-3">Просто и быстро</span>
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Как забронировать
          </h2>
          <p class="text-gray-600 dark:text-gray-400 text-lg max-w-xl mx-auto">
            Всего 3 простых шага до вашей морской прогулки
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8 md:gap-12">
          <div class="text-center">
            <div class="w-16 h-16 md:w-20 md:h-20 mx-auto mb-5 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-bold shadow-lg" aria-label="Шаг 1">
              1
            </div>
            <h3 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Выберите яхту
            </h3>
            <p class="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              Изучите каталог и выберите яхту по параметрам и бюджету
            </p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 md:w-20 md:h-20 mx-auto mb-5 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-bold shadow-lg" aria-label="Шаг 2">
              2
            </div>
            <h3 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Забронируйте
            </h3>
            <p class="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              Укажите дату, время и количество гостей
            </p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 md:w-20 md:h-20 mx-auto mb-5 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-bold shadow-lg" aria-label="Шаг 3">
              3
            </div>
            <h3 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Наслаждайтесь
            </h3>
            <p class="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              Приходите на причал и отправляйтесь в море!
            </p>
          </div>
        </div>

        <div class="text-center mt-12">
          <UButton 
            to="/boats" 
            size="xl" 
            color="primary"
            class="hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
          >
            Начать бронирование
          </UButton>
        </div>
      </UContainer>
    </section>

    <!-- Group Trips -->
    <section class="py-16 md:py-20 lg:py-28">
      <UContainer>
        <div class="text-center mb-14">
          <span class="inline-block text-primary-600 dark:text-primary-400 text-sm font-semibold uppercase tracking-wider mb-3">Вместе веселее</span>
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Групповые поездки
          </h2>
          <p class="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Присоединяйтесь к групповым прогулкам и рыбалке. Билеты на одного человека
          </p>
        </div>

        <!-- Loading -->
        <div v-if="isLoadingServices" class="grid md:grid-cols-3 gap-6 mb-10">
          <USkeleton v-for="i in 3" :key="i" class="h-64 rounded-lg" />
        </div>

        <!-- Services Grid -->
        <div v-else-if="services.length > 0" class="grid md:grid-cols-3 gap-6 mb-10">
          <GroupTripServiceCard
            v-for="service in services.slice(0, 3)"
            :key="service.id"
            :service="service"
            @purchase="() => navigateTo('/group-trips')"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="text-center mb-10">
          <UCard class="py-12">
            <UIcon name="i-heroicons-calendar" class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Нет доступных услуг
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Групповые поездки появятся здесь
            </p>
          </UCard>
        </div>
      </UContainer>
    </section>

    <!-- CTA -->
    <section class="relative overflow-hidden py-20 md:py-32 hero-bg">
      <!-- Overlay -->
      <div class="absolute inset-0 bg-linear-to-b from-black/75 via-black/70 to-black/65 dark:from-black/40 dark:via-black/40 dark:to-black/40 z-10"></div>

      <UContainer class="relative z-20 text-center">
        <h2 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white" style="text-shadow: 0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.9);">
          Готовы к морскому приключению?
        </h2>
        <p class="text-lg sm:text-xl md:text-2xl text-white mb-8 md:mb-10 max-w-2xl mx-auto px-4" style="text-shadow: 0 3px 8px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9);">
          Забронируйте яхту прямо сейчас и получите скидку 10% на первую прогулку
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <UButton 
            to="/boats" 
            size="xl" 
            color="primary"
            class="font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
            aria-label="Забронировать яхту"
          >
            Забронировать яхту
          </UButton>
          <UButton 
            href="tel:+79001234567"
            size="xl" 
            variant="outline" 
            color="neutral"
            icon="i-heroicons-phone"
            class="font-semibold border-2 border-white bg-white/10 text-white! hover:bg-white/20 hover:scale-105 transition-all duration-300"
            aria-label="Позвонить нам"
          >
            Позвоните нам
          </UButton>
        </div>
      </UContainer>
    </section>
  </div>
</template>

<style scoped>
.hero-bg {
  background-image: url('/img/hero.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

@media (max-width: 768px) {
  .hero-bg {
    background-attachment: scroll;
  }
}
</style>
