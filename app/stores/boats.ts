import { defineStore } from 'pinia'
import type { Boat, BoatsFilter } from '~/composables/useBoats'
import { cache } from '~/utils/cache'

interface BoatsState {
  boats: Boat[]
  currentBoat: Boat | null
  filters: BoatsFilter
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  isLoading: boolean
  error: string | null
}

export const useBoatsStore = defineStore('boats', {
  state: (): BoatsState => ({
    boats: [],
    currentBoat: null,
    filters: {
      page: 1,
      limit: 10
    },
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    },
    isLoading: false,
    error: null
  }),

  getters: {
    // Get boats filtered by type
    boatsByType: (state) => (type: Boat['type']) => {
      return state.boats.filter(boat => boat.type === type)
    },

    // Get available boats count
    availableCount: (state): number => {
      return state.pagination.total
    },

    // Check if has more pages
    hasMorePages: (state): boolean => {
      return state.pagination.page < state.pagination.totalPages
    },

    // Get price range
    priceRange: (state): { min: number; max: number } => {
      if (state.boats.length === 0) {
        return { min: 0, max: 0 }
      }
      const prices = state.boats.map(b => b.pricePerHour)
      return {
        min: Math.min(...prices),
        max: Math.max(...prices)
      }
    }
  },

  actions: {
    // Fetch boats from API
    async fetchBoats(filters?: BoatsFilter) {
      this.isLoading = true
      this.error = null

      if (filters) {
        this.filters = { ...this.filters, ...filters }
      }

      try {
        const query = new URLSearchParams()
        
        if (this.filters.minPrice) query.set('minPrice', this.filters.minPrice.toString())
        if (this.filters.maxPrice) query.set('maxPrice', this.filters.maxPrice.toString())
        if (this.filters.page) query.set('page', this.filters.page.toString())
        if (this.filters.limit) query.set('limit', this.filters.limit.toString())

        const response = await $fetch<{
          success: boolean
          data: Boat[]
          pagination: typeof this.pagination
        }>(`/api/boats?${query.toString()}`)

        if (response.success) {
          this.boats = response.data
          this.pagination = response.pagination
        }
      } catch (e: any) {
        this.error = e.data?.message || e.message || 'Ошибка загрузки яхт'
        console.error('Error fetching boats:', e)
      } finally {
        this.isLoading = false
      }
    },

    // Fetch single boat
    async fetchBoat(id: string) {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          data: Boat
        }>(`/api/boats/${id}`)

        if (response.success) {
          this.currentBoat = response.data
        }
      } catch (e: any) {
        this.error = e.data?.message || e.message || 'Ошибка загрузки яхты'
        console.error('Error fetching boat:', e)
      } finally {
        this.isLoading = false
      }
    },

    // Load more boats
    async loadMore() {
      if (!this.hasMorePages || this.isLoading) return

      await this.fetchBoats({
        ...this.filters,
        page: this.pagination.page + 1
      })
    },

    // Set filter and refetch
    async setFilter(key: keyof BoatsFilter, value: any) {
      this.filters[key] = value
      this.filters.page = 1 // Reset to first page
      await this.fetchBoats()
    },

    // Clear filters
    async clearFilters() {
      this.filters = { page: 1, limit: 10 }
      await this.fetchBoats()
    },

    // Clear current boat
    clearCurrentBoat() {
      this.currentBoat = null
    }
  }
})
