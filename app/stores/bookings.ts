import { defineStore } from 'pinia'
import type { Booking, CreateBookingData } from '~/composables/useBookings'

interface BookingsState {
  bookings: Booking[]
  currentBooking: Booking | null
  draftBooking: Partial<CreateBookingData>
  isLoading: boolean
  error: string | null
}

export const useBookingsStore = defineStore('bookings', {
  state: (): BookingsState => ({
    bookings: [],
    currentBooking: null,
    draftBooking: {},
    isLoading: false,
    error: null
  }),

  getters: {
    // Get active bookings
    activeBookings: (state): Booking[] => {
      return state.bookings.filter(b => 
        ['PENDING', 'CONFIRMED', 'PAID'].includes(b.status)
      )
    },

    // Get upcoming bookings
    upcomingBookings: (state): Booking[] => {
      const now = new Date()
      return state.bookings
        .filter(b => new Date(b.startDate) > now && b.status !== 'CANCELLED')
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    },

    // Check if draft is valid
    isDraftValid: (state): boolean => {
      const d = state.draftBooking
      return !!(
        d.boatId &&
        d.startDate &&
        d.hours &&
        d.passengers &&
        d.customerName &&
        d.customerPhone
      )
    }
  },

  actions: {
    // Create booking
    async createBooking() {
      if (!this.isDraftValid) {
        this.error = 'Заполните все обязательные поля'
        return null
      }

      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          data: Booking
        }>('/api/bookings', {
          method: 'POST',
          body: this.draftBooking
        })

        if (response.success) {
          this.currentBooking = response.data
          this.bookings.push(response.data)
          this.clearDraft()
          return response.data
        }
      } catch (e: any) {
        this.error = e.data?.message || e.message || 'Ошибка создания бронирования'
        console.error('Error creating booking:', e)
      } finally {
        this.isLoading = false
      }

      return null
    },

    // Fetch booking by ID
    async fetchBooking(id: string) {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          data: Booking
        }>(`/api/bookings/${id}`)

        if (response.success) {
          this.currentBooking = response.data
        }
      } catch (e: any) {
        this.error = e?.data?.message || e?.message || 'Ошибка загрузки бронирования'
        console.error('Error fetching booking:', e)
      } finally {
        this.isLoading = false
      }
    },

    // Update draft booking
    updateDraft(data: Partial<CreateBookingData>) {
      this.draftBooking = { ...this.draftBooking, ...data }
    },

    // Set boat for booking
    setBoat(boatId: string) {
      this.draftBooking.boatId = boatId
    },

    // Set date and time
    setDateTime(startDate: string) {
      this.draftBooking.startDate = startDate
    },

    // Set duration
    setDuration(hours: number) {
      this.draftBooking.hours = hours
    },

    // Set passengers
    setPassengers(count: number) {
      this.draftBooking.passengers = count
    },

    // Set customer info
    setCustomerInfo(info: { name: string; phone: string; email?: string; notes?: string }) {
      this.draftBooking.customerName = info.name
      this.draftBooking.customerPhone = info.phone
      this.draftBooking.customerEmail = info.email
      this.draftBooking.customerNotes = info.notes
    },

    // Clear draft
    clearDraft() {
      this.draftBooking = {}
    },

    // Clear current booking
    clearCurrentBooking() {
      this.currentBooking = null
    },

    // Clear error
    clearError() {
      this.error = null
    }
  }
})
