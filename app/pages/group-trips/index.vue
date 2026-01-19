<script setup lang="ts">
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import type { GroupTripService } from '~/components/GroupTripServiceCard'

const { fetchServices, services, isLoading, formatPrice, formatDuration, getServiceTypeLabel } = useGroupTripServices()
const { isTelegram, user: telegramUser } = useTelegram()
const toast = useNotificationToast()
const { validatePhone } = usePhoneValidation()

// Fetch services on mount
await fetchServices()

// Booking form state
const showBookingSlideover = ref(false)
const selectedService = ref<GroupTripService | null>(null)
const isSubmitting = ref(false)
const customerName = ref('')
const customerPhone = ref('')
const customerEmail = ref('')
const desiredDate = ref<CalendarDate | null>(null)
const phoneError = ref<string | null>(null)
const minDate = today(getLocalTimeZone())

const desiredDateLabel = computed(() => {
  if (!desiredDate.value) return 'Выберите желаемую дату'
  return desiredDate.value.toDate(getLocalTimeZone()).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

// Auto-fill from Telegram
onMounted(() => {
  if (isTelegram.value && telegramUser.value) {
    customerName.value = [telegramUser.value.first_name, telegramUser.value.last_name]
      .filter(Boolean)
      .join(' ')
  }
})

const openBookingSlideover = (service: GroupTripService) => {
  selectedService.value = service
  showBookingSlideover.value = true
}

const closeBookingSlideover = () => {
  showBookingSlideover.value = false
  selectedService.value = null
  desiredDate.value = null
  phoneError.value = null
}

const onPhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  customerPhone.value = target.value
  phoneError.value = null
}

const onPhoneBlur = () => {
  if (customerPhone.value) {
    const validation = validatePhone(customerPhone.value)
    customerPhone.value = validation.formatted
    
    if (!validation.isValid) {
      phoneError.value = validation.error || 'Некорректный формат телефона'
    } else {
      phoneError.value = null
    }
  }
}

const handlePurchase = async () => {
  if (!selectedService.value) return

  // Validate
  if (!customerName.value.trim() || !customerPhone.value.trim()) {
    toast.error('Ошибка', 'Заполните все обязательные поля')
    return
  }

  if (!desiredDate.value) {
    toast.error('Ошибка', 'Выберите желаемую дату поездки')
    return
  }

  const phoneValidation = validatePhone(customerPhone.value)
  if (!phoneValidation.isValid) {
    phoneError.value = phoneValidation.error || 'Некорректный формат телефона'
    toast.error('Ошибка', phoneValidation.error || 'Проверьте номер телефона')
    return
  }

  isSubmitting.value = true

  try {
    const response = await $fetch<{
      success: boolean
      data: any
      error?: string
    }>(`/api/group-trip-services/${selectedService.value.type}/tickets`, {
      method: 'POST',
      body: {
        customerName: customerName.value.trim(),
        customerPhone: phoneValidation.formatted,
        customerEmail: customerEmail.value.trim() || undefined,
        desiredDate: desiredDate.value.toDate(getLocalTimeZone()).toISOString(),
        telegramUserId: telegramUser.value?.id?.toString()
      }
    })

    if (response.success && response.data) {
      toast.success('Билет заказан!', 'Мы свяжемся с вами в ближайшее время для согласования времени поездки')
      closeBookingSlideover()
      await navigateTo(`/my-tickets/${response.data.id}`)
    } else {
      throw new Error(response.error || 'Не удалось заказать билет')
    }
  } catch (error: any) {
    toast.error('Ошибка', error?.data?.message || 'Не удалось заказать билет')
  } finally {
    isSubmitting.value = false
  }
}

// SEO
useSeoMeta({
  title: 'Групповые поездки',
  description: 'Групповые морские прогулки и рыбалка в Сочи. Билеты на одного человека.',
  robots: 'index, follow'
})
</script>

<template>
  <div class="py-8">
    <UContainer>
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Групповые поездки
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Выберите тип поездки. После покупки билета мы свяжемся с вами для согласования времени
        </p>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <USkeleton v-for="i in 3" :key="i" class="h-64 rounded-lg" />
      </div>

      <!-- Empty State -->
      <UCard v-else-if="services.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-calendar" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Нет доступных услуг
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          Групповые поездки появятся здесь
        </p>
      </UCard>

      <!-- Services Grid -->
      <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GroupTripServiceCard
          v-for="service in services"
          :key="service.id"
          :service="service"
          @purchase="openBookingSlideover"
        />
      </div>
    </UContainer>

    <!-- Booking Slideover -->
    <USlideover
      v-model:open="showBookingSlideover"
      side="bottom"
      :ui="{ container: 'max-w-lg max-h-[85vh]' }"
      title="Оформление билета"
      description="Заполните форму для покупки билета на групповую поездку."
    >
      <template #body>
        <div v-if="selectedService" class="space-y-4">
          <!-- Service Summary -->
          <UCard variant="subtle">
            <div class="flex gap-4">
              <div class="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                <NuxtImg
                  v-if="selectedService.image"
                  :src="selectedService.image"
                  :alt="selectedService.title"
                  class="w-full h-full object-cover"
                  format="webp"
                  quality="70"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900">
                  <span v-if="selectedService.type === 'FISHING'">🎣</span>
                  <span v-else>⛵</span>
                </div>
              </div>
              <div class="flex-1">
                <h4 class="font-semibold text-gray-900 dark:text-white">{{ selectedService.title }}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDuration(selectedService.duration) }}
                </p>
                <p class="text-primary-600 dark:text-primary-400 font-semibold">
                  {{ formatPrice(selectedService.price) }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Desired Date -->
          <div>
            <label for="desired-date" class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Желаемая дата поездки <span class="text-error-500">*</span>
            </label>
            <div class="flex justify-center">
              <UCalendar
                id="desired-date"
                v-model="desiredDate"
                :min-value="minDate"
                class="w-fit"
              />
            </div>
            <p v-if="desiredDate" class="text-sm text-primary-600 dark:text-primary-400 font-medium mt-2 text-center">
              Выбрано: {{ desiredDateLabel }}
            </p>
            <p v-else class="text-xs text-gray-500 mt-2 text-center">
              Выберите желаемую дату поездки
            </p>
          </div>

          <!-- Customer Name -->
          <div>
            <label for="customer-name" class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Ваше имя <span class="text-error-500">*</span>
            </label>
            <UInput
              id="customer-name"
              v-model="customerName"
              placeholder="Иван Иванов"
              required
              autocomplete="name"
              class="w-full"
            />
          </div>

          <!-- Customer Phone -->
          <div>
            <label for="customer-phone" class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Телефон <span class="text-error-500">*</span>
            </label>
            <UInput
              id="customer-phone"
              v-model="customerPhone"
              type="tel"
              placeholder="+7 (900) 123-45-67"
              required
              autocomplete="tel"
              :color="phoneError ? 'error' : 'primary'"
              @input="onPhoneInput"
              @blur="onPhoneBlur"
              class="w-full"
            />
            <p v-if="phoneError" class="text-xs text-error-500 mt-1">
              {{ phoneError }}
            </p>
            <p v-else class="text-xs text-gray-500 mt-1">
              Мы позвоним вам для согласования времени
            </p>
          </div>

          <!-- Customer Email -->
          <div>
            <label for="customer-email" class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Email
            </label>
            <UInput
              id="customer-email"
              v-model="customerEmail"
              type="email"
              placeholder="example@mail.ru"
              autocomplete="email"
              class="w-full"
            />
          </div>

          <UAlert
            color="info"
            variant="subtle"
            icon="i-heroicons-information-circle"
          >
            <template #description>
              После оформления заказа мы свяжемся с вами в течение 30 минут для согласования времени поездки. Менеджер предложит ближайшие доступные варианты.
            </template>
          </UAlert>
        </div>
      </template>

      <template #footer>
        <div class="flex gap-3">
          <UButton
            variant="outline"
            color="neutral"
            @click="closeBookingSlideover"
          >
            Отмена
          </UButton>
          <UButton
            color="primary"
            :loading="isSubmitting"
            :disabled="!customerName || !customerPhone || !desiredDate"
            @click="handlePurchase"
          >
            Заказать билет
          </UButton>
        </div>
      </template>
    </USlideover>
  </div>
</template>
