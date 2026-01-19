<script setup lang="ts">
import type { GroupTrip } from '~/composables/useGroupTrips'

interface Props {
  trip: GroupTrip
}

const props = defineProps<Props>()
const { getTripTypeLabel, formatDuration, formatPrice } = useGroupTrips()

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

const tripTypeColors: Record<string, string> = {
  SHORT: 'primary',
  MEDIUM: 'info',
  FISHING: 'success'
}
</script>

<template>
  <UCard class="trip-card h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
    <!-- Image -->
    <template #header>
      <div class="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden group">
        <NuxtImg
          v-if="trip.boat?.thumbnail"
          :src="trip.boat.thumbnail"
          :alt="trip.boat?.name || 'Яхта'"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          format="webp"
          quality="80"
          sizes="sm:400px md:500px lg:600px"
          placeholder
        />
        <div v-else class="w-full h-full flex items-center justify-center text-6xl bg-linear-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900">
          🛥️
        </div>
        
        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <!-- Badges -->
        <div class="absolute top-3 left-3 z-10">
          <UBadge :color="tripTypeColors[trip.type] as any" variant="subtle" class="backdrop-blur-md bg-white/95 dark:bg-gray-900/95 shadow-lg">
            {{ getTripTypeLabel(trip.type) }}
          </UBadge>
        </div>
        <div class="absolute top-3 right-3 z-10">
          <UBadge color="primary" size="lg" class="backdrop-blur-md bg-primary-500/95 shadow-lg">
            {{ formatPrice(trip.price) }}
          </UBadge>
        </div>
      </div>
    </template>

    <!-- Content -->
    <div class="space-y-3 p-4 flex flex-col h-[180px]">
      <!-- Date & Time - fixed height -->
      <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400 h-5">
        <UIcon name="i-heroicons-calendar" class="w-4 h-4 shrink-0" />
        <span class="font-medium">{{ formatDate(trip.departureDate) }}</span>
        <span class="text-gray-400">в {{ formatTime(trip.departureDate, trip.departureTime) }}</span>
      </div>

      <!-- Duration and Boat - fixed height -->
      <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-gray-600 dark:text-gray-400 h-[44px]">
        <span class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-clock" class="w-4 h-4 shrink-0" />
          {{ formatDuration(trip.duration) }}
        </span>
        <span v-if="trip.boat" class="flex items-center gap-1.5 truncate">
          <UIcon name="i-heroicons-sparkles" class="w-4 h-4 shrink-0" />
          <span class="truncate">{{ trip.boat.name }}</span>
        </span>
      </div>

      <!-- Available Seats - fixed height -->
      <div class="flex items-center gap-2 h-6">
        <UIcon name="i-heroicons-users" class="w-4 h-4 text-gray-400 shrink-0" />
        <span v-if="trip.availableSeats > 0" class="text-sm text-success-600 dark:text-success-400 font-medium">
          {{ trip.availableSeats }} мест доступно
        </span>
        <span v-else class="text-sm text-error-600 dark:text-error-400 font-medium">
          Мест нет
        </span>
      </div>

      <!-- Spacer -->
      <div class="flex-1" />
    </div>

    <!-- Action Button -->
    <template #footer>
      <UButton
        :to="`/group-trips/${trip.id}`"
        color="primary"
        block
        class="hover:scale-[1.02] transition-all duration-200"
        :disabled="trip.availableSeats <= 0 || trip.status !== 'SCHEDULED'"
      >
        <span v-if="trip.availableSeats > 0">Купить билет</span>
        <span v-else>Мест нет</span>
      </UButton>
    </template>
  </UCard>
</template>

<style scoped>
.trip-card {
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
