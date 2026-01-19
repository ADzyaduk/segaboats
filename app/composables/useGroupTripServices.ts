// Composable for group trip services operations

export interface GroupTripService {
  id: string
  type: 'SHORT' | 'MEDIUM' | 'FISHING'
  duration: number
  price: number
  title: string
  description?: string
  image?: string
  isActive: boolean
  // Note: createdAt/updatedAt removed as services are now static
}

export function useGroupTripServices() {
  const services = ref<GroupTripService[]>([])
  const currentService = ref<GroupTripService | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Fetch all services
  const fetchServices = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{
        success: boolean
        data: GroupTripService[]
      }>('/api/group-trip-services')

      if (response.success) {
        services.value = response.data
      }
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Ошибка загрузки услуг'
      console.error('Error fetching group trip services:', e)
    } finally {
      isLoading.value = false
    }
  }

  // Fetch single service by type
  const fetchService = async (type: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{
        success: boolean
        data: GroupTripService
      }>(`/api/group-trip-services/${type}`)

      if (response.success) {
        currentService.value = response.data
      }
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Ошибка загрузки услуги'
      console.error('Error fetching group trip service:', e)
    } finally {
      isLoading.value = false
    }
  }

  // Get service type label
  const getServiceTypeLabel = (type: GroupTripService['type']): string => {
    const labels: Record<GroupTripService['type'], string> = {
      SHORT: '45 минут',
      MEDIUM: '1.5 часа',
      FISHING: 'Рыбалка 3 часа'
    }
    return labels[type] || type
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
    services: readonly(services),
    currentService: readonly(currentService),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchServices,
    fetchService,
    getServiceTypeLabel,
    formatDuration,
    formatPrice
  }
}
