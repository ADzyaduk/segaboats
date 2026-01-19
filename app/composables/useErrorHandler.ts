// Error handling composable

import { useNotificationToast } from './useNotificationToast'

export interface ErrorInfo {
  message: string
  code?: string | number
  details?: any
}

export function useErrorHandler() {
  const toast = useNotificationToast()

  const handleError = (error: any, context?: string) => {
    const errorInfo: ErrorInfo = {
      message: error?.message || error?.data?.message || 'Произошла ошибка',
      code: error?.statusCode || error?.code,
      details: error?.data || error
    }

    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context || 'Error'}]`, errorInfo)
    }

    // Show user-friendly message
    const userMessage = getErrorMessage(errorInfo)
    toast.error('Ошибка', userMessage)

    return errorInfo
  }

  const getErrorMessage = (error: ErrorInfo): string => {
    // Map common error codes to user-friendly messages
    if (error.code === 404) {
      return 'Ресурс не найден'
    }
    if (error.code === 403) {
      return 'Доступ запрещен'
    }
    if (error.code === 401) {
      return 'Требуется авторизация'
    }
    if (error.code === 400) {
      return error.message || 'Некорректные данные'
    }
    if (error.code >= 500) {
      return 'Ошибка сервера. Попробуйте позже'
    }

    return error.message || 'Произошла непредвиденная ошибка'
  }

  const handleNetworkError = (error: any) => {
    if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
      return handleError({
        message: 'Проблема с подключением к интернету',
        code: 'NETWORK_ERROR'
      }, 'Network')
    }
    return handleError(error, 'Network')
  }

  return {
    handleError,
    handleNetworkError,
    getErrorMessage
  }
}
