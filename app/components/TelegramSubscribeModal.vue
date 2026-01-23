<script setup lang="ts">
interface Props {
  bookingId?: string
  ticketId?: string
  open: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const config = useRuntimeConfig()
const telegramBotUsername = config.public.telegramBotUsername || 'v-more_bot'

// Use computed with getter/setter for v-model to work with props
const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const telegramNotifyLink = computed(() => {
  if (props.bookingId) {
    return `https://t.me/${telegramBotUsername}?start=booking_${props.bookingId}`
  }
  if (props.ticketId) {
    return `https://t.me/${telegramBotUsername}?start=ticket_${props.ticketId}`
  }
  return `https://t.me/${telegramBotUsername}`
})

const closeModal = () => {
  isOpen.value = false
  // Save to localStorage that user saw the modal
  if (props.bookingId) {
    localStorage.setItem(`telegram_modal_seen_booking_${props.bookingId}`, 'true')
  }
  if (props.ticketId) {
    localStorage.setItem(`telegram_modal_seen_ticket_${props.ticketId}`, 'true')
  }
}

const handleSubscribe = () => {
  window.open(telegramNotifyLink.value, '_blank')
  closeModal()
}
</script>

<template>
  <UModal v-model:open="isOpen" @close="closeModal">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Получайте уведомления в Telegram
          </h3>
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-heroicons-x-mark"
            @click="closeModal"
          />
        </div>
      </template>

      <div class="space-y-4">
        <!-- Icon and main message -->
        <div class="text-center">
          <div
            class="w-20 h-20 mx-auto mb-4 bg-sky-100 dark:bg-sky-900/50 rounded-full flex items-center justify-center">
            <svg class="w-12 h-12 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
          </div>
          <p class="text-gray-600 dark:text-gray-400">
            Подключите уведомления, чтобы не пропустить важную информацию
          </p>
        </div>

        <!-- Benefits list -->
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-bell" class="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Напоминания о поездке</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Получайте напоминания за день до начала прогулки
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-success-500 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Статус бронирования</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Мгновенные уведомления о подтверждении или изменениях
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-info-500 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Важные обновления</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Информация о погоде, времени отправления и других изменениях
              </p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <UButton
            variant="outline"
            color="neutral"
            @click="closeModal"
            class="flex-1"
          >
            Позже
          </UButton>
          <UButton
            color="sky"
            @click="handleSubscribe"
            class="flex-1"
            icon="i-heroicons-bell"
          >
            Подключить уведомления
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
