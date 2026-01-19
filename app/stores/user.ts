import { defineStore } from 'pinia'

interface User {
  id: string
  telegramId: string
  firstName?: string
  lastName?: string
  username?: string
  role: 'USER' | 'ADMIN' | 'OWNER'
  bookingsCount: number
}

interface UserState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  }),

  getters: {
    // Get full name
    fullName: (state): string => {
      if (!state.user) return ''
      return [state.user.firstName, state.user.lastName]
        .filter(Boolean)
        .join(' ') || state.user.username || 'Пользователь'
    },

    // Check if admin
    isAdmin: (state): boolean => {
      return state.user?.role === 'ADMIN'
    },

    // Check if owner
    isOwner: (state): boolean => {
      return state.user?.role === 'OWNER' || state.user?.role === 'ADMIN'
    }
  },

  actions: {
    // Authenticate with Telegram
    async authenticateTelegram(initData: string) {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{
          success: boolean
          data: User
        }>('/api/telegram/auth', {
          method: 'POST',
          body: { initData }
        })

        if (response.success) {
          this.user = response.data
          this.isAuthenticated = true
        }
      } catch (e: any) {
        this.error = e.data?.message || e.message || 'Ошибка аутентификации'
        console.error('Authentication error:', e)
      } finally {
        this.isLoading = false
      }
    },

    // Set user directly
    setUser(user: User) {
      this.user = user
      this.isAuthenticated = true
    },

    // Clear user session
    logout() {
      this.user = null
      this.isAuthenticated = false
      this.error = null
    },

    // Update user info
    updateUser(updates: Partial<User>) {
      if (this.user) {
        this.user = { ...this.user, ...updates }
      }
    }
  },

  // Persist state (optional, for web version)
  persist: {
    key: 'boats2026-user',
    pick: ['user', 'isAuthenticated']
  }
})
