<script setup lang="ts">
interface Props {
  loading: boolean
  message?: string
}

withDefaults(defineProps<Props>(), {
  message: 'Загрузка...'
})
</script>

<template>
  <Transition name="fade">
    <div
      v-if="loading"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div class="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl max-w-sm mx-4">
        <div class="flex flex-col items-center gap-4">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
          <p class="text-gray-700 dark:text-gray-300 font-medium">
            {{ message }}
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
