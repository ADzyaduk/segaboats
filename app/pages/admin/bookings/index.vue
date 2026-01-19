<script setup lang="ts">
// Admin bookings management page

const toast = useNotificationToast()

// Check authentication
const { data: authData } = await useFetch('/api/admin/auth/check')
if (!authData.value?.authenticated) {
  await navigateTo('/admin')
}

// Fetch bookings
const { data: bookingsData, refresh } = await useFetch('/api/admin/bookings', {
  default: () => ({ success: true, data: [] })
})

const bookings = computed(() => bookingsData.value?.data || [])
const isLoading = ref(false)

const statusColors: Record<string, string> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PAID: 'success',
  CANCELLED: 'error',
  COMPLETED: 'neutral'
}

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждено',
  PAID: 'Оплачено',
  CANCELLED: 'Отменено',
  COMPLETED: 'Завершено'
}

const updateStatus = async (bookingId: string, newStatus: string) => {
  isLoading.value = true
  try {
    const { data } = await useFetch(`/api/admin/bookings/${bookingId}`, {
      method: 'PUT',
      body: { status: newStatus }
    })

    if (data.value?.success) {
      toast.success('Статус обновлен')
      await refresh()
    }
  } catch (e: any) {
    toast.error('Ошибка', e.data?.message || 'Не удалось обновить статус')
  } finally {
    isLoading.value = false
  }
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// SEO
useSeoMeta({
  title: 'Управление бронированиями',
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
            Управление бронированиями
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            {{ bookings.length }} бронирований
          </p>
        </div>
        <UButton to="/admin/boats" variant="outline" color="neutral">
          К яхтам
        </UButton>
      </div>

      <!-- Bookings Table -->
      <UCard>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Клиент</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Яхта</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Дата</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Продолжительность</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Стоимость</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Статус</th>
                <th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="booking in bookings"
                :key="booking.id"
                class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td class="py-4 px-4">
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">
                      {{ booking.customerName }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ booking.customerPhone }}
                    </div>
                    <div v-if="booking.customerEmail" class="text-sm text-gray-500">
                      {{ booking.customerEmail }}
                    </div>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ booking.boat?.name || 'Неизвестно' }}
                  </div>
                </td>
                <td class="py-4 px-4 text-gray-700 dark:text-gray-300">
                  {{ formatDate(booking.startDate) }}
                </td>
                <td class="py-4 px-4 text-gray-700 dark:text-gray-300">
                  {{ booking.hours }} ч.
                </td>
                <td class="py-4 px-4 text-gray-900 dark:text-white font-medium">
                  {{ booking.totalPrice.toLocaleString('ru-RU') }} ₽
                </td>
                <td class="py-4 px-4">
                  <UBadge
                    :color="statusColors[booking.status]"
                    variant="subtle"
                  >
                    {{ statusLabels[booking.status] }}
                  </UBadge>
                </td>
                <td class="py-4 px-4">
                  <USelectMenu
                    :model-value="booking.status"
                    :items="[
                      { label: 'Ожидает', value: 'PENDING' },
                      { label: 'Подтверждено', value: 'CONFIRMED' },
                      { label: 'Оплачено', value: 'PAID' },
                      { label: 'Отменено', value: 'CANCELLED' },
                      { label: 'Завершено', value: 'COMPLETED' }
                    ]"
                    @update:model-value="(status) => updateStatus(booking.id, status as string)"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="bookings.length === 0" class="text-center py-12">
            <UIcon name="i-heroicons-inbox" class="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p class="text-gray-600 dark:text-gray-400">Нет бронирований</p>
          </div>
        </div>
      </UCard>
    </UContainer>
  </div>
</template>
