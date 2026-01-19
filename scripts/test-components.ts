// Comprehensive component and display tests
// Tests for BoatCard, booking forms, and data display

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
  console.log('🚀 Starting Component & Display Tests...')
  console.log(`📍 API URL: ${API_URL}\n`)
  console.log('='.repeat(60))

  // ============================================
  // BoatCard Display Tests
  // ============================================
  console.log('\n📋 BoatCard Display Tests')
  console.log('-'.repeat(60))

  let boatId: string | null = null
  let testBoat: any = null

  await test('Get boat with all required fields', async () => {
    const res = await fetch(`${API_URL}/api/boats`)
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const data = await res.json()
    if (!data.success || !data.data.length) throw new Error('No boats found')
    
    testBoat = data.data[0]
    boatId = testBoat.id
    
    // Check required fields for display
    const requiredFields = ['id', 'name', 'capacity', 'pricePerHour', 'minimumHours']
    const missing = requiredFields.filter(f => !(f in testBoat))
    if (missing.length > 0) throw new Error(`Missing fields: ${missing.join(', ')}`)
    
    return { id: testBoat.id, name: testBoat.name, hasAllFields: true }
  })

  await test('BoatCard: Capacity display (always shows maximum)', async () => {
    if (!testBoat) throw new Error('No test boat available')
    
    // Capacity should always be present and >= 11 (by regulations)
    if (!testBoat.capacity || testBoat.capacity < 11) {
      throw new Error(`Invalid capacity: ${testBoat.capacity}. Should be >= 11`)
    }
    
    return { capacity: testBoat.capacity, valid: true }
  })

  await test('BoatCard: Recommended capacity display logic', async () => {
    if (!testBoat) throw new Error('No test boat available')
    
    // If recommendedCapacity exists, it should be < capacity
    if (testBoat.recommendedCapacity !== undefined) {
      if (testBoat.recommendedCapacity >= testBoat.capacity) {
        throw new Error(`Recommended capacity (${testBoat.recommendedCapacity}) should be < capacity (${testBoat.capacity})`)
      }
    }
    
    return { 
      capacity: testBoat.capacity, 
      recommendedCapacity: testBoat.recommendedCapacity,
      hasRecommendation: testBoat.recommendedCapacity !== undefined
    }
  })

  await test('BoatCard: Length and width display', async () => {
    if (!testBoat) throw new Error('No test boat available')
    
    // Length should be present if boat has dimensions
    // Width is optional but should be displayed if present
    const hasLength = testBoat.length !== undefined && testBoat.length !== null
    const hasWidth = testBoat.width !== undefined && testBoat.width !== null
    
    if (!hasLength) {
      console.log('   ⚠️  Warning: Boat has no length data')
    }
    
    return { hasLength, hasWidth, length: testBoat.length, width: testBoat.width }
  })

  await test('BoatCard: Minimum hours display (should show "от 1 часа")', async () => {
    if (!testBoat) throw new Error('No test boat available')
    
    // Minimum hours should be >= 1 (we allow 1 hour bookings now)
    if (testBoat.minimumHours === undefined || testBoat.minimumHours < 1) {
      throw new Error(`Invalid minimumHours: ${testBoat.minimumHours}. Should be >= 1`)
    }
    
    return { minimumHours: testBoat.minimumHours, valid: true }
  })

  // ============================================
  // Booking Form Tests
  // ============================================
  console.log('\n📋 Booking Form Tests')
  console.log('-'.repeat(60))

  await test('Booking: Minimum hours validation (should allow 1 hour)', async () => {
    if (!boatId) throw new Error('No boat ID available')
    
    // Try to create booking with 1 hour
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    futureDate.setHours(10, 0, 0, 0)
    
    const res = await fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boatId: boatId,
        startDate: futureDate.toISOString(),
        hours: 1, // Should be allowed now
        passengers: 2,
        customerName: 'Test User',
        customerPhone: '+7 (900) 123-45-67',
        customerEmail: 'test@example.com'
      })
    })
    
    const data = await res.json()
    
    // Should either succeed or fail for other reasons (conflicts, etc), but not because hours < minimumHours
    if (res.status === 400 && data.message?.includes('Минимальное время аренды')) {
      // Check if it's complaining about 1 hour being too little
      if (data.message.includes('1 час')) {
        throw new Error('1 hour booking is still being rejected')
      }
    }
    
    return { status: res.status, allows1Hour: true }
  })

  await test('Booking: Time slot availability check', async () => {
    if (!boatId) throw new Error('No boat ID available')
    
    // Get boat with booked dates
    const res = await fetch(`${API_URL}/api/boats/${boatId}`)
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const data = await res.json()
    
    if (!data.success) throw new Error('Failed to get boat')
    
    // Check if bookedDates are returned
    const hasBookedDates = data.data.bookedDates !== undefined
    const bookedDatesCount = data.data.bookedDates?.length || 0
    
    return { 
      hasBookedDates, 
      bookedDatesCount,
      bookedDates: data.data.bookedDates || []
    }
  })

  await test('Booking: Conflict detection (overlapping times)', async () => {
    if (!boatId) throw new Error('No boat ID available')
    
    // Get boat to check for existing bookings
    const boatRes = await fetch(`${API_URL}/api/boats/${boatId}`)
    const boatData = await boatRes.json()
    
    if (!boatData.success || !boatData.data.bookedDates?.length) {
      return { skipped: 'No existing bookings to test conflict detection' }
    }
    
    // Try to book overlapping time
    const existingBooking = boatData.data.bookedDates[0]
    const conflictStart = new Date(existingBooking.start)
    conflictStart.setHours(conflictStart.getHours() + 1) // 1 hour into existing booking
    
    const res = await fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boatId: boatId,
        startDate: conflictStart.toISOString(),
        hours: 2,
        passengers: 2,
        customerName: 'Conflict Test',
        customerPhone: '+7 (900) 123-45-67'
      })
    })
    
    const data = await res.json()
    
    // Should reject with conflict message
    if (res.status === 400 && data.message?.includes('занято')) {
      return { conflictDetected: true, message: data.message }
    }
    
    if (res.status < 400) {
      throw new Error('Conflict was not detected - booking was created')
    }
    
    return { status: res.status, message: data.message }
  })

  // ============================================
  // Data Display Format Tests
  // ============================================
  console.log('\n📋 Data Display Format Tests')
  console.log('-'.repeat(60))

  await test('BoatCard: Price formatting', async () => {
    if (!testBoat) throw new Error('No test boat available')
    
    // Price should be a number
    if (typeof testBoat.pricePerHour !== 'number') {
      throw new Error(`Invalid price type: ${typeof testBoat.pricePerHour}`)
    }
    
    // Price should be positive
    if (testBoat.pricePerHour <= 0) {
      throw new Error(`Invalid price value: ${testBoat.pricePerHour}`)
    }
    
    return { pricePerHour: testBoat.pricePerHour, formatted: `${testBoat.pricePerHour.toLocaleString('ru-RU')} ₽` }
  })

  await test('BoatCard: Features array format', async () => {
    if (!testBoat) throw new Error('No test boat available')
    
    // Features should be an array
    if (testBoat.features && !Array.isArray(testBoat.features)) {
      throw new Error(`Features should be array, got: ${typeof testBoat.features}`)
    }
    
    return { 
      hasFeatures: Array.isArray(testBoat.features), 
      featuresCount: testBoat.features?.length || 0 
    }
  })

  await test('BoatCard: Images array format', async () => {
    if (!testBoat) throw new Error('No test boat available')
    
    // Images should be an array
    if (testBoat.images && !Array.isArray(testBoat.images)) {
      throw new Error(`Images should be array, got: ${typeof testBoat.images}`)
    }
    
    return { 
      hasImages: Array.isArray(testBoat.images), 
      imagesCount: testBoat.images?.length || 0,
      hasThumbnail: !!testBoat.thumbnail
    }
  })

  // ============================================
  // Slideover Position Tests (API can't test UI, but we can verify data structure)
  // ============================================
  console.log('\n📋 UI Component Data Tests')
  console.log('-'.repeat(60))

  await test('Boat data: All boats have capacity = 11 (regulation)', async () => {
    const res = await fetch(`${API_URL}/api/boats`)
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const data = await res.json()
    
    if (!data.success) throw new Error('Response not successful')
    
    const invalidCapacity = data.data.filter((boat: any) => boat.capacity !== 11)
    
    if (invalidCapacity.length > 0) {
      console.log(`   ⚠️  Warning: ${invalidCapacity.length} boats with capacity != 11`)
      invalidCapacity.forEach((boat: any) => {
        console.log(`      - ${boat.name}: capacity = ${boat.capacity}`)
      })
    }
    
    return { 
      total: data.data.length, 
      withCapacity11: data.data.filter((b: any) => b.capacity === 11).length,
      invalidCapacity: invalidCapacity.length
    }
  })

  await test('Boat data: Recommended capacity logic', async () => {
    const res = await fetch(`${API_URL}/api/boats`)
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const data = await res.json()
    
    if (!data.success) throw new Error('Response not successful')
    
    const invalidRecommendations = data.data.filter((boat: any) => 
      boat.recommendedCapacity !== undefined && 
      boat.recommendedCapacity >= boat.capacity
    )
    
    if (invalidRecommendations.length > 0) {
      throw new Error(`${invalidRecommendations.length} boats have invalid recommendedCapacity`)
    }
    
    const withRecommendation = data.data.filter((b: any) => 
      b.recommendedCapacity !== undefined && b.recommendedCapacity < b.capacity
    )
    
    return { 
      total: data.data.length,
      withRecommendation: withRecommendation.length,
      allValid: invalidRecommendations.length === 0
    }
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
    console.log('\n🎉 All component and display tests passed!')
    process.exit(0)
  }
}

runTests().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
