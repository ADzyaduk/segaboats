<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const { isTelegram } = useTelegram()
const ticketId = route.params.id as string

// Fetch ticket
const { data, error } = await useFetch(`/api/my-tickets/${ticketId}`)
const ticket = computed(() => {
  const t = data.value?.data
  // #region agent log
  if (t) {
    fetch('http://127.0.0.1:7242/ingest/fcafbc82-373d-455c-ae65-b91ce9c6082f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'my-tickets/[id].vue:ticket',message:'Ticket loaded from API',data:{ticketId:t.id,totalPrice:t.totalPrice,adultTickets:t.adultTickets,childTickets:t.childTickets,adultPrice:t.adultPrice,childPrice:t.childPrice},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  }
  // #endregion
  return t
})

// Telegram bot link for notifications
const telegramBotUsername = config.public.telegramBotUsername || 'v-more_bot'
const telegramNotifyLink = computed(() => {
  return `https://t.me/${telegramBotUsername}?start=ticket_${ticketId}`
})

const statusColors: Record<string, string> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'error'
}

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает подтверждения',
  CONFIRMED: 'Подтвержден',
  CANCELLED: 'Отменен'
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

const formatPrice = (price: number) => {
  return price.toLocaleString('ru-RU') + ' ₽'
}

// SEO
useSeoMeta({
  title: 'Детали билета',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <div class="py-8">
    <UContainer class="max-w-2xl">
      <!-- Error -->
      <UCard v-if="error" class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 mx-auto text-warning-500 mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Билет не найден
        </h2>
        <UButton to="/my-tickets" variant="outline">
          Вернуться к билетам
        </UButton>
      </UCard>

      <!-- Ticket Details -->
      <div v-else-if="ticket" class="space-y-6">
        <!-- Status Banner -->
        <UCard class="text-center py-6" :class="{
          'bg-warning-50 dark:bg-warning-950': ticket.status === 'PENDING',
          'bg-success-50 dark:bg-success-950': ticket.status === 'CONFIRMED',
          'bg-error-50 dark:bg-error-950': ticket.status === 'CANCELLED'
        }">
          <UBadge
            :color="statusColors[ticket.status]"
            variant="solid"
            size="lg"
            class="mb-3"
          >
            {{ statusLabels[ticket.status] }}
          </UBadge>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Билет на групповую поездку
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            <span v-if="ticket.trip?.type === 'SHORT'">45 минут</span>
            <span v-else-if="ticket.trip?.type === 'MEDIUM'">1.5 часа</span>
            <span v-else-if="ticket.trip?.type === 'FISHING'">Рыбалка 3 часа</span>
          </p>
        </UCard>

        <!-- Ticket Info -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">Информация о билете</h2>
          </template>

          <div class="space-y-4">
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <div class="text-sm text-gray-500 mb-1">Дата</div>
                <div class="font-medium flex items-center gap-2">
                  <UIcon name="i-heroicons-calendar" class="text-primary-500" />
                  {{ formatDate(ticket.trip?.departureDate || ticket.createdAt) }}
                </div>
              </div>

              <div>
                <div class="text-sm text-gray-500 mb-1">Время</div>
                <div class="font-medium flex items-center gap-2">
                  <UIcon name="i-heroicons-clock" class="text-primary-500" />
                  {{ formatTime(ticket.trip?.departureDate || ticket.createdAt, ticket.trip?.departureTime) }}
                </div>
              </div>

              <div>
                <div class="text-sm text-gray-500 mb-1">Номер билета</div>
                <code class="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {{ ticket.id }}
                </code>
              </div>

              <div>
                <div class="text-sm text-gray-500 mb-1">Стоимость</div>
                <div class="text-2xl font-bold text-primary-600">
                  {{ formatPrice(ticket.totalPrice) }}
                </div>
              </div>
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
              <span>{{ ticket.customerName }}</span>
            </div>
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-phone" class="text-gray-400" />
              <a :href="`tel:${ticket.customerPhone}`" class="text-primary-600 hover:underline">
                {{ ticket.customerPhone }}
              </a>
            </div>
            <div v-if="ticket.customerEmail" class="flex items-center gap-3">
              <UIcon name="i-heroicons-envelope" class="text-gray-400" />
              <span>{{ ticket.customerEmail }}</span>
            </div>
          </div>
        </UCard>

        <!-- Telegram Notifications (only for web users) -->
        <UCard v-if="!isTelegram"
          class="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950 dark:to-blue-950 border-sky-200 dark:border-sky-800">
          <div class="flex items-start gap-4">
            <div
              class="w-12 h-12 bg-sky-100 dark:bg-sky-900/50 rounded-full flex items-center justify-center flex-shrink-0">
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
                Подключите уведомления, чтобы получать информацию о статусе билета и времени отправления
              </p>
              <UButton :to="telegramNotifyLink" target="_blank" color="sky" variant="solid" size="sm"
                icon="i-heroicons-bell">
                Подключить уведомления
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Actions -->
        <div class="flex gap-4">
          <UButton to="/my-tickets" variant="outline" color="neutral" class="flex-1">
            Все билеты
          </UButton>
          <UButton to="/group-trips" color="primary" class="flex-1">
            Еще поездки
          </UButton>
        </div>
      </div>
    </UContainer>
  </div>
</template>
