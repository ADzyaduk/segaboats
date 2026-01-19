<script setup lang="ts">
// Simple web layout without header/footer (for embedded pages)
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-white dark:bg-gray-950">
      <slot />
    </div>
  </UApp>
</template>
