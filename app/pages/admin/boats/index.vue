<script setup lang="ts">
// Admin boats management page

const boatsStore = useBoatsStore()
const { formatPrice, getTypeLabel } = useBoats()
const toast = useNotificationToast()

// Check authentication
const authData = await $fetch('/api/admin/auth/check').catch(() => ({ authenticated: false }))
if (!authData?.authenticated) {
  await navigateTo('/admin')
}

// Fetch boats
await boatsStore.fetchBoats({ limit: 100 })

const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedBoat = ref<any>(null)
const isDeleting = ref(false)

// Form data
const formData = ref({
  name: '',
  description: '',
  detailedDescription: '',
  type: 'YACHT' as const,
  capacity: 11,
  recommendedCapacity: 8,
  length: 12,
  width: 4,
  year: 2020,
  pricePerHour: 15000,
  pricePerDay: 120000,
  minimumHours: 1,
  thumbnail: '',
  images: [] as string[],
  location: 'Сочи',
  pier: '',
  features: [] as string[],
  hasCapitan: true,
  hasCrew: false
})

const openCreateModal = () => {
  formData.value = {
    name: '',
    description: '',
    detailedDescription: '',
    type: 'YACHT',
    capacity: 11,
    recommendedCapacity: 8,
    length: 12,
    width: 4,
    year: 2020,
    pricePerHour: 15000,
    pricePerDay: 120000,
    minimumHours: 1,
    thumbnail: '',
    images: [],
    location: 'Сочи',
    pier: '',
    features: [],
    hasCapitan: true,
    hasCrew: false
  }
  showCreateModal.value = true
}

const openEditModal = (boat: any) => {
  selectedBoat.value = boat
  formData.value = {
    name: boat.name,
    description: boat.description || '',
    detailedDescription: boat.detailedDescription || '',
    type: boat.type,
    capacity: boat.capacity,
    recommendedCapacity: boat.recommendedCapacity || boat.capacity,
    length: boat.length || 12,
    width: boat.width || 4,
    year: boat.year || 2020,
    pricePerHour: boat.pricePerHour,
    pricePerDay: boat.pricePerDay || boat.pricePerHour * 8,
    minimumHours: boat.minimumHours || 1,
    thumbnail: boat.thumbnail || '',
    images: Array.isArray(boat.images) ? boat.images : [],
    location: boat.location || 'Сочи',
    pier: boat.pier || '',
    features: Array.isArray(boat.features) ? boat.features : [],
    hasCapitan: boat.hasCapitan ?? true,
    hasCrew: boat.hasCrew ?? false
  }
  showEditModal.value = true
}

const createBoat = async () => {
  // Validate required fields
  if (!formData.value.name?.trim()) {
    toast.error('Ошибка', 'Укажите название яхты')
    return
  }
  if (!formData.value.type) {
    toast.error('Ошибка', 'Выберите тип яхты')
    return
  }
  if (!formData.value.capacity || formData.value.capacity < 1) {
    toast.error('Ошибка', 'Укажите вместимость (минимум 1)')
    return
  }
  if (!formData.value.pricePerHour || formData.value.pricePerHour <= 0) {
    toast.error('Ошибка', 'Укажите цену за час')
    return
  }

  try {
    // Prepare data with proper types - ensure Int fields are integers
    const boatData: any = {
      name: String(formData.value.name).trim(),
      type: formData.value.type,
      capacity: Math.floor(Number(formData.value.capacity) || 11), // Int
      pricePerHour: Math.floor(Number(formData.value.pricePerHour)), // Int
      minimumHours: Math.floor(Number(formData.value.minimumHours) || 1), // Int
      images: Array.isArray(formData.value.images) ? formData.value.images : [],
      location: formData.value.location || 'Сочи',
      features: Array.isArray(formData.value.features) ? formData.value.features : [],
      hasCapitan: Boolean(formData.value.hasCapitan),
      hasCrew: Boolean(formData.value.hasCrew)
    }

    // Optional fields
    if (formData.value.description) boatData.description = String(formData.value.description)
    if (formData.value.detailedDescription) boatData.detailedDescription = String(formData.value.detailedDescription)
    if (formData.value.recommendedCapacity) boatData.recommendedCapacity = Math.floor(Number(formData.value.recommendedCapacity)) // Int
    if (formData.value.length) boatData.length = Number(formData.value.length) // Float
    if (formData.value.width) boatData.width = Number(formData.value.width) // Float
    if (formData.value.year) boatData.year = Math.floor(Number(formData.value.year)) // Int
    if (formData.value.pricePerDay) boatData.pricePerDay = Math.floor(Number(formData.value.pricePerDay)) // Int
    if (formData.value.thumbnail) boatData.thumbnail = String(formData.value.thumbnail)
    if (formData.value.pier) boatData.pier = String(formData.value.pier)

    console.log('Creating boat with data:', JSON.stringify(boatData, null, 2))

    const data = await $fetch('/api/admin/boats', {
      method: 'POST',
      body: boatData
    }).catch((error) => {
      console.error('Fetch error:', error)
      throw error
    })

    if (data?.success) {
      toast.success('Яхта создана', 'Яхта успешно добавлена в каталог')
      showCreateModal.value = false
      await boatsStore.fetchBoats({ limit: 100 })
    } else {
      toast.error('Ошибка', 'Не удалось создать яхту')
    }
  } catch (e: any) {
    const errorMessage = e.data?.message || e.message || 'Не удалось создать яхту'
    toast.error('Ошибка', errorMessage)
    console.error('Create boat error:', e)
    console.error('Error details:', {
      status: e.status,
      statusCode: e.statusCode,
      data: e.data,
      message: e.message
    })
  }
}

const updateBoat = async () => {
  if (!selectedBoat.value) return

  // Validate required fields
  if (!formData.value.name?.trim()) {
    toast.error('Ошибка', 'Укажите название яхты')
    return
  }
  if (!formData.value.type) {
    toast.error('Ошибка', 'Выберите тип яхты')
    return
  }
  if (!formData.value.capacity || formData.value.capacity < 1) {
    toast.error('Ошибка', 'Укажите вместимость (минимум 1)')
    return
  }
  if (!formData.value.pricePerHour || formData.value.pricePerHour <= 0) {
    toast.error('Ошибка', 'Укажите цену за час')
    return
  }

  try {
    // Prepare data with proper types - ensure Int fields are integers
    const boatData: any = {
      name: String(formData.value.name).trim(),
      type: formData.value.type,
      capacity: Math.floor(Number(formData.value.capacity) || 11), // Int
      pricePerHour: Math.floor(Number(formData.value.pricePerHour)), // Int
      minimumHours: Math.floor(Number(formData.value.minimumHours) || 1), // Int
      images: Array.isArray(formData.value.images) ? formData.value.images : [],
      location: formData.value.location || 'Сочи',
      features: Array.isArray(formData.value.features) ? formData.value.features : [],
      hasCapitan: Boolean(formData.value.hasCapitan),
      hasCrew: Boolean(formData.value.hasCrew)
    }

    // Optional fields
    if (formData.value.description) boatData.description = String(formData.value.description)
    if (formData.value.detailedDescription) boatData.detailedDescription = String(formData.value.detailedDescription)
    if (formData.value.recommendedCapacity) boatData.recommendedCapacity = Math.floor(Number(formData.value.recommendedCapacity)) // Int
    if (formData.value.length) boatData.length = Number(formData.value.length) // Float
    if (formData.value.width) boatData.width = Number(formData.value.width) // Float
    if (formData.value.year) boatData.year = Math.floor(Number(formData.value.year)) // Int
    if (formData.value.pricePerDay) boatData.pricePerDay = Math.floor(Number(formData.value.pricePerDay)) // Int
    if (formData.value.thumbnail) boatData.thumbnail = String(formData.value.thumbnail)
    if (formData.value.pier) boatData.pier = String(formData.value.pier)

    console.log('Updating boat with data:', JSON.stringify(boatData, null, 2))

    const data = await $fetch(`/api/admin/boats/${selectedBoat.value.id}`, {
      method: 'PUT',
      body: boatData
    })

    if (data?.success) {
      toast.success('Яхта обновлена', 'Изменения сохранены')
      showEditModal.value = false
      await boatsStore.fetchBoats({ limit: 100 })
    } else {
      toast.error('Ошибка', 'Не удалось обновить яхту')
    }
  } catch (e: any) {
    const errorMessage = e.data?.message || e.message || 'Не удалось обновить яхту'
    toast.error('Ошибка', errorMessage)
    console.error('Update boat error:', e)
    console.error('Error details:', {
      status: e.status,
      statusCode: e.statusCode,
      data: e.data,
      message: e.message
    })
  }
}

const deleteBoat = async (boat: any) => {
  if (!confirm(`Удалить яхту "${boat.name}"?`)) return

  isDeleting.value = true
  try {
    const data = await $fetch(`/api/admin/boats/${boat.id}`, {
      method: 'DELETE'
    })

    if (data?.success) {
      toast.success('Яхта удалена', data.message || 'Яхта успешно удалена')
      await boatsStore.fetchBoats({ limit: 100 })
    }
  } catch (e: any) {
    toast.error('Ошибка', e.data?.message || e.message || 'Не удалось удалить яхту')
    console.error('Delete boat error:', e)
  } finally {
    isDeleting.value = false
  }
}


// SEO
useSeoMeta({
  title: 'Управление яхтами',
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
            Управление яхтами
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            {{ boatsStore.boats.length }} яхт в каталоге
          </p>
        </div>
        <div class="flex gap-3">
          <UButton to="/admin" variant="outline" color="neutral">
            Назад
          </UButton>
          <UButton color="primary" @click="openCreateModal">
            <UIcon name="i-heroicons-plus" class="mr-2" />
            Добавить яхту
          </UButton>
        </div>
      </div>

      <!-- Boats Table -->
      <UCard>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Яхта</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Тип</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Вместимость</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Цена/час</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Статус</th>
                <th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="boat in boatsStore.boats"
                :key="boat.id"
                class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td class="py-4 px-4">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                      <img
                        v-if="boat.thumbnail"
                        :src="boat.thumbnail"
                        :alt="boat.name"
                        class="w-full h-full object-cover"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center text-xl">
                        🛥️
                      </div>
                    </div>
                    <div>
                      <div class="font-medium text-gray-900 dark:text-white">
                        {{ boat.name }}
                      </div>
                      <div class="text-sm text-gray-500 line-clamp-1">
                        {{ boat.description }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <UBadge variant="subtle">
                    {{ getTypeLabel(boat.type) }}
                  </UBadge>
                </td>
                <td class="py-4 px-4 text-gray-700 dark:text-gray-300">
                  {{ boat.capacity }} чел.
                </td>
                <td class="py-4 px-4 text-gray-700 dark:text-gray-300">
                  {{ formatPrice(boat.pricePerHour) }}
                </td>
                <td class="py-4 px-4">
                  <div class="flex gap-2">
                    <UBadge
                      :color="boat.isActive ? 'success' : 'error'"
                      variant="subtle"
                      size="sm"
                    >
                      {{ boat.isActive ? 'Активна' : 'Неактивна' }}
                    </UBadge>
                    <UBadge
                      :color="boat.isAvailable ? 'success' : 'warning'"
                      variant="subtle"
                      size="sm"
                    >
                      {{ boat.isAvailable ? 'Доступна' : 'Занята' }}
                    </UBadge>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <div class="flex justify-end gap-2">
                    <UButton
                      variant="ghost"
                      color="primary"
                      size="sm"
                      icon="i-heroicons-pencil"
                      @click="openEditModal(boat)"
                    />
                    <UButton
                      variant="ghost"
                      color="error"
                      size="sm"
                      icon="i-heroicons-trash"
                      :loading="isDeleting"
                      @click="deleteBoat(boat)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <!-- Create Slideover -->
      <USlideover
        v-model:open="showCreateModal"
        side="bottom"
        :ui="{ container: 'max-w-lg max-h-[85vh]' }"
        title="Добавить яхту"
        description="Заполните форму для добавления новой яхты в каталог"
      >
        <template #body>
          <BoatForm v-model="formData" />
        </template>

        <template #footer>
          <div class="flex gap-3">
            <UButton variant="outline" color="neutral" @click="showCreateModal = false">
              Отмена
            </UButton>
            <UButton color="primary" @click="createBoat">
              Создать
            </UButton>
          </div>
        </template>
      </USlideover>

      <!-- Edit Slideover -->
      <USlideover
        v-model:open="showEditModal"
        side="bottom"
        :ui="{ container: 'max-w-lg max-h-[85vh]' }"
        title="Редактировать яхту"
        description="Внесите изменения в данные яхты"
      >
        <template #body>
          <BoatForm v-model="formData" />
        </template>

        <template #footer>
          <div class="flex gap-3">
            <UButton variant="outline" color="neutral" @click="showEditModal = false">
              Отмена
            </UButton>
            <UButton color="primary" @click="updateBoat">
              Сохранить
            </UButton>
          </div>
        </template>
      </USlideover>
    </UContainer>
  </div>
</template>
