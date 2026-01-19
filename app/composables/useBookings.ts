// Composable for bookings operations

export interface Booking {
  id: string
  startDate: Date
  endDate: Date
  hours: number
  passengers: number
  totalPrice: number
  deposit?: number
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'COMPLETED'
  customerName: string
  customerPhone: string
  customerEmail?: string
  customerNotes?: string
  boat?: {
    id: string
    name: string
    thumbnail?: string
    location?: string
    pier?: string
  }
}

export interface CreateBookingData {
  boatId: string
  startDate: string
  hours: number
  passengers: number
  customerName: string
  customerPhone: string
  customerEmail?: string
  customerNotes?: string
  telegramUserId?: number
}

export function useBookings() {
  const currentBooking = ref<Booking | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Create new booking
  const createBooking = async (data: CreateBookingData) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{
        success: boolean
        data: Booking
      }>('/api/bookings', {
        method: 'POST',
        body: data
      })

      if (response.success) {
        currentBooking.value = response.data
        return response.data
      }
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Ошибка создания бронирования'
      console.error('Error creating booking:', e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Get booking by ID
  const fetchBooking = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{
        success: boolean
        data: Booking
      }>(`/api/bookings/${id}`)

      if (response.success) {
        currentBooking.value = response.data
      }
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Ошибка загрузки бронирования'
      console.error('Error fetching booking:', e)
    } finally {
      isLoading.value = false
    }
  }

  // Format booking date
  const formatDate = (date: Date | string): string => {
    const d = new Date(date)
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Format booking time
  const formatTime = (date: Date | string): string => {
    const d = new Date(date)
    return d.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status info
  const getStatusInfo = (status: Booking['status']): { label: string; color: string; icon: string } => {
    const statuses: Record<Booking['status'], { label: string; color: string; icon: string }> = {
      PENDING: {
        label: 'Ожидает подтверждения',
        color: 'warning',
        icon: 'i-heroicons-clock'
      },
      CONFIRMED: {
        label: 'Подтверждено',
        color: 'info',
        icon: 'i-heroicons-check-circle'
      },
      PAID: {
        label: 'Оплачено',
        color: 'success',
        icon: 'i-heroicons-currency-dollar'
      },
      CANCELLED: {
        label: 'Отменено',
        color: 'error',
        icon: 'i-heroicons-x-circle'
      },
      COMPLETED: {
        label: 'Завершено',
        color: 'neutral',
        icon: 'i-heroicons-flag'
      }
    }
    return statuses[status]
  }

  // Calculate total price
  const calculatePrice = (pricePerHour: number, hours: number): number => {
    return pricePerHour * hours
  }

  // Validate booking data
  const validateBookingData = (data: Partial<CreateBookingData>): string[] => {
    const errors: string[] = []

    if (!data.boatId) errors.push('Выберите яхту')
    if (!data.startDate) errors.push('Выберите дату и время')
    if (!data.hours || data.hours < 1) errors.push('Укажите продолжительность')
    if (!data.passengers || data.passengers < 1) errors.push('Укажите количество гостей')
    if (!data.customerName?.trim()) errors.push('Укажите ваше имя')
    if (!data.customerPhone?.trim()) errors.push('Укажите телефон для связи')

    // Validate phone format
    if (data.customerPhone) {
      const phoneRegex = /^[\d\s\-+()]{10,}$/
      if (!phoneRegex.test(data.customerPhone)) {
        errors.push('Неверный формат телефона')
      }
    }

    // Validate email if provided
    if (data.customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.customerEmail)) {
        errors.push('Неверный формат email')
      }
    }

    return errors
  }

  return {
    // State
    currentBooking: readonly(currentBooking),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Methods
    createBooking,
    fetchBooking,
    formatDate,
    formatTime,
    getStatusInfo,
    calculatePrice,
    validateBookingData
  }
}
