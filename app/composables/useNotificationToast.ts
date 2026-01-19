// Toast notification composable wrapper for Nuxt UI

export interface ToastOptions {
  title?: string
  description?: string
  timeout?: number
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info'
  icon?: string
}

export function useNotificationToast() {
  // Use Nuxt UI's built-in toast
  const toast = useToast() as any

  const show = (options: ToastOptions | string) => {
    if (typeof options === 'string') {
      return toast.add({
        title: options,
        timeout: 3000
      })
    }

    return toast.add({
      title: options.title || 'Уведомление',
      description: options.description,
      timeout: options.timeout || 3000,
      color: options.color || 'primary',
      icon: options.icon
    })
  }

  const success = (message: string, description?: string) => {
    return show({
      title: message,
      description,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
  }

  const error = (message: string, description?: string) => {
    return show({
      title: message,
      description,
      color: 'error',
      icon: 'i-heroicons-exclamation-circle',
      timeout: 5000
    })
  }

  const warning = (message: string, description?: string) => {
    return show({
      title: message,
      description,
      color: 'warning',
      icon: 'i-heroicons-exclamation-triangle'
    })
  }

  const info = (message: string, description?: string) => {
    return show({
      title: message,
      description,
      color: 'info',
      icon: 'i-heroicons-information-circle'
    })
  }

  return {
    show,
    success,
    error,
    warning,
    info
  }
}
