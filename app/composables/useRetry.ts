// Retry composable for failed API requests

export interface RetryOptions {
  maxRetries?: number
  delay?: number
  backoff?: 'linear' | 'exponential'
  onRetry?: (attempt: number, error: Error) => void
}

export function useRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 'exponential',
    onRetry
  } = options

  let attempt = 0

  const execute = async (): Promise<T> => {
    try {
      return await fn()
    } catch (error) {
      attempt++

      if (attempt > maxRetries) {
        throw error
      }

      if (onRetry) {
        onRetry(attempt, error as Error)
      }

      // Calculate delay with backoff
      const currentDelay = backoff === 'exponential'
        ? delay * Math.pow(2, attempt - 1)
        : delay * attempt

      await new Promise(resolve => setTimeout(resolve, currentDelay))

      return execute()
    }
  }

  return execute()
}
