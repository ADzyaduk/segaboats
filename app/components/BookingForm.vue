<script setup lang="ts">
interface Props {
  boat: {
    id: string
    name: string
    thumbnail?: string
    pricePerHour: number
    minimumHours: number
    capacity: number
  }
  bookingDate: Date | null
  bookingTime: string
  bookingHours: number
  bookingPassengers: number
  totalPrice: number
  initialName?: string
  initialPhone?: string
  initialEmail?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: {
    customerName: string
    customerPhone: string
    customerEmail?: string
    customerNotes?: string
  }]
  cancel: []
}>()

const { validatePhone, formatPhone } = usePhoneValidation()
const toast = useNotificationToast()

const customerName = ref(props.initialName || '')
const customerPhone = ref(props.initialPhone || '')
const customerEmail = ref(props.initialEmail || '')
const customerNotes = ref('')
const phoneError = ref<string | null>(null)

const submit = () => {
  handleSubmit()
}

defineExpose({
  submit
})

// Watch for initial values changes
watch(() => props.initialName, (val) => {
  if (val && !customerName.value) {
    customerName.value = val
  }
})

watch(() => props.initialPhone, (val) => {
  if (val && !customerPhone.value) {
    customerPhone.value = val
  }
})

watch(() => props.initialEmail, (val) => {
  if (val && !customerEmail.value) {
    customerEmail.value = val
  }
})

// Format phone on input
const onPhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  
  // Allow user to type freely, but format on blur
  customerPhone.value = value
  phoneError.value = null
}

// Validate phone on blur
const onPhoneBlur = () => {
  if (customerPhone.value) {
    const validation = validatePhone(customerPhone.value)
    customerPhone.value = validation.formatted
    
    if (!validation.isValid) {
      phoneError.value = validation.error || 'Некорректный формат телефона'
    } else {
      phoneError.value = null
    }
  }
}

// Submit form
const handleSubmit = () => {
  // Validate name
  if (!customerName.value || customerName.value.trim().length === 0) {
    toast.error('Ошибка', 'Укажите ваше имя')
    return
  }

  // Validate phone
  const phoneValidation = validatePhone(customerPhone.value)
  if (!phoneValidation.isValid) {
    phoneError.value = phoneValidation.error || 'Некорректный формат телефона'
    toast.error('Ошибка', phoneValidation.error || 'Проверьте номер телефона')
    return
  }

  // Emit submit event with validated data
  emit('submit', {
    customerName: customerName.value.trim(),
    customerPhone: phoneValidation.formatted,
    customerEmail: customerEmail.value.trim() || undefined,
    customerNotes: customerNotes.value.trim() || undefined
  })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Summary -->
    <UCard variant="subtle">
      <div class="flex gap-4">
        <div class="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
          <NuxtImg
            v-if="boat.thumbnail" 
            :src="boat.thumbnail" 
            :alt="boat.name"
            class="w-full h-full object-cover"
            format="webp"
            quality="70"
            width="80"
            height="64"
            loading="lazy"
            placeholder
          />
          <div v-else class="w-full h-full flex items-center justify-center text-2xl">
            🛥️
          </div>
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-gray-900 dark:text-white">{{ boat.name }}</h4>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ bookingDate ? new Date(bookingDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '' }}
            в {{ bookingTime }}, {{ bookingHours }} {{ bookingHours === 1 ? 'час' : bookingHours < 5 ? 'часа' : 'часов' }}
          </p>
          <p class="text-primary-600 dark:text-primary-400 font-semibold">
            {{ totalPrice.toLocaleString('ru-RU') }} ₽
          </p>
        </div>
      </div>
    </UCard>

    <!-- Customer Info -->
    <div>
      <label for="booking-customer-name" class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
        Ваше имя <span class="text-error-500">*</span>
      </label>
      <UInput 
        id="booking-customer-name"
        v-model="customerName" 
        placeholder="Иван Иванов"
        required
        autocomplete="name"
        class="w-full"
      />
      <p class="text-xs text-gray-500 mt-1">
        Для связи и подтверждения бронирования
      </p>
    </div>

    <div>
      <label for="booking-customer-phone" class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
        Телефон <span class="text-error-500">*</span>
      </label>
      <UInput 
        id="booking-customer-phone"
        v-model="customerPhone" 
        type="tel"
        placeholder="+7 (900) 123-45-67"
        required
        autocomplete="tel"
        :color="phoneError ? 'error' : 'primary'"
        @input="onPhoneInput"
        @blur="onPhoneBlur"
        class="w-full"
      />
      <p v-if="phoneError" class="text-xs text-error-500 mt-1">
        {{ phoneError }}
      </p>
      <p v-else class="text-xs text-gray-500 mt-1">
        Мы позвоним вам для подтверждения бронирования
      </p>
    </div>

    <div>
      <label for="booking-customer-email" class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
        Email
      </label>
      <UInput 
        id="booking-customer-email"
        v-model="customerEmail" 
        type="email"
        placeholder="example@mail.ru"
        autocomplete="email"
        class="w-full"
      />
      <p class="text-xs text-gray-500 mt-1">
        Для отправки подтверждения (необязательно)
      </p>
    </div>

    <div>
      <label for="booking-customer-notes" class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
        Пожелания и комментарии
      </label>
      <UTextarea 
        id="booking-customer-notes"
        v-model="customerNotes" 
        placeholder="Особые пожелания, праздник, детский праздник и т.д."
        :rows="3"
        class="w-full"
      />
      <p class="text-xs text-gray-500 mt-1">
        Укажите любые особые требования или пожелания
      </p>
    </div>

    <!-- Info -->
    <UAlert
      color="info"
      variant="subtle"
      icon="i-heroicons-information-circle"
    >
      <template #title>
        Важная информация
      </template>
      <template #description>
        После оформления бронирования мы свяжемся с вами по телефону для подтверждения в течение 30 минут. Бронирование будет подтверждено после согласования всех деталей.
      </template>
    </UAlert>
  </div>
</template>
