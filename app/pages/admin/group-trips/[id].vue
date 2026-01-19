<script setup lang="ts">
const route = useRoute()
const tripId = route.params.id as string
const toast = useNotificationToast()

// Check authentication
const { data: authData } = await useFetch('/api/admin/auth/check')
if (!authData.value?.authenticated) {
  await navigateTo('/admin')
}

// Fetch trip with tickets
const { data: tripData, refresh } = await useFetch(`/api/admin/group-trips/${tripId}`, {
  default: () => ({ success: true, data: null })
})

const trip = computed(() => tripData.value?.data)

const updateTicketStatus = async (ticketId: string, status: string) => {
  try {
    const { data } = await useFetch(`/api/admin/group-trips/${tripId}/tickets/${ticketId}`, {
      method: 'PUT',
      body: { status }
    })

    if (data.value?.success) {
      toast.success('Статус билета обновлен')
      await refresh()
    }
  } catch (e: any) {
    toast.error('Ошибка', e.data?.message || 'Не удалось обновить статус')
  }
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPrice = (price: number) => {
  return price.toLocaleString('ru-RU') + ' ₽'
}

const statusColors: Record<string, string> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'error'
}

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтвержден',
  CANCELLED: 'Отменен'
}

// SEO
useSeoMeta({
  title: 'Управление поездкой',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <UContainer>
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Управление поездкой
          </h1>
          <p v-if="trip" class="text-gray-600 dark:text-gray-400 mt-1">
            <span v-if="trip.type === 'SHORT'">45 минут</span>
            <span v-else-if="trip.type === 'MEDIUM'">1.5 часа</span>
            <span v-else-if="trip.type === 'FISHING'">Рыбалка 3 часа</span>
            - {{ formatDate(trip.departureDate) }}
          </p>
        </div>
        <UButton to="/admin/group-trips" variant="outline" color="neutral">
          Назад
        </UButton>
      </div>

      <!-- Trip Info -->
      <UCard v-if="trip" class="mb-6">
        <div class="grid md:grid-cols-3 gap-4">
          <div>
            <div class="text-sm text-gray-500 mb-1">Цена билета</div>
            <div class="text-2xl font-bold text-primary-600">
              {{ formatPrice(trip.price) }}
            </div>
          </div>
          <div>
            <div class="text-sm text-gray-500 mb-1">Доступно мест</div>
            <div class="text-xl font-semibold">
              {{ trip.availableSeats }} / {{ trip.maxCapacity }}
            </div>
          </div>
          <div>
            <div class="text-sm text-gray-500 mb-1">Билетов продано</div>
            <div class="text-xl font-semibold">
              {{ trip._count?.tickets || 0 }}
            </div>
          </div>
        </div>
      </UCard>

      <!-- Tickets Table -->
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">Билеты</h2>
        </template>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Клиент</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Телефон</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Цена</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Статус</th>
                <th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="ticket in trip.tickets"
                :key="ticket.id"
                class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td class="py-4 px-4">
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ ticket.customerName }}
                  </div>
                </td>
                <td class="py-4 px-4 text-gray-700 dark:text-gray-300">
                  {{ ticket.customerPhone }}
                </td>
                <td class="py-4 px-4 text-gray-700 dark:text-gray-300">
                  {{ formatPrice(ticket.totalPrice) }}
                </td>
                <td class="py-4 px-4">
                  <UBadge
                    :color="statusColors[ticket.status]"
                    variant="subtle"
                  >
                    {{ statusLabels[ticket.status] }}
                  </UBadge>
                </td>
                <td class="py-4 px-4">
                  <USelectMenu
                    :model-value="ticket.status"
                    :items="[
                      { label: 'Ожидает', value: 'PENDING' },
                      { label: 'Подтвержден', value: 'CONFIRMED' },
                      { label: 'Отменен', value: 'CANCELLED' }
                    ]"
                    @update:model-value="(status) => updateTicketStatus(ticket.id, status as string)"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="!trip.tickets || trip.tickets.length === 0" class="text-center py-12">
            <UIcon name="i-heroicons-ticket" class="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p class="text-gray-600 dark:text-gray-400">Нет билетов</p>
          </div>
        </div>
      </UCard>
    </UContainer>
  </div>
</template>
