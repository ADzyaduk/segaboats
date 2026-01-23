<script setup lang="ts">
const route = useRoute()
const { fetchService, currentService, getServiceTypeLabel, formatDuration, formatPrice, isLoading } = useGroupTripServices()
const { isTelegram, user: telegramUser } = useTelegram()
const toast = useNotificationToast()
const { validatePhone } = usePhoneValidation()

const serviceType = route.params.type as string
await fetchService(serviceType)

const service = computed(() => currentService.value)

// Booking form
const showBookingSlideover = ref(false)
const isSubmitting = ref(false)
const customerName = ref('')
const customerPhone = ref('')
const customerEmail = ref('')
const adultTickets = ref(1)
const childTickets = ref(0)
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
  if (!service.value) return

  // Validate
  if (!customerName.value.trim() || !customerPhone.value.trim()) {
    toast.error('Ошибка', 'Заполните все обязательные поля')
    return
  }

  const totalTickets = adultTickets.value + childTickets.value
  if (totalTickets < 1) {
    toast.error('Ошибка', 'Выберите хотя бы один билет')
    return
  }
  if (totalTickets > 10) {
    toast.error('Ошибка', 'Можно заказать не более 10 билетов')
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
    // Create tickets for service type (without specific trip)
    const response = await $fetch<{
      success: boolean
      data: any
      error?: string
    }>(`/api/group-trip-services/${serviceType}/tickets`, {
      method: 'POST',
      body: {
        customerName: customerName.value.trim(),
        customerPhone: phoneValidation.formatted,
        customerEmail: customerEmail.value.trim() || undefined,
        telegramUserId: telegramUser.value?.id?.toString(),
        adultTickets: adultTickets.value,
        childTickets: childTickets.value
      }
    })

    if (response.success && response.data) {
      const ticketCount = adultTickets.value + childTickets.value
      const ticketText = ticketCount === 1 ? 'билет' : ticketCount < 5 ? 'билета' : 'билетов'
      toast.success(
        'Билеты заказаны!', 
        `Заказано ${ticketCount} ${ticketText}. Мы свяжемся с вами в ближайшее время для согласования даты и времени поездки`
      )
      showBookingSlideover.value = false
      await navigateTo(`/my-tickets/${response.data.id}`)
    } else {
      throw new Error(response.error || 'Не удалось заказать билеты')
    }
  } catch (error: any) {
    toast.error('Ошибка', error?.data?.message || 'Не удалось заказать билеты')
  } finally {
    isSubmitting.value = false
  }
}

// Calculate prices
const adultPrice = computed(() => {
  return service.value?.price || 0
})

const childPrice = computed(() => {
  return Math.floor(adultPrice.value * 0.5) // 50% от взрослого
})

const adultTotal = computed(() => {
  return adultPrice.value * adultTickets.value
})

const childTotal = computed(() => {
  return childPrice.value * childTickets.value
})

// Calculate total price
const totalPrice = computed(() => {
  return adultTotal.value + childTotal.value
})

const totalTickets = computed(() => {
  return adultTickets.value + childTickets.value
})

// SEO
useSeoMeta({
  title: () => service.value ? `${service.value.title} - Групповая поездка` : 'Групповая поездка',
  description: () => service.value ? `Купить билет на ${service.value.title}. ${service.value.description || ''}` : 'Групповая поездка'
})
</script>

<template>
  <div class="py-8">
    <UContainer class="max-w-4xl">
      <!-- Loading -->
      <div v-if="!service && isLoading" class="space-y-6">
        <USkeleton class="h-8 w-1/3" />
        <USkeleton class="aspect-video w-full rounded-lg" />
      </div>

      <!-- Not Found -->
      <UCard v-else-if="!service" class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 mx-auto text-warning-500 mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Услуга не найдена
        </h2>
        <UButton to="/group-trips" variant="outline">
          Вернуться к списку
        </UButton>
      </UCard>

      <!-- Service Details -->
      <div v-else class="space-y-6">
        <!-- Header -->
        <div>
          <UBreadcrumb :items="[
            { label: 'Главная', to: '/' },
            { label: 'Групповые поездки', to: '/group-trips' },
            { label: service.title }
          ]" />
        </div>

        <!-- Image -->
        <div class="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          <NuxtImg
            v-if="service.image"
            :src="service.image"
            :alt="service.title"
            class="w-full h-full object-cover"
            format="webp"
            quality="85"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-8xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900">
            <span v-if="service.type === 'FISHING'">🎣</span>
            <span v-else>⛵</span>
          </div>
        </div>

        <!-- Content -->
        <div class="grid lg:grid-cols-3 gap-8">
          <!-- Main Info -->
          <div class="lg:col-span-2 space-y-6">
            <div>
              <UBadge :color="service.type === 'FISHING' ? 'success' : service.type === 'MEDIUM' ? 'info' : 'primary'" variant="subtle" class="mb-3">
                {{ getServiceTypeLabel(service.type) }}
              </UBadge>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {{ service.title }}
              </h1>

              <div class="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400 mb-4">
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-clock" />
                  {{ formatDuration(service.duration) }}
                </span>
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-users" />
                  до 11 гостей
                </span>
              </div>

              <!-- Description -->
              <div v-if="service.description" class="prose dark:prose-invert max-w-none">
                <p class="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {{ service.description }}
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
                    {{ formatPrice(service.price) }}
                  </div>
                  <div class="text-sm text-gray-500">за билет</div>
                </div>

                <hr class="my-4 border-gray-200 dark:border-gray-700" />

                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Продолжительность:</span>
                    <span class="font-medium">{{ formatDuration(service.duration) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Вместимость:</span>
                    <span class="font-medium">до 11 гостей</span>
                  </div>
                </div>

                <UAlert
                  color="info"
                  variant="subtle"
                  icon="i-heroicons-information-circle"
                  class="mt-4"
                >
                  <template #description>
                    После покупки билета мы свяжемся с вами для согласования даты и времени поездки
                  </template>
                </UAlert>

                <UButton
                  color="primary"
                  size="lg"
                  block
                  @click="openBookingSlideover"
                >
                  Заказать билет
                </UButton>

                <p class="text-xs text-center text-gray-500">
                  Менеджер предложит ближайшие доступные варианты
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
          <UCard variant="subtle" v-if="service">
            <div class="text-center">
              <h4 class="font-semibold mb-2">{{ service.title }}</h4>
              <p class="text-sm text-gray-500 mb-2">
                {{ formatDuration(service.duration) }}
              </p>
            </div>
          </UCard>

          <!-- Adult Tickets -->
          <div>
            <label for="service-adult-tickets" class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Взрослых билетов <span class="text-error-500">*</span>
            </label>
            <div class="flex items-center gap-3">
              <UButton
                variant="outline"
                color="neutral"
                size="sm"
                :disabled="adultTickets <= 0"
                @click="adultTickets = Math.max(0, adultTickets - 1)"
              >
                <UIcon name="i-heroicons-minus" />
              </UButton>
              <UInput
                id="service-adult-tickets"
                v-model.number="adultTickets"
                type="number"
                min="0"
                max="10"
                class="w-20 text-center"
              />
              <UButton
                variant="outline"
                color="neutral"
                size="sm"
                :disabled="totalTickets >= 10"
                @click="adultTickets = Math.min(10 - childTickets, adultTickets + 1)"
              >
                <UIcon name="i-heroicons-plus" />
              </UButton>
              <div class="flex-1 text-right">
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  × {{ formatPrice(adultPrice) }} = {{ formatPrice(adultTotal) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Child Tickets -->
          <div>
            <label for="service-child-tickets" class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Детских билетов (до 12 лет) <span class="text-xs text-gray-500">-50%</span>
            </label>
            <div class="flex items-center gap-3">
              <UButton
                variant="outline"
                color="neutral"
                size="sm"
                :disabled="childTickets <= 0"
                @click="childTickets = Math.max(0, childTickets - 1)"
              >
                <UIcon name="i-heroicons-minus" />
              </UButton>
              <UInput
                id="service-child-tickets"
                v-model.number="childTickets"
                type="number"
                min="0"
                max="10"
                class="w-20 text-center"
              />
              <UButton
                variant="outline"
                color="neutral"
                size="sm"
                :disabled="totalTickets >= 10"
                @click="childTickets = Math.min(10 - adultTickets, childTickets + 1)"
              >
                <UIcon name="i-heroicons-plus" />
              </UButton>
              <div class="flex-1 text-right">
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  × {{ formatPrice(childPrice) }} = {{ formatPrice(childTotal) }}
                </span>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Детский билет стоит 50% от взрослого
            </p>
          </div>

          <!-- Total -->
          <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div class="flex justify-between items-center">
              <span class="font-medium text-gray-900 dark:text-white">
                Итого ({{ totalTickets }} {{ totalTickets === 1 ? 'билет' : totalTickets < 5 ? 'билета' : 'билетов' }}):
              </span>
              <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {{ formatPrice(totalPrice) }}
              </span>
            </div>
            <p v-if="totalTickets === 0" class="text-xs text-error-500 mt-1">
              Выберите хотя бы один билет
            </p>
            <p v-else-if="totalTickets > 10" class="text-xs text-error-500 mt-1">
              Можно заказать не более 10 билетов
            </p>
          </div>

          <!-- Customer Info -->
          <div>
            <label for="service-customer-name" class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Ваше имя <span class="text-error-500">*</span>
            </label>
            <UInput
              id="service-customer-name"
              v-model="customerName"
              placeholder="Иван Иванов"
              required
              autocomplete="name"
              class="w-full"
            />
          </div>

          <div>
            <label for="service-customer-phone" class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Телефон <span class="text-error-500">*</span>
            </label>
            <UInput
              id="service-customer-phone"
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

          <div>
            <label for="service-customer-email" class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Email
            </label>
            <UInput
              id="service-customer-email"
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
              После оформления заказа мы свяжемся с вами в течение 30 минут для согласования даты и времени поездки. Менеджер предложит ближайшие доступные варианты.
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
            :disabled="!customerName || !customerPhone || totalTickets < 1 || totalTickets > 10"
            @click="handlePurchase"
          >
            Заказать {{ totalTickets }} {{ totalTickets === 1 ? 'билет' : totalTickets < 5 ? 'билета' : 'билетов' }}
          </UButton>
        </div>
      </template>
    </USlideover>
  </div>
</template>
