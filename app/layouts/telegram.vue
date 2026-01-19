<script setup lang="ts">
const { isTelegram, colorScheme, themeParams } = useTelegram()
const { currentColors, applyTheme } = useTheme()

// Apply theme on mount
if (typeof document !== 'undefined') {
  onMounted(() => {
    applyTheme()
  })

  // Watch for theme changes
  watch([themeParams, colorScheme], () => {
    applyTheme()
  }, { deep: true })
}

// Apply Telegram theme colors
const bgColor = computed(() => currentColors.value.background)
const textColor = computed(() => currentColors.value.text)
</script>

<template>
  <UApp>
    <div 
      class="min-h-screen telegram-app"
      :style="{
        backgroundColor: bgColor,
        color: textColor,
        '--tg-theme-bg-color': currentColors.background,
        '--tg-theme-text-color': currentColors.text,
        '--tg-theme-button-color': currentColors.primary,
        '--tg-theme-button-text-color': currentColors.primaryForeground,
        '--tg-theme-link-color': currentColors.accent,
        '--tg-theme-hint-color': currentColors.muted,
        '--tg-theme-secondary-bg-color': currentColors.secondary
      }"
    >
      <!-- Telegram Mini App Header (optional) -->
      <header v-if="$slots.header" class="sticky top-0 z-50 px-4 py-3" :style="{ borderBottomColor: currentColors.border }">
        <slot name="header" />
      </header>

      <!-- Main Content -->
      <main class="pb-safe">
        <slot />
      </main>
    </div>
  </UApp>
</template>

<style scoped>
.telegram-app {
  /* Safe area for iOS */
  padding-bottom: env(safe-area-inset-bottom);
  
  /* Apply Telegram theme variables */
  --color-primary: var(--tg-theme-button-color, #3b82f6);
  --color-primary-foreground: var(--tg-theme-button-text-color, #ffffff);
  --color-background: var(--tg-theme-bg-color, #ffffff);
  --color-text: var(--tg-theme-text-color, #000000);
  --color-secondary: var(--tg-theme-secondary-bg-color, #f5f5f5);
  --color-accent: var(--tg-theme-link-color, #3b82f6);
  --color-border: var(--tg-theme-hint-color, #e5e5e5);
  --color-card: var(--tg-theme-secondary-bg-color, #ffffff);
  --color-muted: var(--tg-theme-hint-color, #666666);
  
  /* Transition for theme changes */
  transition: background-color 0.3s ease, color 0.3s ease;
}

.pb-safe {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

/* Override Nuxt UI colors for Telegram */
.telegram-app :deep(.bg-primary) {
  background-color: var(--color-primary) !important;
}

.telegram-app :deep(.text-primary) {
  color: var(--color-primary) !important;
}

.telegram-app :deep(.border-primary) {
  border-color: var(--color-primary) !important;
}

.telegram-app :deep(.bg-card) {
  background-color: var(--color-card) !important;
}

.telegram-app :deep(.text-muted) {
  color: var(--color-muted) !important;
}
</style>
