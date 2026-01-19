// Debounce composable for performance optimization

export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }) as T

  // Cleanup function
  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  // Add cancel method to function
  ;(debounced as any).cancel = cancel

  return debounced
}
