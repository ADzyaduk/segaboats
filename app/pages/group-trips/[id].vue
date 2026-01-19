<script setup lang="ts">
const route = useRoute()
const { fetchTrip, currentTrip, purchaseTicket, getTripTypeLabel, formatDuration, isLoading } = useGroupTrips()
const { isTelegram, user: telegramUser } = useTelegram()
const toast = useNotificationToast()
const { validatePhone } = usePhoneValidation()

const tripId = route.params.id as string
await fetchTrip(tripId)

const trip = computed(() => currentTrip.value)

// Booking form
const showBookingSlideover = ref(false)
const isSubmitting = ref(false)
const customerName = ref('')
const customerPhone = ref('')
const customerEmail = ref('')
const phoneError = ref<string | null>(null)

const onPhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  customerPhone.value = target.value
  phoneError.value = null
}

// Auto-fill from Telegram
onMounted(() => {
  if (isTelegram.value && telegramUser.value) {
    customerName.value = [telegramUser.value.first_name, telegramUser.value.last_name]
      .filter(Boolean)
      .join(' ')
  }
})

const openBookingSlideover = () => {
  showBookingSlideover.value = true
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
  if (!trip.value) return

  if (trip.value.status !== 'SCHEDULED' || trip.value.availableSeats <= 0) {
    toast.error('Ошибка', 'Поездка недоступна для покупки')
    return
  }

  // Validate
  if (!customerName.value.trim() || !customerPhone.value.trim()) {
    toast.error('Ошибка', 'Заполните все обязательные поля')
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
    const ticket = await purchaseTicket(tripId, {
      customerName: customerName.value.trim(),
      customerPhone: phoneValidation.formatted,
      customerEmail: customerEmail.value.trim() || undefined,
      telegramUserId: telegramUser.value?.id?.toString()
    })

    if (ticket) {
      toast.success('Билет заказан!', 'Мы свяжемся с вами для подтверждения')
      showBookingSlideover.value = false
      await navigateTo(`/my-tickets/${ticket.id}`)
    }
  } catch (error: any) {
    toast.error('Ошибка', error?.data?.message || 'Не удалось заказать билет')
  } finally {
    isSubmitting.value = false
  }
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatTime = (date: Date | string, time?: string) => {
  if (time) {
    return time
  }
  return new Date(date).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format price helper
const { formatPrice } = useGroupTrips()

// SEO
useSeoMeta({
  title: () => trip.value ? `${getTripTypeLabel(trip.value.type)} - Групповая поездка` : 'Групповая поездка',
  description: () => trip.value ? `Купить билет на групповую поездку: ${getTripTypeLabel(trip.value.type)}` : 'Групповая поездка'
})
</script>

<template>
  <div class="py-8">
    <UContainer class="max-w-4xl">
      <!-- Loading -->
      <div v-if="!trip && isLoading" class="space-y-6">
        <USkeleton class="h-8 w-1/3" />
        <USkeleton class="aspect-video w-full rounded-lg" />
      </div>

      <!-- Not Found -->
      <UCard v-else-if="!trip" class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 mx-auto text-warning-500 mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Поездка не найдена
        </h2>
        <UButton to="/group-trips" variant="outline">
          Вернуться к списку
        </UButton>
      </UCard>

      <!-- Trip Details -->
      <div v-else class="space-y-6">
        <!-- Header -->
        <div>
          <UBreadcrumb :items="[
            { label: 'Главная', to: '/' },
            { label: 'Групповые поездки', to: '/group-trips' },
            { label: getTripTypeLabel(trip.type) }
          ]" />
        </div>

        <!-- Image -->
        <div class="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            v-if="trip.boat?.thumbnail"
            :src="trip.boat.thumbnail"
            :alt="trip.boat.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-8xl bg-linear-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900">
            🛥️
          </div>
        </div>

        <!-- Content -->
        <div class="grid lg:grid-cols-3 gap-8">
          <!-- Main Info -->
          <div class="lg:col-span-2 space-y-6">
            <div>
              <UBadge color="primary" variant="subtle" class="mb-3">
                {{ getTripTypeLabel(trip.type) }}
              </UBadge>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Групповая поездка
              </h1>

              <div class="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400 mb-4">
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-clock" />
                  {{ formatDuration(trip.duration) }}
                </span>
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-calendar" />
                  {{ formatDate(trip.departureDate) }}
                </span>
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-clock" />
                  {{ formatTime(trip.departureDate, trip.departureTime) }}
                </span>
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-users" />
                  <span v-if="trip.availableSeats > 0" class="text-success-600 dark:text-success-400 font-medium">
                    {{ trip.availableSeats }} мест доступно
                  </span>
                  <span v-else class="text-error-600 dark:text-error-400 font-medium">
                    Мест нет
                  </span>
                </span>
              </div>

              <div v-if="trip.boat" class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
                  {{ trip.boat.name }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ trip.boat.location }}{{ trip.boat.pier ? `, ${trip.boat.pier}` : '' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Booking Card -->
          <div class="lg:col-span-1">
            <UCard class="sticky top-24">
              <template #header>
                <h2 class="text-lg font-semibold">Купить билет</h2>
              </template>

              <div class="space-y-4">
                <div class="text-center py-4">
                  <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                    {{ formatPrice(trip.price) }}
                  </div>
                  <div class="text-sm text-gray-500">за билет</div>
                </div>

                <hr class="my-4 border-gray-200 dark:border-gray-700" />

                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Продолжительность:</span>
                    <span class="font-medium">{{ formatDuration(trip.duration) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Дата:</span>
                    <span class="font-medium">{{ formatDate(trip.departureDate) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Время:</span>
                    <span class="font-medium">{{ formatTime(trip.departureDate, trip.departureTime) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Мест доступно:</span>
                    <span class="font-medium" :class="trip.availableSeats > 0 ? 'text-success-600' : 'text-error-600'">
                      {{ trip.availableSeats }}
                    </span>
                  </div>
                </div>

                <UButton
                  color="primary"
                  size="lg"
                  block
                  :disabled="trip.availableSeats <= 0 || trip.status !== 'SCHEDULED'"
                  @click="openBookingSlideover"
                >
                  <span v-if="trip.availableSeats > 0">Купить билет</span>
                  <span v-else>Мест нет</span>
                </UButton>

                <p class="text-xs text-center text-gray-500">
                  После покупки мы свяжемся с вами для подтверждения
                </p>
              </div>
            </UCard>
          </div>
        </div>
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
        <div class="space-y-4">
          <!-- Summary -->
          <UCard variant="subtle" v-if="trip">
            <div class="text-center">
              <h4 class="font-semibold mb-2">{{ getTripTypeLabel(trip.type) }}</h4>
              <p class="text-sm text-gray-500 mb-2">
                {{ formatDate(trip.departureDate) }} в {{ formatTime(trip.departureDate, trip.departureTime) }}
              </p>
              <p class="text-primary-600 font-semibold text-lg">
                {{ formatPrice(trip.price) }}
              </p>
            </div>
          </UCard>

          <!-- Customer Info -->
          <div>
            <label for="trip-customer-name" class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Ваше имя <span class="text-error-500">*</span>
            </label>
            <UInput
              id="trip-customer-name"
              v-model="customerName"
              placeholder="Иван Иванов"
              required
              autocomplete="name"
              class="w-full"
            />
          </div>

          <div>
            <label for="trip-customer-phone" class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Телефон <span class="text-error-500">*</span>
            </label>
            <UInput
              id="trip-customer-phone"
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
              Мы позвоним вам для подтверждения
            </p>
          </div>

          <div>
            <label for="trip-customer-email" class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Email
            </label>
            <UInput
              id="trip-customer-email"
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
              После оформления заказа мы свяжемся с вами для подтверждения в течение 30 минут.
            </template>
          </UAlert>
        </div>
      </template>

      <template #footer>
        <div class="flex gap-3">
          <UButton
            variant="outline"
            color="neutral"
            @click="showBookingSlideover = false"
          >
            Отмена
          </UButton>
          <UButton
            color="primary"
            :loading="isSubmitting"
            :disabled="!customerName || !customerPhone"
            @click="handlePurchase"
          >
            Заказать билет
          </UButton>
        </div>
      </template>
    </USlideover>
  </div>
</template>
