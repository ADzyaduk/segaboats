<script setup lang="ts">
// Check authentication
const { data: authData } = await useFetch('/api/admin/auth/check')
if (!authData.value?.authenticated) {
  await navigateTo('/admin')
}

// Fetch services (static data from code)
const { data: servicesData } = await useFetch('/api/admin/group-trip-services', {
  default: () => ({ success: true, data: [] })
})

const services = computed(() => servicesData.value?.data || [])

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
            Типы услуг статические и настраиваются в коде
          </p>
        </div>
        <div class="flex gap-3">
          <UButton to="/admin/group-trips" variant="outline" color="neutral">
            К поездкам
          </UButton>
        </div>
      </div>

      <!-- Info Alert -->
      <UAlert
        color="info"
        variant="subtle"
        icon="i-heroicons-information-circle"
        class="mb-6"
      >
        <template #title>
          Статические данные
        </template>
        <template #description>
          Типы услуг (SHORT, MEDIUM, FISHING) настраиваются в файле <code class="text-xs">server/utils/groupTripServices.ts</code>. Для изменения цен, описаний или других параметров отредактируйте этот файл.
        </template>
      </UAlert>

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
              color="neutral"
              variant="outline"
              block
              disabled
            >
              Только просмотр
            </UButton>
          </div>
        </UCard>
      </div>

    </UContainer>
  </div>
</template>
