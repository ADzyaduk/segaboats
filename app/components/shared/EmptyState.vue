<script setup lang="ts">
interface Props {
  title: string
  description?: string
  icon?: string
  actionLabel?: string
  action?: () => void
}

withDefaults(defineProps<Props>(), {
  icon: 'i-heroicons-magnifying-glass',
  actionLabel: 'Попробовать снова'
})
</script>

<template>
  <UCard class="text-center py-12">
    <div class="max-w-md mx-auto space-y-4">
      <div class="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <UIcon :name="icon" class="w-8 h-8 text-gray-400" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ title }}
      </h3>
      <p v-if="description" class="text-gray-600 dark:text-gray-400">
        {{ description }}
      </p>
      <UButton
        v-if="action"
        variant="outline"
        color="primary"
        @click="action"
      >
        {{ actionLabel }}
      </UButton>
    </div>
  </UCard>
</template>
