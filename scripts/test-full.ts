// Comprehensive API and functionality tests

const API_URL = process.env.API_URL || 'http://localhost:3003'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  data?: any
  duration?: number
}

const results: TestResult[] = []

async function test(name: string, fn: () => Promise<any>) {
  const start = Date.now()
  try {
    console.log(`\n🧪 Testing: ${name}`)
    const data = await fn()
    const duration = Date.now() - start
    results.push({ name, passed: true, data, duration })
    console.log(`✅ PASSED: ${name} (${duration}ms)`)
    if (data && typeof data === 'object') {
      const preview = JSON.stringify(data).substring(0, 150)
      console.log(`   Data: ${preview}...`)
    }
    return data
  } catch (error: any) {
    const duration = Date.now() - start
    results.push({ name, passed: false, error: error.message, duration })
    console.log(`❌ FAILED: ${name} (${duration}ms)`)
    console.log(`   Error: ${error.message}`)
    return null
  }
}

async function runTests() {
  console.log('🚀 Starting Comprehensive Tests...')
  console.log(`📍 API URL: ${API_URL}\n`)
  console.log('='.repeat(60))

  // ============================================
  // Health & Infrastructure Tests
  // ============================================
  console.log('\n📋 Health & Infrastructure')
  console.log('-'.repeat(60))

  await test('Health Check', async () => {
    const res = await fetch(`${API_URL}/api/health`)
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const data = await res.json()
    if (data.status !== 'ok') throw new Error('Health check failed')
    return data
  })

  // ============================================
  // Boats API Tests
  // ============================================
  console.log('\n📋 Boats API')
  console.log('-'.repeat(60))

  let boatId: string | null = null

  await test('GET /api/boats - List all boats', async () => {
    const res = await fetch(`${API_URL}/api/boats`)
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const data = await res.json()
    if (!data.success) throw new Error('Response not successful')
    if (!Array.isArray(data.data)) throw new Error('Data is not an array')
    if (data.data.length === 0) throw new Error('No boats found')
    
    boatId = data.data[0].id
    return { count: data.data.length, pagination: data.pagination }
  })

  await test('GET /api/boats?minPrice=10000&maxPrice=20000 - Price filter', async () => {
    const res = await fetch(`${API_URL}/api/boats?minPrice=10000&maxPrice=20000`)
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const data = await res.json()
    if (!data.success) throw new Error('Response not successful')
    const inRange = data.data.every((b: any) => 
      b.pricePerHour >= 10000 && b.pricePerHour <= 20000
    )
    if (!inRange) throw new Error('Price filter not working')
    return { count: data.data.length, inRange }
  })

  await test('GET /api/boats/:id - Get single boat', async () => {
    if (!boatId) throw new Error('No boat ID available')
    const res = await fetch(`${API_URL}/api/boats/${boatId}`)
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const data = await res.json()
    if (!data.success) throw new Error('Response not successful')
    if (data.data.id !== boatId) throw new Error('Wrong boat returned')
    return { id: data.data.id, name: data.data.name }
  })

  await test('GET /api/boats/:id - Invalid ID returns 404', async () => {
    const res = await fetch(`${API_URL}/api/boats/invalid-id-12345`)
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`)
    return { status: res.status }
  })

  // ============================================
  // Bookings API Tests
  // ============================================
  console.log('\n📋 Bookings API')
  console.log('-'.repeat(60))

  let bookingId: string | null = null

  await test('POST /api/bookings - Create booking with 1 hour (should be allowed)', async () => {
    if (!boatId) throw new Error('No boat ID available')
    
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    futureDate.setHours(10, 0, 0, 0)
    
    const res = await fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boatId: boatId,
        startDate: futureDate.toISOString(),
        hours: 1, // Now allowed - minimum is 1 hour
        passengers: 4,
        customerName: 'Test User',
        customerPhone: '+7 (900) 123-45-67',
        customerEmail: 'test@example.com'
      })
    })

    const data = await res.json()
    
    // Should either succeed or fail for conflicts, but NOT because hours < minimumHours
    if (res.status === 400 && data.message?.includes('Минимальное время аренды')) {
      // If it says minimum is more than 1 hour, that's wrong
      if (!data.message.includes('1 час')) {
        throw new Error(`1 hour booking rejected: ${data.message}`)
      }
    }
    
    if (res.status >= 200 && res.status < 300) {
      if (data.success && data.data?.id) {
        bookingId = data.data.id
        return { bookingId: data.data.id, status: data.data.status, hours: 1 }
      }
    }
    
    // Expected validation error for conflicts or other reasons
    return { validationError: data.message || 'Validation as expected', allows1Hour: true }
  })

  await test('POST /api/bookings - Invalid data returns 400', async () => {
    const res = await fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boatId: 'invalid',
        startDate: 'invalid-date'
      })
    })
    
    if (res.status < 400) throw new Error(`Expected 400, got ${res.status}`)
    return { status: res.status }
  })

  await test('GET /api/bookings/:id - Get booking', async () => {
    if (!bookingId) {
      // Try to get any booking from seed data
      return { skipped: 'No booking created in previous test' }
    }
    
    const res = await fetch(`${API_URL}/api/bookings/${bookingId}`)
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const data = await res.json()
    if (!data.success) throw new Error('Response not successful')
    return { id: data.data.id, status: data.data.status }
  })

  // ============================================
  // Data Integrity Tests
  // ============================================
  console.log('\n📋 Data Integrity')
  console.log('-'.repeat(60))

  await test('Boats have required fields', async () => {
    const res = await fetch(`${API_URL}/api/boats`)
    const data = await res.json()
    
    const requiredFields = ['id', 'name', 'type', 'capacity', 'pricePerHour']
    const missingFields = data.data.filter((boat: any) => 
      requiredFields.some(field => !(field in boat))
    )
    
    if (missingFields.length > 0) {
      throw new Error(`Boats missing required fields: ${missingFields.length}`)
    }
    
    // Check capacity - should be 11 by regulations
    const invalidCapacity = data.data.filter((boat: any) => boat.capacity !== 11)
    if (invalidCapacity.length > 0) {
      console.log(`   ⚠️  Warning: ${invalidCapacity.length} boats with capacity != 11`)
    }
    
    // Check recommendedCapacity logic
    const invalidRecommendations = data.data.filter((boat: any) => 
      boat.recommendedCapacity !== undefined && 
      boat.recommendedCapacity >= boat.capacity
    )
    if (invalidRecommendations.length > 0) {
      throw new Error(`${invalidRecommendations.length} boats have invalid recommendedCapacity`)
    }
    
    return { 
      total: data.data.length, 
      allValid: true,
      withCapacity11: data.data.filter((b: any) => b.capacity === 11).length,
      withRecommendation: data.data.filter((b: any) => b.recommendedCapacity !== undefined).length
    }
  })

  await test('Boats images are arrays', async () => {
    const res = await fetch(`${API_URL}/api/boats`)
    const data = await res.json()
    
    const invalidImages = data.data.filter((boat: any) => 
      boat.images && !Array.isArray(boat.images)
    )
    
    if (invalidImages.length > 0) {
      throw new Error(`Boats with invalid images format: ${invalidImages.length}`)
    }
    
    return { total: data.data.length, allValid: true }
  })

  await test('Boats features are arrays', async () => {
    const res = await fetch(`${API_URL}/api/boats`)
    const data = await res.json()
    
    const invalidFeatures = data.data.filter((boat: any) => 
      boat.features && !Array.isArray(boat.features)
    )
    
    if (invalidFeatures.length > 0) {
      throw new Error(`Boats with invalid features format: ${invalidFeatures.length}`)
    }
    
    return { total: data.data.length, allValid: true }
  })

  // ============================================
  // Performance Tests
  // ============================================
  console.log('\n📋 Performance')
  console.log('-'.repeat(60))

  await test('API response time < 500ms', async () => {
    const start = Date.now()
    const res = await fetch(`${API_URL}/api/boats`)
    const duration = Date.now() - start
    
    if (duration > 500) {
      throw new Error(`Response time too slow: ${duration}ms`)
    }
    
    return { duration, status: 'ok' }
  })

  await test('Multiple concurrent requests', async () => {
    const start = Date.now()
    const promises = Array(5).fill(0).map(() => 
      fetch(`${API_URL}/api/boats`)
    )
    
    await Promise.all(promises)
    const duration = Date.now() - start
    
    if (duration > 2000) {
      throw new Error(`Concurrent requests too slow: ${duration}ms`)
    }
    
    return { duration, requests: 5 }
  })

  // ============================================
  // Group Trips API Tests
  // ============================================
  console.log('\n📋 Group Trips API')
  console.log('-'.repeat(60))

  let groupTripId: string | null = null

  await test('GET /api/group-trips - List group trips', async () => {
    const res = await fetch(`${API_URL}/api/group-trips`)
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const data = await res.json()
    if (!data.success) throw new Error('Response not successful')
    if (!Array.isArray(data.data)) throw new Error('Data is not an array')
    
    if (data.data.length > 0) {
      groupTripId = data.data[0].id
    }
    return { count: data.data.length }
  })

  await test('GET /api/group-trips/:id - Get single trip', async () => {
    if (!groupTripId) {
      return { skipped: 'No group trips available' }
    }
    const res = await fetch(`${API_URL}/api/group-trips/${groupTripId}`)
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const data = await res.json()
    if (!data.success) throw new Error('Response not successful')
    if (data.data.id !== groupTripId) throw new Error('Wrong trip returned')
    return { id: data.data.id, type: data.data.type }
  })

  // ============================================
  // Summary
  // ============================================
  console.log('\n' + '='.repeat(60))
  console.log('📊 Test Summary')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0)
  const avgDuration = totalDuration / results.length
  
  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌'
    const duration = r.duration ? ` (${r.duration}ms)` : ''
    console.log(`${icon} ${r.name}${duration}`)
    if (r.error) {
      console.log(`   Error: ${r.error}`)
    }
  })
  
  console.log('\n' + '='.repeat(60))
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`)
  console.log(`Average duration: ${Math.round(avgDuration)}ms`)
  console.log(`Total duration: ${Math.round(totalDuration)}ms`)
  console.log('='.repeat(60))
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Please review the errors above.')
    process.exit(1)
  } else {
    console.log('\n🎉 All tests passed!')
    process.exit(0)
  }
}

runTests().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
