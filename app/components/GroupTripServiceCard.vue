<script setup lang="ts">
export interface GroupTripService {
  id: string
  type: 'SHORT' | 'MEDIUM' | 'FISHING'
  duration: number
  price: number
  title: string
  description?: string
  image?: string
  isActive: boolean
}

interface Props {
  service: GroupTripService
}

defineProps<Props>()

const emit = defineEmits<{
  purchase: [service: GroupTripService]
}>()

const getTripTypeLabel = (type: GroupTripService['type']): string => {
  const labels: Record<GroupTripService['type'], string> = {
    SHORT: '45 минут',
    MEDIUM: '1.5 часа',
    FISHING: 'Рыбалка 3 часа'
  }
  return labels[type] || type
}

const formatDuration = (minutes: number): string => {
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

const formatPrice = (price: number): string => {
  return price.toLocaleString('ru-RU') + ' ₽'
}

const tripTypeColors: Record<GroupTripService['type'], 'primary' | 'info' | 'success'> = {
  SHORT: 'primary',
  MEDIUM: 'info',
  FISHING: 'success'
}

const getDefaultDescription = (type: GroupTripService['type']): string => {
  const descriptions: Record<GroupTripService['type'], string> = {
    SHORT: 'Небольшая обзорная прогулка по морю. Идеально для первого знакомства с морскими просторами.',
    MEDIUM: 'Прогулка под парусами на 1.5 часа. Насладитесь ветром, тишиной и красотой Черного моря.',
    FISHING: 'Рыбалка в Черном море на 3 часа. Профессиональное снаряжение и опытный капитан обеспечат отличный улов.'
  }
  return descriptions[type] || ''
}
</script>

<template>
  <UCard 
    class="service-card h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
  >
    <!-- Image -->
    <template #header>
      <div class="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden group">
        <NuxtImg
          v-if="service.image"
          :src="service.image"
          :alt="service.title"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          format="webp"
          quality="80"
          sizes="sm:400px md:500px lg:600px"
          placeholder
        />
        <div v-else class="w-full h-full flex items-center justify-center text-6xl bg-linear-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900">
          <span v-if="service.type === 'FISHING'">🎣</span>
          <span v-else>⛵</span>
        </div>
        
        <!-- Gradient overlay for better badge readability -->
        <div class="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <!-- Badge -->
        <div class="absolute top-3 left-3 z-10">
          <UBadge :color="tripTypeColors[service.type]" variant="subtle" class="backdrop-blur-md bg-white/95 dark:bg-gray-900/95 shadow-lg">
            {{ getTripTypeLabel(service.type) }}
          </UBadge>
        </div>
        <div class="absolute top-3 right-3 z-10">
          <UBadge color="primary" size="lg" class="backdrop-blur-md bg-primary-500/95 shadow-lg">
            {{ formatPrice(service.price) }}
          </UBadge>
        </div>
      </div>
    </template>

    <!-- Content -->
    <div class="space-y-3 p-4 flex flex-col">
      <!-- Title - can wrap to 2 lines -->
      <h3 class="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 min-h-14">
        {{ service.title }}
      </h3>

      <!-- Duration and Capacity - fixed height -->
      <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 h-5">
        <span class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-clock" class="w-4 h-4 shrink-0" />
          {{ formatDuration(service.duration) }}
        </span>
        <span class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-users" class="w-4 h-4 shrink-0" />
          до 11 гостей
        </span>
      </div>

      <!-- Description - flexible height -->
      <p class="text-gray-600 dark:text-gray-400 line-clamp-3 text-sm leading-relaxed flex-1">
        {{ service.description || getDefaultDescription(service.type) }}
      </p>
    </div>

    <template #footer>
      <UButton
        color="primary"
        block
        class="hover:scale-[1.02] transition-all duration-200"
        @click="emit('purchase', service)"
      >
        Купить билет
      </UButton>
    </template>
  </UCard>
</template>

<style scoped>
.service-card {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
