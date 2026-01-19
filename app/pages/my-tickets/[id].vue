<script setup lang="ts">
const route = useRoute()
const ticketId = route.params.id as string

// Fetch ticket
const { data, error } = await useFetch(`/api/my-tickets/${ticketId}`)
const ticket = computed(() => data.value?.data)

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
