// Performance monitoring utilities

export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 100

  startMeasure(name: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.recordMetric(name, duration)
    }
  }

  recordMetric(name: string, duration: number) {
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now()
    })

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`[Performance] Slow operation: ${name} took ${duration.toFixed(2)}ms`)
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getAverageDuration(name: string): number {
    const relevantMetrics = this.metrics.filter(m => m.name === name)
    if (relevantMetrics.length === 0) return 0
    
    const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0)
    return total / relevantMetrics.length
  }

  clear() {
    this.metrics = []
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Composable for performance monitoring
export function usePerformance() {
  const measure = (name: string) => {
    return performanceMonitor.startMeasure(name)
  }

  return {
    measure,
    getMetrics: () => performanceMonitor.getMetrics(),
    getAverage: (name: string) => performanceMonitor.getAverageDuration(name),
    clear: () => performanceMonitor.clear()
  }
}
