<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const { formatDate, formatTime, getStatusInfo } = useBookings()
const { isTelegram, close } = useTelegram()

const bookingId = route.params.id as string

// Fetch booking
const { data, error } = await useFetch(`/api/bookings/${bookingId}`)
const booking = computed(() => data.value?.data)

// Telegram bot link for notifications
const telegramBotUsername = config.public.telegramBotUsername || 'v-more_bot'
const telegramNotifyLink = computed(() => {
  return `https://t.me/${telegramBotUsername}?start=booking_${bookingId}`
})

// SEO
useSeoMeta({
  title: 'Бронирование подтверждено',
  robots: 'noindex'
})

// Status info
const statusInfo = computed(() => {
  if (!booking.value) return null
  return getStatusInfo(booking.value.status)
})
</script>

<template>
  <div class="py-8 min-h-[80vh]">
    <UContainer class="max-w-2xl">
      <!-- Error -->
      <UCard v-if="error" class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 mx-auto text-warning-500 mb-4" />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Бронирование не найдено
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Возможно, ссылка устарела или бронирование было отменено
        </p>
        <UButton to="/boats" color="primary">
          Перейти к каталогу
        </UButton>
      </UCard>

      <!-- Success -->
      <div v-else-if="booking" class="space-y-6">
        <!-- Success Banner -->
        <UCard
          class="text-center py-8 bg-linear-to-br from-primary-50 to-cyan-50 dark:from-primary-950 dark:to-cyan-950">
          <div
            class="w-20 h-20 mx-auto mb-4 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
            <UIcon name="i-heroicons-check-circle" class="w-12 h-12 text-success-600 dark:text-success-400" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Бронирование оформлено!
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Мы свяжемся с вами для подтверждения
          </p>
        </UCard>

        <!-- Booking Details -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Детали бронирования</h2>
              <UBadge v-if="statusInfo" :color="statusInfo.color" size="lg">
                <UIcon :name="statusInfo.icon" class="mr-1" />
                {{ statusInfo.label }}
              </UBadge>
            </div>
          </template>

          <div class="space-y-4">
            <!-- Boat Info -->
            <div class="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div class="w-24 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                <NuxtImg
                  v-if="booking.boat?.thumbnail"
                  :src="booking.boat.thumbnail"
                  :alt="booking.boat.name"
                  class="w-full h-full object-cover"
                  width="96"
                  height="80"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-3xl">
                  🛥️
                </div>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  {{ booking.boat?.name }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ booking.boat?.location }}{{ booking.boat?.pier ? `, ${booking.boat.pier}` : '' }}
                </p>
              </div>
            </div>

            <hr class="my-4 border-gray-200 dark:border-gray-700" />

            <!-- Details Grid -->
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <div class="text-sm text-gray-500 mb-1">Дата</div>
                <div class="font-medium flex items-center gap-2">
                  <UIcon name="i-heroicons-calendar" class="text-primary-500" />
                  {{ formatDate(booking.startDate) }}
                </div>
              </div>

              <div>
                <div class="text-sm text-gray-500 mb-1">Время</div>
                <div class="font-medium flex items-center gap-2">
                  <UIcon name="i-heroicons-clock" class="text-primary-500" />
                  {{ formatTime(booking.startDate) }}
                </div>
              </div>

              <div>
                <div class="text-sm text-gray-500 mb-1">Продолжительность</div>
                <div class="font-medium flex items-center gap-2">
                  <UIcon name="i-heroicons-arrow-path" class="text-primary-500" />
                  {{ booking.hours }} час{{ booking.hours === 1 ? '' : booking.hours < 5 ? 'а' : 'ов' }} </div>
                </div>

                <div>
                  <div class="text-sm text-gray-500 mb-1">Гостей</div>
                  <div class="font-medium flex items-center gap-2">
                    <UIcon name="i-heroicons-users" class="text-primary-500" />
                    {{ booking.passengers }} человек
                  </div>
                </div>
              </div>

              <hr class="my-4 border-gray-200 dark:border-gray-700" />

              <!-- Booking ID -->
              <div class="flex items-center justify-between">
                <span class="text-gray-500">Номер бронирования:</span>
                <code class="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
        {{ booking.id }}
      </code>
              </div>

              <!-- Total Price -->
              <div class="flex items-center justify-between text-lg">
                <span class="font-medium">Итого к оплате:</span>
                <span class="text-2xl font-bold text-primary-600">
                  {{ booking.totalPrice.toLocaleString('ru-RU') }} ₽
                </span>
              </div>
            </div>
        </UCard>

        <!-- Customer Info -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">Контактные данные</h2>
          </template>

          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-user" class="text-gray-400" />
              <span>{{ booking.customerName }}</span>
            </div>
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-phone" class="text-gray-400" />
              <a :href="`tel:${booking.customerPhone}`" class="text-primary-600 hover:underline">
                {{ booking.customerPhone }}
              </a>
            </div>
            <div v-if="booking.customerEmail" class="flex items-center gap-3">
              <UIcon name="i-heroicons-envelope" class="text-gray-400" />
              <span>{{ booking.customerEmail }}</span>
            </div>
            <div v-if="booking.customerNotes" class="flex items-start gap-3">
              <UIcon name="i-heroicons-chat-bubble-left-right" class="text-gray-400 mt-1" />
              <span class="text-gray-600 dark:text-gray-400">{{ booking.customerNotes }}</span>
            </div>
          </div>
        </UCard>

        <!-- Telegram Notifications (only for web users) -->
        <UCard v-if="!isTelegram"
          class="bg-linear-to-r from-sky-50 to-blue-50 dark:from-sky-950 dark:to-blue-950 border-sky-200 dark:border-sky-800">
            <div class="flex items-start gap-4">
              <div
              class="w-12 h-12 bg-sky-100 dark:bg-sky-900/50 rounded-full flex items-center justify-center shrink-0">
              <svg class="w-7 h-7 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
                Получайте уведомления в Telegram
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Подключите уведомления, чтобы получать напоминания о прогулке и важные обновления
              </p>
              <UButton :to="telegramNotifyLink" target="_blank" color="sky" variant="solid" size="sm"
                icon="i-heroicons-bell">
                Подключить уведомления
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Next Steps -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">Что дальше?</h2>
          </template>

          <ol class="space-y-3">
            <li class="flex gap-3">
              <div
                class="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-medium text-primary-600 shrink-0">
                1
              </div>
              <span>Мы свяжемся с вами для подтверждения в течение 30 минут</span>
            </li>
            <li class="flex gap-3">
              <div
                class="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-medium text-primary-600 shrink-0">
                2
              </div>
              <span>После подтверждения вы получите инструкции по оплате</span>
            </li>
            <li class="flex gap-3">
              <div
                class="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-medium text-primary-600 shrink-0">
                3
              </div>
              <span>Приходите на причал за 15 минут до начала прогулки</span>
            </li>
          </ol>
        </UCard>

        <!-- Actions -->
        <div class="flex gap-4">
          <UButton v-if="isTelegram" color="primary" size="lg" block @click="close">
            Закрыть
          </UButton>
          <template v-else>
            <UButton to="/boats" variant="outline" color="neutral" size="lg" class="flex-1">
              Вернуться к каталогу
            </UButton>
            <UButton to="/" color="primary" size="lg" class="flex-1">
              На главную
            </UButton>
          </template>
        </div>
      </div>
    </UContainer>
  </div>
</template>
