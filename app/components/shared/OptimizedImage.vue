<script setup lang="ts">
interface Props {
  src: string
  alt: string
  width?: number
  height?: number
  class?: string
  loading?: 'lazy' | 'eager'
  priority?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: 'lazy',
  priority: false
})
</script>

<template>
  <NuxtImg
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    :class="class"
    :loading="priority ? 'eager' : loading"
    format="webp"
    quality="80"
    placeholder
    :sizes="width ? `${width}px` : 'sm:400px md:600px lg:800px'"
  />
</template>
