// Composable for Telegram WebApp integration

interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    query_id?: string
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
      is_premium?: boolean
    }
    auth_date: number
    hash: string
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
    secondary_bg_color?: string
  }
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  isClosingConfirmationEnabled: boolean
  BackButton: {
    isVisible: boolean
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
  }
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText: (text: string) => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    show: () => void
    hide: () => void
    enable: () => void
    disable: () => void
    showProgress: (leaveActive?: boolean) => void
    hideProgress: () => void
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  close: () => void
  expand: () => void
  ready: () => void
  sendData: (data: string) => void
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void
  openTelegramLink: (url: string) => void
  showPopup: (params: {
    title?: string
    message: string
    buttons?: Array<{
      id?: string
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'
      text?: string
    }>
  }, callback?: (buttonId: string) => void) => void
  showAlert: (message: string, callback?: () => void) => void
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void
  enableClosingConfirmation: () => void
  disableClosingConfirmation: () => void
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export function useTelegram() {
  const isTelegram = ref(false)
  const isReady = ref(false)
  const webApp = ref<TelegramWebApp | null>(null)
  const user = ref<TelegramWebApp['initDataUnsafe']['user'] | null>(null)
  const colorScheme = ref<'light' | 'dark'>('light')
  const themeParams = ref<TelegramWebApp['themeParams']>({})

  // Initialize on mount
  onMounted(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      webApp.value = window.Telegram.WebApp
      isTelegram.value = true
      user.value = webApp.value.initDataUnsafe.user || null
      colorScheme.value = webApp.value.colorScheme
      themeParams.value = webApp.value.themeParams

      // Signal that the app is ready
      webApp.value.ready()
      webApp.value.expand()
      isReady.value = true
    }
  })

  // Get init data for authentication
  const getInitData = () => {
    return webApp.value?.initData || ''
  }

  // Authenticate with backend
  const authenticate = async () => {
    const initData = getInitData()
    if (!initData) return null

    try {
      const { data } = await useFetch('/api/telegram/auth', {
        method: 'POST',
        body: { initData }
      })
      return data.value
    } catch (error) {
      console.error('Telegram auth error:', error)
      return null
    }
  }

  // Main button helpers
  const showMainButton = (text: string, callback: () => void) => {
    if (!webApp.value) return

    webApp.value.MainButton.setText(text)
    webApp.value.MainButton.onClick(callback)
    webApp.value.MainButton.show()
  }

  const hideMainButton = () => {
    webApp.value?.MainButton.hide()
  }

  const setMainButtonLoading = (loading: boolean) => {
    if (!webApp.value) return

    if (loading) {
      webApp.value.MainButton.showProgress()
    } else {
      webApp.value.MainButton.hideProgress()
    }
  }

  // Back button helpers
  const showBackButton = (callback: () => void) => {
    if (!webApp.value) return

    webApp.value.BackButton.onClick(callback)
    webApp.value.BackButton.show()
  }

  const hideBackButton = () => {
    webApp.value?.BackButton.hide()
  }

  // Haptic feedback
  const haptic = {
    impact: (style: 'light' | 'medium' | 'heavy' = 'medium') => {
      webApp.value?.HapticFeedback.impactOccurred(style)
    },
    notification: (type: 'success' | 'warning' | 'error') => {
      webApp.value?.HapticFeedback.notificationOccurred(type)
    },
    selection: () => {
      webApp.value?.HapticFeedback.selectionChanged()
    }
  }

  // UI helpers
  const showAlert = (message: string): Promise<void> => {
    return new Promise((resolve) => {
      if (webApp.value) {
        webApp.value.showAlert(message, resolve)
      } else {
        alert(message)
        resolve()
      }
    })
  }

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (webApp.value) {
        webApp.value.showConfirm(message, resolve)
      } else {
        resolve(confirm(message))
      }
    })
  }

  const openLink = (url: string) => {
    if (webApp.value) {
      webApp.value.openLink(url)
    } else {
      window.open(url, '_blank')
    }
  }

  const close = () => {
    webApp.value?.close()
  }

  return {
    // State
    isTelegram: readonly(isTelegram),
    isReady: readonly(isReady),
    user: readonly(user),
    colorScheme: readonly(colorScheme),
    themeParams: readonly(themeParams),
    webApp: readonly(webApp),

    // Methods
    getInitData,
    authenticate,
    showMainButton,
    hideMainButton,
    setMainButtonLoading,
    showBackButton,
    hideBackButton,
    haptic,
    showAlert,
    showConfirm,
    openLink,
    close
  }
}
