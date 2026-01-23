// Composable for group trips operations

export interface GroupTrip {
  id: string
  type: 'SHORT' | 'MEDIUM' | 'FISHING'
  duration: number
  price: number
  maxCapacity: number
  availableSeats: number
  departureDate: Date | string
  departureTime?: string
  boatId?: string
  boat?: {
    id: string
    name: string
    thumbnail?: string
    location?: string
    pier?: string
  }
  status: 'SCHEDULED' | 'FULL' | 'COMPLETED' | 'CANCELLED'
  _count?: {
    tickets: number
  }
}

export interface GroupTripTicket {
  id: string
  tripId: string
  userId: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  totalPrice: number
  createdAt: Date | string
  confirmedAt?: Date | string
  cancelledAt?: Date | string
  trip?: {
    type: string
    departureDate: Date | string
  }
}

export function useGroupTrips() {
  const trips = ref<GroupTrip[]>([])
  const currentTrip = ref<GroupTrip | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Fetch group trips
  const fetchTrips = async (filters?: { type?: string; date?: string }) => {
    isLoading.value = true
    error.value = null

    try {
      const query = new URLSearchParams()
      if (filters?.type) query.set('type', filters.type)
      if (filters?.date) query.set('date', filters.date)

      const response = await $fetch<{
        success: boolean
        data: GroupTrip[]
      }>(`/api/group-trips?${query.toString()}`)

      if (response.success) {
        trips.value = response.data
      }
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Ошибка загрузки поездок'
      console.error('Error fetching group trips:', e)
    } finally {
      isLoading.value = false
    }
  }

  // Fetch single trip
  const fetchTrip = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{
        success: boolean
        data: GroupTrip
      }>(`/api/group-trips/${id}`)

      if (response.success) {
        currentTrip.value = response.data
      }
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Ошибка загрузки поездки'
      console.error('Error fetching group trip:', e)
    } finally {
      isLoading.value = false
    }
  }

  // Purchase ticket
  const purchaseTicket = async (
    tripId: string,
    data: {
      customerName: string
      customerPhone: string
      customerEmail?: string
      telegramUserId?: string
      adultTickets?: number
      childTickets?: number
    }
  ) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{
        success: boolean
        data: GroupTripTicket
        error?: string
      }>(`/api/group-trips/${tripId}/tickets`, {
        method: 'POST',
        body: data
      })

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.error || 'Не удалось купить билет')
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Ошибка покупки билета'
      console.error('Error purchasing ticket:', e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Get trip type label
  const getTripTypeLabel = (type: GroupTrip['type']): string => {
    const labels: Record<GroupTrip['type'], string> = {
      SHORT: '45 минут',
      MEDIUM: '1.5 часа',
      FISHING: 'Рыбалка 3 часа'
    }
    return labels[type] || type
  }

  // Get trip type description
  const getTripTypeDescription = (type: GroupTrip['type']): string => {
    const descriptions: Record<GroupTrip['type'], string> = {
      SHORT: 'Короткая прогулка по морю',
      MEDIUM: 'Прогулка средней продолжительности',
      FISHING: 'Рыбалка в открытом море'
    }
    return descriptions[type] || ''
  }

  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} мин`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) {
      return `${hours} ч`
    }
    return `${hours} ч ${mins} мин`
  }

  // Format price
  const formatPrice = (price: number): string => {
    return price.toLocaleString('ru-RU') + ' ₽'
  }

  return {
    trips: readonly(trips),
    currentTrip: readonly(currentTrip),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchTrips,
    fetchTrip,
    purchaseTicket,
    getTripTypeLabel,
    getTripTypeDescription,
    formatDuration,
    formatPrice
  }
}
