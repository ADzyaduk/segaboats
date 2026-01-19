<script setup lang="ts">
const boatsStore = useBoatsStore()

// SEO
useSeoMeta({
  title: 'Каталог яхт',
  description: 'Выберите яхту для аренды в Сочи. Катера, яхты, катамараны на любой вкус и бюджет.',
  ogTitle: 'Каталог яхт в Сочи',
  ogDescription: 'Более 50 яхт и катеров для аренды. Онлайн бронирование с подтверждением.',
  ogImage: '/og-image.jpg',
  twitterCard: 'summary_large_image'
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://yachts-sochi.ru/boats' }
  ]
})

// Fetch boats on mount
await boatsStore.fetchBoats()
</script>

<template>
  <div class="py-8">
    <UContainer>
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Каталог яхт
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          {{ boatsStore.pagination.total }} яхт доступно для аренды
        </p>
      </div>

      <!-- Boats Grid -->
      <div>
        <!-- Loading State -->
        <div v-if="boatsStore.isLoading" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <BoatCardSkeleton v-for="i in 6" :key="i" />
        </div>

        <!-- Empty State -->
        <EmptyState
          v-else-if="boatsStore.boats.length === 0"
          title="Яхты не найдены"
          description="В данный момент яхты недоступны. Попробуйте позже."
          icon="i-heroicons-magnifying-glass"
        />

        <!-- Boats List -->
        <TransitionGroup
          v-else
          name="list"
          tag="div"
          class="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <BoatCard
            v-for="(boat, index) in boatsStore.boats"
            :key="boat.id"
            :boat="boat"
            :style="{ 'animation-delay': `${Math.min(index * 50, 500)}ms` }"
          />
        </TransitionGroup>

        <!-- Pagination -->
        <div v-if="boatsStore.pagination.totalPages > 1" class="mt-8 flex justify-center">
          <UPagination
            :model-value="boatsStore.pagination.page"
            :total="boatsStore.pagination.total"
            :page-count="boatsStore.pagination.limit"
            @update:model-value="(page) => boatsStore.fetchBoats({ page })"
          />
        </div>
      </div>
    </UContainer>
  </div>
</template>

<style scoped>
/* List transition animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.list-move {
  transition: transform 0.4s ease;
}
</style>
