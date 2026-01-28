<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

// SEO
useSeoMeta({
  title: 'О нас',
  description: 'В Море! - ведущая компания по аренде яхт в Сочи. 5 лет опыта, более 1000 довольных клиентов.',
  ogTitle: 'О компании - В Море!',
  ogDescription: '5 лет на рынке аренды яхт. Профессиональные капитаны, современный флот.',
  ogImage: '/og-image.jpg',
  twitterCard: 'summary_large_image'
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://yachts-sochi.ru/about' }
  ]
})

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

// CTA links
const ctaLinks: ButtonProps[] = [
  {
    label: 'Выбрать яхту',
    to: '/boats',
    color: 'primary',
    size: 'xl'
  },
  {
    label: 'Связаться с нами',
    to: '/contacts',
    variant: 'outline',
    color: 'neutral',
    size: 'xl'
  }
]
</script>

<template>
  <div class="py-8">
    <!-- Hero Section -->
    <UPageHero
      title="О компании «В Море!»"
      description="Мы делаем морские приключения доступными для каждого. Более 5 лет дарим незабываемые впечатления нашим клиентам."
      orientation="horizontal"
      class="mb-16"
    >
      <NuxtImg
        src="/img/hero.jpg"
        alt="О компании В Море!"
        class="rounded-lg shadow-2xl ring ring-default w-full"
        width="640"
        height="480"
        loading="eager"
      />
    </UPageHero>

    <UContainer>
      <!-- Stats -->
      <section class="mb-16">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <UCard v-for="stat in stats" :key="stat.label" class="text-center">
            <div class="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
              {{ stat.value }}
            </div>
            <div class="text-muted">
              {{ stat.label }}
            </div>
          </UCard>
        </div>
      </section>

      <!-- Our Story -->
      <section class="mb-16">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 class="text-3xl font-bold text-highlighted mb-6">
              Наша история
            </h2>
            <div class="prose">
              <p class="text-muted text-lg mb-4">
                Компания «В Море!» была основана в 2019 году командой энтузиастов, влюбленных в море. Мы начинали с трех яхт и мечты сделать морские прогулки доступными для каждого.
              </p>
              <p class="text-muted text-lg mb-4">
                Сегодня мы — крупнейшая компания по аренде яхт на черноморском побережье. В нашем флоте более 50 судов: от скоростных катеров до роскошных яхт и комфортабельных катамаранов.
              </p>
              <p class="text-muted text-lg">
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
                <div class="w-12 h-12 bg-primary-600 text-inverted rounded-full flex items-center justify-center font-bold text-sm">
                  {{ item.year }}
                </div>
                <div v-if="index < timeline.length - 1" class="w-0.5 h-full bg-default my-2" />
              </div>
              <div class="pb-8">
                <h3 class="font-semibold text-highlighted">
                  {{ item.title }}
                </h3>
                <p class="text-muted text-sm">
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
          <h2 class="text-3xl font-bold text-highlighted mb-4">
            Наши ценности
          </h2>
          <p class="text-muted text-lg max-w-2xl mx-auto">
            Принципы, которыми мы руководствуемся каждый день
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <UCard v-for="value in values" :key="value.title" class="text-center">
            <div class="w-14 h-14 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
              <UIcon :name="value.icon" class="w-7 h-7 text-primary-600" />
            </div>
            <h3 class="text-lg font-semibold text-highlighted mb-2">
              {{ value.title }}
            </h3>
            <p class="text-muted text-sm">
              {{ value.description }}
            </p>
          </UCard>
        </div>
      </section>

      <!-- CTA -->
      <UPageCTA
        title="Готовы к морскому приключению?"
        description="Выберите яхту и отправляйтесь в незабываемое путешествие!"
        :links="ctaLinks"
        variant="outline"
        orientation="horizontal"
      >
        <NuxtImg
          src="/img/hero.jpg"
          alt="Морское приключение"
          class="w-full rounded-lg"
          width="640"
          height="480"
          loading="lazy"
        />
      </UPageCTA>
    </UContainer>
  </div>
</template>
