// Composable for boats operations

export interface Boat {
  id: string
  name: string
  description?: string
  type: 'YACHT' | 'CATAMARAN' | 'SPEEDBOAT' | 'SAILBOAT'
  capacity: number
  recommendedCapacity?: number
  length?: number
  width?: number
  year?: number
  pricePerHour: number
  pricePerDay?: number
  minimumHours: number
  thumbnail?: string
  images: string[]
  location: string
  pier?: string
  features: string[]
  hasCapitan: boolean
  hasCrew: boolean
  bookedDates?: Array<{ start: Date; end: Date }>
}

export interface BoatsFilter {
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
}

export interface PaginatedBoats {
  data: Boat[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useBoats() {
  const boats = ref<Boat[]>([])
  const currentBoat = ref<Boat | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Fetch boats list with filters
  const fetchBoats = async (filters: BoatsFilter = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const query = new URLSearchParams()
      
      if (filters.minPrice) query.set('minPrice', filters.minPrice.toString())
      if (filters.maxPrice) query.set('maxPrice', filters.maxPrice.toString())
      if (filters.page) query.set('page', filters.page.toString())
      if (filters.limit) query.set('limit', filters.limit.toString())

      const response = await $fetch<{ 
        success: boolean
        data: Boat[]
        pagination: typeof pagination.value 
      }>(`/api/boats?${query.toString()}`)

      if (response.success) {
        boats.value = response.data
        pagination.value = response.pagination
      }
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Ошибка загрузки яхт'
      console.error('Error fetching boats:', e)
    } finally {
      isLoading.value = false
    }
  }

  // Fetch single boat by ID
  const fetchBoat = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{
        success: boolean
        data: Boat
      }>(`/api/boats/${id}`)

      if (response.success) {
        currentBoat.value = response.data
      }
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Ошибка загрузки яхты'
      console.error('Error fetching boat:', e)
    } finally {
      isLoading.value = false
    }
  }

  // Format price for display
  const formatPrice = (price: number): string => {
    return price.toLocaleString('ru-RU') + ' ₽'
  }

  // Get boat type label
  const getTypeLabel = (type: Boat['type']): string => {
    const labels: Record<Boat['type'], string> = {
      YACHT: 'Яхта',
      CATAMARAN: 'Катамаран',
      SPEEDBOAT: 'Катер',
      SAILBOAT: 'Парусная яхта'
    }
    return labels[type] || type
  }

  // Get feature icon
  const getFeatureIcon = (feature: string): string => {
    const icons: Record<string, string> = {
      'WiFi': 'i-heroicons-wifi',
      'Кухня': 'i-heroicons-fire',
      'Кондиционер': 'i-heroicons-sun',
      'Душ': 'i-heroicons-beaker',
      'Музыка': 'i-heroicons-musical-note',
      'Телевизор': 'i-heroicons-tv',
      'Каюта': 'i-heroicons-home',
      'Рыбалка': 'i-heroicons-lifebuoy'
    }
    return icons[feature] || 'i-heroicons-check'
  }

  // Check if date is available
  const isDateAvailable = (boat: Boat, date: Date): boolean => {
    if (!boat.bookedDates) return true
    
    return !boat.bookedDates.some(booking => {
      const start = new Date(booking.start)
      const end = new Date(booking.end)
      return date >= start && date <= end
    })
  }

  return {
    // State
    boats: readonly(boats),
    currentBoat: readonly(currentBoat),
    isLoading: readonly(isLoading),
    error: readonly(error),
    pagination: readonly(pagination),

    // Methods
    fetchBoats,
    fetchBoat,
    formatPrice,
    getTypeLabel,
    getFeatureIcon,
    isDateAvailable
  }
}
