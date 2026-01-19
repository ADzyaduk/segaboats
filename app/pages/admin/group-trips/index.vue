<script setup lang="ts">
const toast = useNotificationToast()

// Check authentication
const { data: authData } = await useFetch('/api/admin/auth/check')
if (!authData.value?.authenticated) {
  await navigateTo('/admin')
}

// Fetch trips
const { data: tripsData, refresh } = await useFetch('/api/admin/group-trips', {
  default: () => ({ success: true, data: [] })
})

const trips = computed(() => tripsData.value?.data || [])
const showCreateModal = ref(false)

const tripTypes = [
  { label: '45 минут', value: 'SHORT', duration: 45, price: 2200 },
  { label: '1.5 часа', value: 'MEDIUM', duration: 90, price: 2500 },
  { label: 'Рыбалка 3 часа', value: 'FISHING', duration: 180, price: 3000 }
]

const formData = ref({
  type: 'SHORT' as const,
  duration: 45,
  price: 2200,
  maxCapacity: 11,
  availableSeats: 11,
  departureDate: '',
  departureTime: '',
  boatId: ''
})

const openCreateModal = () => {
  formData.value = {
    type: 'SHORT',
    duration: 45,
    price: 2200,
    maxCapacity: 11,
    availableSeats: 11,
    departureDate: '',
    departureTime: '',
    boatId: ''
  }
  showCreateModal.value = true
}

const createTrip = async () => {
  try {
    const { data } = await useFetch('/api/admin/group-trips', {
      method: 'POST',
      body: formData.value
    })

    if (data.value?.success) {
      toast.success('Поездка создана')
      showCreateModal.value = false
      await refresh()
    }
  } catch (e: any) {
    toast.error('Ошибка', e.data?.message || 'Не удалось создать поездку')
  }
}

const updateTripStatus = async (tripId: string, status: string) => {
  try {
    const { data } = await useFetch(`/api/admin/group-trips/${tripId}`, {
      method: 'PUT',
      body: { status }
    })

    if (data.value?.success) {
      toast.success('Статус обновлен')
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

// Watch type change to update duration and price
watch(() => formData.value.type, (type) => {
  const tripType = tripTypes.find(t => t.value === type)
  if (tripType) {
    formData.value.duration = tripType.duration
    formData.value.price = tripType.price
  }
})

// SEO
useSeoMeta({
  title: 'Управление групповыми поездками',
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
            Групповые поездки
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            {{ trips.length }} поездок
          </p>
        </div>
        <div class="flex gap-3">
          <UButton to="/admin/boats" variant="outline" color="neutral">
            К яхтам
          </UButton>
          <UButton color="primary" @click="openCreateModal">
            <UIcon name="i-heroicons-plus" class="mr-2" />
            Создать поездку
          </UButton>
        </div>
      </div>

      <!-- Trips Table -->
      <UCard>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Тип</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Дата</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Цена</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Места</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Статус</th>
                <th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="trip in trips"
                :key="trip.id"
                class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td class="py-4 px-4">
                  <div class="font-medium text-gray-900 dark:text-white">
                    <span v-if="trip.type === 'SHORT'">45 минут</span>
                    <span v-else-if="trip.type === 'MEDIUM'">1.5 часа</span>
                    <span v-else-if="trip.type === 'FISHING'">Рыбалка 3 часа</span>
                  </div>
                </td>
                <td class="py-4 px-4 text-gray-700 dark:text-gray-300">
                  {{ formatDate(trip.departureDate) }}
                </td>
                <td class="py-4 px-4 text-gray-700 dark:text-gray-300">
                  {{ formatPrice(trip.price) }}
                </td>
                <td class="py-4 px-4 text-gray-700 dark:text-gray-300">
                  {{ trip.availableSeats }} / {{ trip.maxCapacity }}
                </td>
                <td class="py-4 px-4">
                  <UBadge
                    :color="trip.status === 'SCHEDULED' ? 'success' : trip.status === 'FULL' ? 'warning' : 'neutral'"
                    variant="subtle"
                  >
                    {{ trip.status === 'SCHEDULED' ? 'Запланирована' : trip.status === 'FULL' ? 'Заполнена' : trip.status === 'COMPLETED' ? 'Завершена' : 'Отменена' }}
                  </UBadge>
                </td>
                <td class="py-4 px-4">
                  <div class="flex justify-end gap-2">
                    <UButton
                      variant="ghost"
                      color="primary"
                      size="sm"
                      :to="`/admin/group-trips/${trip.id}`"
                    >
                      Управление
                    </UButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <!-- Create Modal -->
      <UModal v-model:open="showCreateModal">
        <template #header>
          <h3 class="text-lg font-semibold">Создать групповую поездку</h3>
        </template>

        <template #body>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Тип поездки *</label>
              <USelect
                v-model="formData.type"
                :items="tripTypes.map(t => ({ label: t.label, value: t.value }))"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Продолжительность (мин) *</label>
                <UInput
                  v-model.number="formData.duration"
                  type="number"
                  :min="1"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Цена билета (₽) *</label>
                <UInput
                  v-model.number="formData.price"
                  type="number"
                  :min="0"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Максимум мест</label>
                <UInput
                  v-model.number="formData.maxCapacity"
                  type="number"
                  :min="1"
                  :max="11"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Доступно мест *</label>
                <UInput
                  v-model.number="formData.availableSeats"
                  type="number"
                  :min="0"
                  :max="formData.maxCapacity"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Дата отправления *</label>
                <UInput
                  v-model="formData.departureDate"
                  type="datetime-local"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Время (опционально)</label>
                <UInput
                  v-model="formData.departureTime"
                  type="time"
                />
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex gap-3">
            <UButton variant="outline" color="neutral" @click="showCreateModal = false">
              Отмена
            </UButton>
            <UButton color="primary" @click="createTrip">
              Создать
            </UButton>
          </div>
        </template>
      </UModal>
    </UContainer>
  </div>
</template>
