<script setup lang="ts">
// SEO
useSeoMeta({
  title: 'О нас',
  description: 'Яхты Сочи - ведущая компания по аренде яхт в Сочи. 5 лет опыта, более 1000 довольных клиентов.',
  ogTitle: 'О компании - Яхты Сочи',
  ogDescription: '5 лет на рынке аренды яхт. Профессиональные капитаны, современный флот.',
  ogImage: '/og-image.jpg',
  twitterCard: 'summary_large_image'
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://yachts-sochi.ru/about' }
  ]
})

// Team members
const team = [
  {
    name: 'Александр Морев',
    role: 'Директор',
    description: '15 лет опыта в яхтенной индустрии',
    avatar: '👨‍✈️'
  },
  {
    name: 'Елена Волнова',
    role: 'Менеджер по бронированию',
    description: 'Поможет подобрать идеальную яхту',
    avatar: '👩‍💼'
  },
  {
    name: 'Сергей Капитанов',
    role: 'Главный капитан',
    description: '20 лет морского стажа',
    avatar: '🧑‍✈️'
  }
]

// Statistics
const stats = [
  { value: '5+', label: 'Лет на рынке' },
  { value: '50+', label: 'Яхт в каталоге' },
  { value: '1000+', label: 'Довольных клиентов' },
  { value: '24/7', label: 'Поддержка' }
]

// Values
const values = [
  {
    icon: 'i-heroicons-shield-check',
    title: 'Безопасность',
    description: 'Все яхты проходят регулярное техническое обслуживание. Каждый капитан имеет лицензию и многолетний опыт.'
  },
  {
    icon: 'i-heroicons-heart',
    title: 'Забота о клиентах',
    description: 'Мы стремимся сделать каждую прогулку незабываемой. Индивидуальный подход к каждому клиенту.'
  },
  {
    icon: 'i-heroicons-sparkles',
    title: 'Качество сервиса',
    description: 'Современный флот, профессиональный экипаж, премиум обслуживание на борту.'
  },
  {
    icon: 'i-heroicons-currency-dollar',
    title: 'Честные цены',
    description: 'Прозрачное ценообразование без скрытых платежей. Лучшее соотношение цены и качества.'
  }
]

// Timeline
const timeline = [
  { year: '2019', title: 'Основание компании', description: 'Начали с 3 яхт и большой мечты' },
  { year: '2020', title: 'Расширение флота', description: 'Добавили 10 новых яхт и катеров' },
  { year: '2021', title: 'Онлайн бронирование', description: 'Запустили удобную систему бронирования' },
  { year: '2022', title: 'Групповые поездки', description: 'Открыли направление групповых прогулок' },
  { year: '2024', title: '50+ яхт', description: 'Крупнейший флот в Сочи' }
]
</script>

<template>
  <div class="py-8">
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white mb-16">
      <div class="absolute inset-0 opacity-10">
        <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="waves-about" patternUnits="userSpaceOnUse" width="100" height="20" patternTransform="rotate(-5)">
              <path d="M0 10 Q 25 0, 50 10 T 100 10" fill="none" stroke="currentColor" stroke-width="2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#waves-about)"/>
        </svg>
      </div>

      <UContainer class="relative py-16 md:py-24">
        <div class="max-w-3xl">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">
            О компании «Яхты Сочи»
          </h1>
          <p class="text-xl text-blue-100 mb-8">
            Мы делаем морские приключения доступными для каждого. Более 5 лет дарим незабываемые впечатления нашим клиентам.
          </p>
        </div>
      </UContainer>
    </section>

    <UContainer>
      <!-- Stats -->
      <section class="mb-16">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <UCard v-for="stat in stats" :key="stat.label" class="text-center">
            <div class="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {{ stat.value }}
            </div>
            <div class="text-gray-600 dark:text-gray-400">
              {{ stat.label }}
            </div>
          </UCard>
        </div>
      </section>

      <!-- Our Story -->
      <section class="mb-16">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Наша история
            </h2>
            <div class="prose dark:prose-invert">
              <p class="text-gray-600 dark:text-gray-400 text-lg mb-4">
                Компания «Яхты Сочи» была основана в 2019 году командой энтузиастов, влюбленных в море. Мы начинали с трех яхт и мечты сделать морские прогулки доступными для каждого.
              </p>
              <p class="text-gray-600 dark:text-gray-400 text-lg mb-4">
                Сегодня мы — крупнейшая компания по аренде яхт на черноморском побережье. В нашем флоте более 50 судов: от скоростных катеров до роскошных яхт и комфортабельных катамаранов.
              </p>
              <p class="text-gray-600 dark:text-gray-400 text-lg">
                Каждый день мы работаем над тем, чтобы ваш отдых был идеальным. Наша команда — это профессионалы своего дела, которые любят море так же сильно, как и вы.
              </p>
            </div>
          </div>

          <!-- Timeline -->
          <div class="space-y-4">
            <div
              v-for="(item, index) in timeline"
              :key="item.year"
              class="flex gap-4"
            >
              <div class="flex flex-col items-center">
                <div class="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {{ item.year }}
                </div>
                <div v-if="index < timeline.length - 1" class="w-0.5 h-full bg-gray-200 dark:bg-gray-700 my-2" />
              </div>
              <div class="pb-8">
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  {{ item.title }}
                </h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  {{ item.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Values -->
      <section class="mb-16">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Наши ценности
          </h2>
          <p class="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Принципы, которыми мы руководствуемся каждый день
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <UCard v-for="value in values" :key="value.title" class="text-center">
            <div class="w-14 h-14 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <UIcon :name="value.icon" class="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {{ value.title }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              {{ value.description }}
            </p>
          </UCard>
        </div>
      </section>

      <!-- Team -->
      <section class="mb-16">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Наша команда
          </h2>
          <p class="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Профессионалы, которые делают ваш отдых незабываемым
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <UCard v-for="member in team" :key="member.name" class="text-center">
            <div class="text-6xl mb-4">{{ member.avatar }}</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ member.name }}
            </h3>
            <p class="text-primary-600 dark:text-primary-400 font-medium mb-2">
              {{ member.role }}
            </p>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              {{ member.description }}
            </p>
          </UCard>
        </div>
      </section>

      <!-- CTA -->
      <section class="text-center bg-gradient-to-r from-primary-600 to-cyan-600 rounded-2xl p-12 text-white">
        <h2 class="text-3xl font-bold mb-4">
          Готовы к морскому приключению?
        </h2>
        <p class="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
          Выберите яхту и отправляйтесь в незабываемое путешествие!
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <UButton to="/boats" size="xl" color="white" class="font-semibold">
            Выбрать яхту
          </UButton>
          <UButton to="/contacts" size="xl" variant="outline" color="white">
            Связаться с нами
          </UButton>
        </div>
      </section>
    </UContainer>
  </div>
</template>
