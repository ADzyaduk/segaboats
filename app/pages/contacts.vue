<script setup lang="ts">
// SEO
useSeoMeta({
  title: 'Контакты',
  description: 'Свяжитесь с нами для бронирования яхты в Сочи. Телефон, email, адрес офиса.',
  ogTitle: 'Контакты - Яхты Сочи',
  ogDescription: 'Телефон: +7 (900) 123-45-67. Работаем круглосуточно.',
  ogImage: '/og-image.jpg',
  twitterCard: 'summary_large_image'
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://yachts-sochi.ru/contacts' }
  ]
})

// Contact info
const contacts = [
  {
    icon: 'i-heroicons-phone',
    title: 'Телефон',
    value: '+7 (900) 123-45-67',
    link: 'tel:+79001234567',
    description: 'Звоните круглосуточно'
  },
  {
    icon: 'i-heroicons-device-phone-mobile',
    title: 'WhatsApp / Telegram',
    value: '+7 (900) 123-45-67',
    link: 'https://wa.me/79001234567',
    description: 'Быстрые ответы в мессенджерах'
  },
  {
    icon: 'i-heroicons-envelope',
    title: 'Email',
    value: 'info@yachts-sochi.ru',
    link: 'mailto:info@yachts-sochi.ru',
    description: 'Ответим в течение часа'
  },
  {
    icon: 'i-heroicons-map-pin',
    title: 'Адрес',
    value: 'Сочи, Морской порт',
    link: 'https://maps.google.com/?q=Сочи+Морской+порт',
    description: 'Причал №1-5'
  }
]

// Working hours
const workingHours = [
  { day: 'Понедельник - Пятница', hours: '09:00 - 21:00' },
  { day: 'Суббота - Воскресенье', hours: '08:00 - 22:00' },
  { day: 'Праздничные дни', hours: 'Работаем' }
]

// Form state
const form = reactive({
  name: '',
  phone: '',
  email: '',
  message: ''
})

const isSubmitting = ref(false)
const isSubmitted = ref(false)

const toast = useNotificationToast()

const submitForm = async () => {
  if (!form.name || !form.phone) {
    toast.error('Ошибка', 'Пожалуйста, заполните имя и телефон')
    return
  }

  isSubmitting.value = true
  
  // Simulate form submission
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  isSubmitting.value = false
  isSubmitted.value = true
  toast.success('Отправлено', 'Мы свяжемся с вами в ближайшее время')
  
  // Reset form
  form.name = ''
  form.phone = ''
  form.email = ''
  form.message = ''
}
</script>

<template>
  <div class="py-8">
    <UContainer>
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Контакты
        </h1>
        <p class="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          Свяжитесь с нами любым удобным способом. Мы всегда на связи!
        </p>
      </div>

      <div class="grid lg:grid-cols-2 gap-12">
        <!-- Contact Info -->
        <div class="space-y-8">
          <!-- Contact Cards -->
          <div class="grid sm:grid-cols-2 gap-4">
            <UCard
              v-for="contact in contacts"
              :key="contact.title"
              class="hover:shadow-lg transition-shadow"
            >
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center shrink-0">
                  <UIcon :name="contact.icon" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
                    {{ contact.title }}
                  </h3>
                  <a
                    :href="contact.link"
                    target="_blank"
                    class="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                  >
                    {{ contact.value }}
                  </a>
                  <p class="text-gray-500 text-sm mt-1">
                    {{ contact.description }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Working Hours -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-clock" class="w-5 h-5 text-primary-500" />
                <h3 class="font-semibold">Часы работы</h3>
              </div>
            </template>

            <div class="space-y-3">
              <div
                v-for="item in workingHours"
                :key="item.day"
                class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <span class="text-gray-600 dark:text-gray-400">{{ item.day }}</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ item.hours }}</span>
              </div>
            </div>
          </UCard>

          <!-- Map Placeholder -->
          <UCard class="overflow-hidden">
            <div class="aspect-video bg-linear-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center rounded-lg">
              <div class="text-center">
                <UIcon name="i-heroicons-map" class="w-16 h-16 text-primary-400 mb-4" />
                <p class="text-gray-600 dark:text-gray-400">
                  Сочи, Морской порт<br />
                  Причалы №1-5
                </p>
                <UButton
                  href="https://maps.google.com/?q=Сочи+Морской+порт"
                  target="_blank"
                  variant="outline"
                  class="mt-4"
                >
                  Открыть на карте
                </UButton>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Contact Form -->
        <div>
          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold">Напишите нам</h2>
              <p class="text-gray-500 text-sm mt-1">
                Оставьте заявку и мы перезвоним вам
              </p>
            </template>

            <form v-if="!isSubmitted" class="space-y-4" @submit.prevent="submitForm">
              <UFormField  label="Ваше имя" required>
                <UInput
                  v-model="form.name"
                  placeholder="Иван Иванов"
                  icon="i-heroicons-user"
                  size="lg"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Телефон" required>
                <UInput
                  v-model="form.phone"
                  placeholder="+7 (900) 000-00-00"
                  icon="i-heroicons-phone"
                  size="lg"
                  type="tel"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Email">
                <UInput
                  v-model="form.email"
                  placeholder="email@example.com"
                  icon="i-heroicons-envelope"
                  size="lg"
                  type="email"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Сообщение">
                <UTextarea
                  v-model="form.message"
                  placeholder="Расскажите, чем мы можем вам помочь..."
                  :rows="4"
                  size="lg"
                  class="w-full"
                />
              </UFormField>

              <UButton
                type="submit"
                color="primary"
                size="lg"
                block
                :loading="isSubmitting"
              >
                Отправить заявку
              </UButton>
            </form>

            <!-- Success State -->
            <div v-else class="text-center py-8">
              <div class="w-16 h-16 mx-auto mb-4 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                <UIcon name="i-heroicons-check" class="w-8 h-8 text-success-600" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Заявка отправлена!
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                Мы свяжемся с вами в ближайшее время
              </p>
              <UButton @click="isSubmitted = false" variant="outline">
                Отправить еще
              </UButton>
            </div>
          </UCard>
        </div>
      </div>
    </UContainer>
  </div>
</template>
