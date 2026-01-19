<script setup lang="ts">
// Skeleton loader for boat cards
</script>

<template>
  <UCard class="h-full overflow-hidden">
    <template #header>
      <USkeleton class="aspect-video w-full" />
    </template>

    <div class="space-y-3 p-4 h-[220px]">
      <!-- Title -->
      <USkeleton class="h-7 w-3/4" />
      
      <!-- Meta info grid -->
      <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 h-[52px]">
        <USkeleton class="h-4 w-24" />
        <USkeleton class="h-4 w-20" />
        <USkeleton class="h-4 w-16" />
        <USkeleton class="h-4 w-16" />
      </div>
      
      <!-- Description -->
      <div class="h-[40px] space-y-1.5">
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-2/3" />
      </div>
      
      <!-- Features -->
      <div class="flex gap-2 h-[28px]">
        <USkeleton class="h-6 w-16 rounded-full" />
        <USkeleton class="h-6 w-20 rounded-full" />
        <USkeleton class="h-6 w-14 rounded-full" />
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <USkeleton class="h-10 flex-1" />
        <USkeleton class="h-10 w-10" />
      </div>
    </template>
  </UCard>
</template>
