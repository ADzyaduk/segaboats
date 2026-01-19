<script setup lang="ts">
const { isTelegram, user: telegramUser } = useTelegram()
const toast = useNotificationToast()

// Fetch user tickets
const { data: ticketsData, refresh } = await useFetch('/api/my-tickets', {
  default: () => ({ success: true, data: [] })
})

const tickets = computed(() => ticketsData.value?.data || [])

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

// Format price helper
const formatPrice = (price: number) => {
  return price.toLocaleString('ru-RU') + ' ₽'
}

// SEO
useSeoMeta({
  title: 'Мои билеты',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <div class="py-8">
    <UContainer>
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Мои билеты
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          {{ tickets.length }} {{ tickets.length === 1 ? 'билет' : tickets.length < 5 ? 'билета' : 'билетов' }}
        </p>
      </div>

      <!-- Empty State -->
      <UCard v-if="tickets.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-ticket" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          У вас нет билетов
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Купите билет на групповую поездку
        </p>
        <UButton to="/group-trips" color="primary">
          Посмотреть поездки
        </UButton>
      </UCard>

      <!-- Tickets List -->
      <div v-else class="space-y-4">
        <UCard
          v-for="ticket in tickets"
          :key="ticket.id"
          class="hover:shadow-md transition-shadow"
        >
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <UBadge
                  :color="statusColors[ticket.status]"
                  variant="subtle"
                  size="lg"
                >
                  {{ statusLabels[ticket.status] }}
                </UBadge>
                <span class="text-sm text-gray-500">
                  № {{ ticket.id.slice(-8) }}
                </span>
              </div>

              <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                {{ ticket.trip?.type === 'SHORT' ? '45 минут' : ticket.trip?.type === 'MEDIUM' ? '1.5 часа' : 'Рыбалка 3 часа' }}
              </h3>

              <div class="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-calendar" />
                  {{ formatDate(ticket.trip?.departureDate || ticket.createdAt) }}
                </span>
                <span v-if="ticket.trip?.departureTime" class="flex items-center gap-2">
                  <UIcon name="i-heroicons-clock" />
                  {{ ticket.trip.departureTime }}
                </span>
              </div>
            </div>

            <div class="text-right">
              <div class="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                {{ formatPrice(ticket.totalPrice) }}
              </div>
              <UButton
                :to="`/my-tickets/${ticket.id}`"
                variant="outline"
                size="sm"
              >
                Детали
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </UContainer>
  </div>
</template>
