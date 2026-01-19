<script setup lang="ts">
const toast = useNotificationToast()

// Check authentication
const { data: authData } = await useFetch('/api/admin/auth/check')
if (!authData.value?.authenticated) {
  await navigateTo('/admin')
}

// Fetch services
const { data: servicesData, refresh } = await useFetch('/api/admin/group-trip-services', {
  default: () => ({ success: true, data: [] })
})

const services = computed(() => servicesData.value?.data || [])
const showEditModal = ref(false)
const editingService = ref<any>(null)

const tripTypes = [
  { label: '45 минут', value: 'SHORT', duration: 45, price: 2200 },
  { label: '1.5 часа', value: 'MEDIUM', duration: 90, price: 2500 },
  { label: 'Рыбалка 3 часа', value: 'FISHING', duration: 180, price: 3000 }
]

const formData = ref({
  type: 'SHORT' as const,
  duration: 45,
  price: 2200,
  title: '',
  description: '',
  image: '',
  isActive: true
})

const openEditModal = (service?: any) => {
  if (service) {
    editingService.value = service
    formData.value = {
      type: service.type,
      duration: service.duration,
      price: service.price,
      title: service.title,
      description: service.description || '',
      image: service.image || '',
      isActive: service.isActive
    }
  } else {
    editingService.value = null
    formData.value = {
      type: 'SHORT',
      duration: 45,
      price: 2200,
      title: '',
      description: '',
      image: '',
      isActive: true
    }
  }
  showEditModal.value = true
}

const saveService = async () => {
  try {
    const url = editingService.value
      ? `/api/admin/group-trip-services/${editingService.value.id}`
      : '/api/admin/group-trip-services'
    
    const method = editingService.value ? 'PUT' : 'POST'

    const { data } = await useFetch(url, {
      method,
      body: formData.value
    })

    if (data.value?.success) {
      toast.success(editingService.value ? 'Услуга обновлена' : 'Услуга создана')
      showEditModal.value = false
      await refresh()
    }
  } catch (e: any) {
    toast.error('Ошибка', e.data?.message || 'Не удалось сохранить услугу')
  }
}

const formatPrice = (price: number) => {
  return price.toLocaleString('ru-RU') + ' ₽'
}

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} мин`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours} ч`
  }
  return `${hours} ч ${mins} мин`
}

// Watch type change to update duration and price
watch(() => formData.value.type, (type) => {
  const tripType = tripTypes.find(t => t.value === type)
  if (tripType && !editingService.value) {
    formData.value.duration = tripType.duration
    formData.value.price = tripType.price
    formData.value.title = tripType.label
  }
})

// SEO
useSeoMeta({
  title: 'Управление типами услуг',
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
            Типы услуг
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Управление типами групповых поездок
          </p>
        </div>
        <div class="flex gap-3">
          <UButton to="/admin/group-trips" variant="outline" color="neutral">
            К поездкам
          </UButton>
          <UButton color="primary" @click="openEditModal()">
            <UIcon name="i-heroicons-plus" class="mr-2" />
            Создать услугу
          </UButton>
        </div>
      </div>

      <!-- Services Grid -->
      <div class="grid md:grid-cols-3 gap-6">
        <UCard
          v-for="service in services"
          :key="service.id"
          class="hover:shadow-lg transition-all"
        >
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <UBadge
                :color="service.type === 'FISHING' ? 'success' : service.type === 'MEDIUM' ? 'info' : 'primary'"
                variant="subtle"
              >
                {{ service.type === 'SHORT' ? '45 минут' : service.type === 'MEDIUM' ? '1.5 часа' : 'Рыбалка' }}
              </UBadge>
              <UBadge
                :color="service.isActive ? 'success' : 'neutral'"
                variant="subtle"
              >
                {{ service.isActive ? 'Активна' : 'Неактивна' }}
              </UBadge>
            </div>

            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ service.title }}
            </h3>

            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-clock" />
                {{ formatDuration(service.duration) }}
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-currency-ruble" />
                {{ formatPrice(service.price) }}
              </div>
            </div>

            <p v-if="service.description" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {{ service.description }}
            </p>

            <UButton
              color="primary"
              variant="outline"
              block
              @click="openEditModal(service)"
            >
              Редактировать
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Edit Modal -->
      <UModal v-model:open="showEditModal">
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ editingService ? 'Редактировать услугу' : 'Создать услугу' }}
          </h3>
        </template>

        <template #body>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Тип услуги *</label>
              <USelect
                v-model="formData.type"
                :items="tripTypes.map(t => ({ label: t.label, value: t.value }))"
                :disabled="!!editingService"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Название *</label>
              <UInput
                v-model="formData.title"
                placeholder="Рыбалка, Прогулка 45 минут и т.д."
                required
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Продолжительность (мин) *</label>
                <UInput
                  v-model.number="formData.duration"
                  type="number"
                  :min="1"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Цена билета (₽) *</label>
                <UInput
                  v-model.number="formData.price"
                  type="number"
                  :min="0"
                  required
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Описание</label>
              <UTextarea
                v-model="formData.description"
                :rows="4"
                placeholder="Подробное описание услуги..."
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Изображение (URL)</label>
              <UInput
                v-model="formData.image"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label class="flex items-center gap-2">
                <UCheckbox v-model="formData.isActive" />
                <span class="text-sm font-medium">Активна</span>
              </label>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex gap-3">
            <UButton variant="outline" color="neutral" @click="showEditModal = false">
              Отмена
            </UButton>
            <UButton color="primary" @click="saveService">
              {{ editingService ? 'Сохранить' : 'Создать' }}
            </UButton>
          </div>
        </template>
      </UModal>
    </UContainer>
  </div>
</template>
