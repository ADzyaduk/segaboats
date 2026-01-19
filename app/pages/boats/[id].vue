<script setup lang="ts">
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'

const route = useRoute()
const boatsStore = useBoatsStore()
const bookingsStore = useBookingsStore()
const { formatPrice, getTypeLabel, getFeatureIcon } = useBoats()
const { isTelegram, user: telegramUser, showMainButton, hideMainButton, haptic } = useTelegram()
const toast = useNotificationToast()

// Fetch boat data
const boatId = route.params.id as string
await boatsStore.fetchBoat(boatId)

const boat = computed(() => boatsStore.currentBoat)

// SEO
useSeoMeta({
  title: () => boat.value?.name || 'Яхта',
  description: () => boat.value?.description || 'Арендуйте яхту в Сочи',
  ogTitle: () => `${boat.value?.name} - Аренда яхты в Сочи`,
  ogDescription: () => boat.value?.description || 'Аренда яхты в Сочи',
  ogImage: () => boat.value?.thumbnail || '/og-image.jpg',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  link: [
    { 
      rel: 'canonical', 
      href: () => `https://yachts-sochi.ru/boats/${boat.value?.id}` 
    }
  ]
})

// Booking form state
const bookingDate = ref<CalendarDate | null>(null)
const bookingTime = ref('10:00')
const bookingHours = ref(1)
const bookingPassengers = ref(2)
const customerName = ref('')
const customerPhone = ref('')
const customerEmail = ref('')
const customerNotes = ref('')
const showBookingSlideover = ref(false)
const isSubmitting = ref(false)
const bookingFormRef = ref<InstanceType<typeof BookingForm> | null>(null)
const minBookingDate = today(getLocalTimeZone())

const bookingDateLabel = computed(() => {
  if (!bookingDate.value) return 'Выберите дату'
  return bookingDate.value.toDate(getLocalTimeZone()).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

// Set default hours to 1
watch(boat, (b) => {
  if (b && bookingHours.value < 1) {
    bookingHours.value = 1
  }
})

// Calculate total price
const totalPrice = computed(() => {
  if (!boat.value) return 0
  return boat.value.pricePerHour * bookingHours.value
})

// Check if selected time slot is available
const isTimeSlotAvailable = computed(() => {
  if (!boat.value?.bookedDates || !bookingDate.value || !bookingTime.value) return true
  
  const [hours, minutes] = bookingTime.value.split(':').map(Number)
  const dateObj = bookingDate.value.toDate(getLocalTimeZone())
  const startDate = new Date(dateObj)
  startDate.setHours(hours, minutes, 0, 0)
  const endDate = new Date(startDate.getTime() + bookingHours.value * 60 * 60 * 1000)
  
  return !boat.value.bookedDates.some(booking => {
    const bookingStart = new Date(booking.start)
    const bookingEnd = new Date(booking.end)
    
    // Check if there's any overlap
    return (startDate < bookingEnd && endDate > bookingStart)
  })
})

// Time options
const timeOptions = computed(() => {
  const options = []
  for (let h = 6; h <= 20; h++) {
    options.push({ label: `${h}:00`, value: `${h}:00` })
    options.push({ label: `${h}:30`, value: `${h}:30` })
  }
  return options
})

// Hours options
const hoursOptions = computed(() => {
  const options = []
  for (let h = 1; h <= 12; h++) {
    options.push({ label: `${h} час${h === 1 ? '' : h < 5 ? 'а' : 'ов'}`, value: h })
  }
  return options
})

// Open booking slideover
const openBookingSlideover = () => {
  if (!bookingDate.value) {
    toast.error('Ошибка', 'Выберите дату бронирования')
    return
  }
  if (isTelegram.value && telegramUser.value) {
    // Auto-fill name from Telegram
    customerName.value = [telegramUser.value.first_name, telegramUser.value.last_name]
      .filter(Boolean)
      .join(' ')
    // Auto-fill email if username exists (common pattern)
    if (telegramUser.value.username && !customerEmail.value) {
      customerEmail.value = `${telegramUser.value.username}@telegram.local`
    }
  }
  showBookingSlideover.value = true
}

// Handle booking form submit
const handleBookingSubmit = async (formData: {
  customerName: string
  customerPhone: string
  customerEmail?: string
  customerNotes?: string
}) => {
  if (!boat.value || !bookingDate.value) return

  isSubmitting.value = true

  try {
    // Create datetime string
    const [hours, minutes] = bookingTime.value.split(':').map(Number)
    const dateObj = bookingDate.value.toDate(getLocalTimeZone())
    const startDate = new Date(dateObj)
    startDate.setHours(hours, minutes, 0, 0)

    // Update draft and create booking
    bookingsStore.updateDraft({
      boatId: boat.value.id,
      startDate: startDate.toISOString(),
      hours: bookingHours.value,
      passengers: bookingPassengers.value,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail,
      customerNotes: formData.customerNotes,
      telegramUserId: telegramUser.value?.id
    })

    const booking = await bookingsStore.createBooking()

    if (booking) {
      haptic.notification('success')
      toast.success('Бронирование создано!', 'Мы свяжемся с вами для подтверждения')
      showBookingSlideover.value = false
      
      // Navigate to success page
      await navigateTo(`/booking/${booking.id}`)
    }
  } catch (error: any) {
    haptic.notification('error')
    const errorMessage = error?.data?.message || error?.message || 'Ошибка создания бронирования'
    toast.error('Ошибка', errorMessage)
    console.error('Booking error:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Gallery
const selectedImageIndex = ref(0)
const allImages = computed(() => {
  if (!boat.value) return []
  const images = Array.isArray(boat.value.images) ? boat.value.images : []
  return boat.value.thumbnail 
    ? [boat.value.thumbnail, ...images]
    : images
})

// Reset gallery when boat changes
watch(() => boat.value?.id, () => {
  selectedImageIndex.value = 0
})

// Telegram main button
onMounted(() => {
  if (isTelegram.value) {
    showMainButton('Забронировать', openBookingSlideover)
  }
})

onBeforeUnmount(() => {
  if (isTelegram.value) {
    hideMainButton()
  }
})

onUnmounted(() => {
  boatsStore.clearCurrentBoat()
})
</script>

<template>
  <div class="py-8">
    <UContainer>
      <!-- Loading -->
      <div v-if="boatsStore.isLoading" class="space-y-6 animate-fade-in">
        <USkeleton class="h-8 w-1/3" />
        <USkeleton class="aspect-video w-full rounded-lg skeleton-shimmer" />
        <div class="grid md:grid-cols-3 gap-6">
          <div class="md:col-span-2 space-y-4">
            <USkeleton class="h-6 w-full" />
            <USkeleton class="h-6 w-3/4" />
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-5/6" />
          </div>
          <USkeleton class="h-64 rounded-lg" />
        </div>
      </div>

      <!-- Not Found -->
      <UCard v-else-if="!boat" class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 mx-auto text-warning-500 mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Яхта не найдена
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Возможно, она была удалена или временно недоступна
        </p>
        <UButton to="/boats" variant="outline">
          Вернуться к каталогу
        </UButton>
      </UCard>

      <!-- Boat Details -->
      <div v-else>
        <!-- Breadcrumbs -->
        <div class="mb-6">
          <UBreadcrumb :items="[
            { label: 'Главная', to: '/' },
            { label: 'Каталог', to: '/boats' },
            { label: boat.name }
          ]" />
        </div>

        <!-- Gallery -->
        <div class="mb-8">
          <div class="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-4 relative group">
            <NuxtImg
              v-if="allImages[selectedImageIndex]"
              :src="allImages[selectedImageIndex]"
              :alt="boat.name"
              class="w-full h-full object-cover transition-transform duration-500"
              format="webp"
              quality="85"
              sizes="xl:1200px lg:1000px md:800px sm:600px"
              loading="eager"
              placeholder
              preload
            />
            <div v-else class="w-full h-full flex items-center justify-center text-8xl bg-linear-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900">
              🛥️
            </div>
            
            <!-- Navigation arrows for gallery -->
            <button
              v-if="allImages.length > 1 && selectedImageIndex > 0"
              class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
              @click="selectedImageIndex--"
              aria-label="Предыдущее изображение"
              type="button"
            >
              <UIcon name="i-heroicons-chevron-left" class="w-6 h-6" />
            </button>
            <button
              v-if="allImages.length > 1 && selectedImageIndex < allImages.length - 1"
              class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
              @click="selectedImageIndex++"
              aria-label="Следующее изображение"
              type="button"
            >
              <UIcon name="i-heroicons-chevron-right" class="w-6 h-6" />
            </button>
          </div>
          <div v-if="allImages.length > 1" class="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              v-for="(img, idx) in allImages"
              :key="idx"
              class="w-24 h-16 rounded-lg overflow-hidden shrink-0 ring-2 transition-all hover:ring-primary-400"
              :class="idx === selectedImageIndex ? 'ring-primary-500 ring-4' : 'ring-gray-300 dark:ring-gray-600'"
              @click="selectedImageIndex = idx"
              :aria-label="`Изображение ${idx + 1} из ${allImages.length}`"
            >
              <NuxtImg
                :src="img"
                :alt="`${boat.name} ${idx + 1}`"
                class="w-full h-full object-cover transition-opacity duration-300"
                format="webp"
                quality="70"
                width="96"
                height="64"
                loading="lazy"
                placeholder
              />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="grid lg:grid-cols-3 gap-8">
          <!-- Main Info -->
          <div class="lg:col-span-2 space-y-6">
            <div>
              <div class="flex items-start justify-between gap-4 mb-4">
                <div>
                  <UBadge variant="subtle" class="mb-2">
                    {{ getTypeLabel(boat.type) }}
                  </UBadge>
                  <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                    {{ boat.name }}
                  </h1>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {{ formatPrice(boat.pricePerHour) }}
                  </div>
                  <div class="text-gray-500 text-sm">за час</div>
                </div>
              </div>

              <div class="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400">
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-users" />
                  <span v-if="boat.recommendedCapacity && boat.recommendedCapacity < boat.capacity">
                    до {{ boat.recommendedCapacity }} гостей <span class="text-primary-600 dark:text-primary-400 font-medium">(рекомендуется)</span> / до {{ boat.capacity }} гостей <span class="text-gray-500">(максимум)</span>
                  </span>
                  <span v-else>
                    до {{ boat.capacity }} гостей
                  </span>
                </span>
                <span v-if="boat.length" class="flex items-center gap-2">
                  <UIcon name="i-heroicons-arrow-trending-up" />
                  <span>Длина: {{ boat.length }} м</span>
                </span>
                <span v-if="boat.width" class="flex items-center gap-2">
                  <UIcon name="i-heroicons-arrows-right-left" />
                  <span>Ширина: {{ boat.width }} м</span>
                </span>
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-clock" />
                  <span>Аренда от 1 часа</span>
                </span>
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-map-pin" />
                  {{ boat.location }}{{ boat.pier ? `, ${boat.pier}` : '' }}
                </span>
              </div>
            </div>

            <hr class="my-4 border-gray-200 dark:border-gray-700" />

            <!-- Description -->
            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Описание
              </h2>
              <p v-if="boat.description" class="text-gray-600 dark:text-gray-400 whitespace-pre-line mb-4">
                {{ boat.description }}
              </p>
              <p v-if="boat.detailedDescription" class="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {{ boat.detailedDescription }}
              </p>
              <p v-if="!boat.description && !boat.detailedDescription" class="text-gray-500 italic">
                Описание отсутствует
              </p>
            </div>

            <!-- Features -->
            <div v-if="boat.features?.length">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Удобства и услуги
              </h2>
              <div class="grid sm:grid-cols-2 gap-3">
                <div 
                  v-for="feature in boat.features" 
                  :key="feature"
                  class="flex items-center gap-2 text-gray-600 dark:text-gray-400"
                >
                  <UIcon :name="getFeatureIcon(feature)" class="text-primary-500" />
                  {{ feature }}
                </div>
              </div>
            </div>

            <!-- Captain & Crew -->
            <div class="flex gap-4">
              <UBadge v-if="boat.hasCapitan" color="success" variant="subtle" size="lg">
                <UIcon name="i-heroicons-user" class="mr-1" />
                С капитаном
              </UBadge>
              <UBadge v-if="boat.hasCrew" color="info" variant="subtle" size="lg">
                <UIcon name="i-heroicons-users" class="mr-1" />
                С экипажем
              </UBadge>
            </div>
          </div>

          <!-- Booking Card -->
          <div class="lg:col-span-1">
            <UCard class="sticky top-24">
              <template #header>
                <h3 class="text-lg font-semibold">Забронировать</h3>
              </template>

              <div class="space-y-4">
                <div>
                  <label for="booking-date" class="block text-sm font-medium mb-2">Дата</label>
                  <UCalendar 
                    id="booking-date"
                    v-model="bookingDate" 
                    :min-value="minBookingDate"
                    class="w-full"
                  />
                  <p v-if="bookingDate" class="text-sm text-primary-600 dark:text-primary-400 font-medium mt-2 text-center">
                    Выбрано: {{ bookingDateLabel }}
                  </p>
                  <p v-else class="text-xs text-gray-500 mt-2 text-center">
                    Выберите дату бронирования
                  </p>
                </div>

                <div>
                  <label for="booking-time" class="block text-sm font-medium mb-1">Время начала</label>
                  <USelect
                    id="booking-time"
                    v-model="bookingTime"
                    :items="timeOptions"
                    class="w-full"
                    :color="!isTimeSlotAvailable ? 'error' : 'primary'"
                  />
                  <UAlert
                    v-if="bookingDate && bookingTime && !isTimeSlotAvailable"
                    color="error"
                    variant="subtle"
                    icon="i-heroicons-exclamation-triangle"
                    class="mt-2"
                  >
                    <template #title>
                      Время занято
                    </template>
                    <template #description>
                      Выбранное время уже забронировано. Пожалуйста, выберите другое время.
                    </template>
                  </UAlert>
                </div>

                <div>
                  <label for="booking-hours" class="block text-sm font-medium mb-1">Продолжительность</label>
                  <USelect
                    id="booking-hours"
                    v-model="bookingHours"
                    :items="hoursOptions"
                    class="w-full"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Минимум 1 час
                  </p>
                </div>

                <div>
                  <label for="booking-passengers" class="block text-sm font-medium mb-1">Гостей</label>
                  <UInput
                    id="booking-passengers"
                    v-model.number="bookingPassengers"
                    type="number"
                    :min="1"
                    :max="boat.capacity"
                    class="w-full"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Максимум {{ boat.capacity }} человек
                  </p>
                </div>

                <hr class="my-4 border-gray-200 dark:border-gray-700" />

                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Итого:</span>
                  <span class="text-2xl font-bold text-primary-600">
                    {{ formatPrice(totalPrice) }}
                  </span>
                </div>

                <UButton 
                  color="primary" 
                  size="lg" 
                  block
                  :disabled="!bookingDate || !isTimeSlotAvailable"
                  @click="openBookingSlideover"
                >
                  Забронировать
                </UButton>

                <p class="text-xs text-center text-gray-500">
                  Бесплатная отмена за 24 часа
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
      title="Оформление бронирования"
      description="Заполните форму, и мы свяжемся с вами для подтверждения."
    >
      <template #body>
        <BookingForm
          v-if="boat"
          ref="bookingFormRef"
          :boat="boat"
          :booking-date="bookingDate ? bookingDate.toDate(getLocalTimeZone()) : null"
          :booking-time="bookingTime"
          :booking-hours="bookingHours"
          :booking-passengers="bookingPassengers"
          :total-price="totalPrice"
          :initial-name="customerName"
          :initial-phone="customerPhone"
          :initial-email="customerEmail"
          @submit="handleBookingSubmit"
          @cancel="showBookingSlideover = false"
        />
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
            @click="bookingFormRef?.submit()"
          >
            Подтвердить бронирование
          </UButton>
        </div>
      </template>
    </USlideover>
  </div>
</template>
