<script setup lang="ts">
import type { Boat } from '~/composables/useBoats'

interface Props {
  boat: Boat
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const { formatPrice, getTypeLabel } = useBoats()
</script>

<template>
  <UCard 
    class="boat-card h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    :class="{ 'opacity-50 pointer-events-none': loading }"
  >
    <template #header>
      <NuxtLink :to="`/boats/${boat.id}`" class="block">
        <div class="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden group">
          <NuxtImg
            v-if="boat.thumbnail"
            :src="boat.thumbnail"
            :alt="boat.name"
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
          
          <!-- Gradient overlay for better badge readability -->
          <div class="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <!-- Badges -->
          <div class="absolute top-3 left-3 z-10">
            <UBadge variant="subtle" class="backdrop-blur-md bg-white/95 dark:bg-gray-900/95 shadow-lg">
              {{ getTypeLabel(boat.type) }}
            </UBadge>
          </div>
          <div class="absolute top-3 right-3 z-10">
            <UBadge color="primary" size="lg" class="backdrop-blur-md bg-primary-500/95 shadow-lg">
              {{ formatPrice(boat.pricePerHour) }}/час
            </UBadge>
          </div>

          <!-- Loading overlay -->
          <div v-if="loading" class="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
          </div>
        </div>
      </NuxtLink>
    </template>

    <div class="space-y-3 p-4 flex flex-col h-[220px]">
      <!-- Title - fixed height -->
      <NuxtLink :to="`/boats/${boat.id}`" class="block h-7">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-1">
          {{ boat.name }}
        </h3>
      </NuxtLink>
      
      <!-- Meta info - fixed height with simplified layout -->
      <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-gray-600 dark:text-gray-400 h-[52px]">
        <span class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-users" class="w-4 h-4 shrink-0" />
          <span class="truncate">до {{ boat.capacity }} гостей</span>
        </span>
        <span class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-clock" class="w-4 h-4 shrink-0" />
          <span class="truncate">от 1 часа</span>
        </span>
        <span v-if="boat.length" class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4 shrink-0" />
          <span>{{ boat.length }} м</span>
        </span>
        <span v-if="boat.width" class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-arrows-right-left" class="w-4 h-4 shrink-0" />
          <span>{{ boat.width }} м</span>
        </span>
      </div>

      <!-- Description - fixed height -->
      <p class="text-gray-600 dark:text-gray-400 line-clamp-2 text-sm leading-relaxed h-[40px]">
        {{ boat.description || 'Комфортабельная яхта для незабываемых морских прогулок' }}
      </p>

      <!-- Features - fixed height, pushed to bottom -->
      <div class="flex flex-wrap gap-1.5 h-[28px] mt-auto overflow-hidden">
        <template v-if="boat.features?.length">
          <UBadge 
            v-for="feature in boat.features.slice(0, 3)" 
            :key="feature"
            variant="subtle"
            color="neutral"
            size="sm"
            class="transition-all hover:scale-105"
          >
            {{ feature }}
          </UBadge>
          <UBadge 
            v-if="boat.features.length > 3"
            variant="subtle"
            color="neutral"
            size="sm"
          >
            +{{ boat.features.length - 3 }}
          </UBadge>
        </template>
        <span v-else class="text-xs text-gray-400 dark:text-gray-500 flex items-center">—</span>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <UButton 
          :to="`/boats/${boat.id}`" 
          color="primary"
          class="flex-1 hover:scale-[1.02] transition-all duration-200"
          block
          :aria-label="`Забронировать ${boat.name}`"
        >
          Забронировать
        </UButton>
        <UButton 
          :to="`/boats/${boat.id}`"
          variant="outline"
          color="neutral"
          icon="i-heroicons-eye"
          class="hover:scale-105 transition-all duration-200"
          :aria-label="`Посмотреть детали ${boat.name}`"
          title="Подробнее"
        />
      </div>
    </template>
  </UCard>
</template>

<style scoped>
.boat-card {
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
