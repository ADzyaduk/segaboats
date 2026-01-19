// Intersection Observer composable for lazy loading

export function useIntersectionObserver(
  target: Ref<Element | null>,
  callback: (isIntersecting: boolean) => void,
  options?: IntersectionObserverInit
) {
  const isIntersecting = ref(false)

  onMounted(() => {
    if (!target.value) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting.value = entry.isIntersecting
          callback(entry.isIntersecting)
        })
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options
      }
    )

    observer.observe(target.value)

    onUnmounted(() => {
      if (target.value) {
        observer.unobserve(target.value)
      }
      observer.disconnect()
    })
  })

  return { isIntersecting }
}
