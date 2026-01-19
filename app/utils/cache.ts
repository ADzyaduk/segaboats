// Simple in-memory cache for API responses

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, ttl: number = 60000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    const age = Date.now() - entry.timestamp
    if (age > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    const age = Date.now() - entry.timestamp
    if (age > entry.ttl) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export const cache = new SimpleCache()

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup()
  }, 5 * 60 * 1000)
}
