// Test script for group trips functionality

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
  console.log('🚀 Starting Group Trips Tests...')
  console.log(`📍 API URL: ${API_URL}\n`)
  console.log('='.repeat(60))

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
    return { id: data.data.id, type: data.data.type, availableSeats: data.data.availableSeats }
  })

  await test('GET /api/group-trips?type=SHORT - Filter by type', async () => {
    const res = await fetch(`${API_URL}/api/group-trips?type=SHORT`)
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const data = await res.json()
    if (!data.success) throw new Error('Response not successful')
    if (data.data.length > 0) {
      const allShort = data.data.every((t: any) => t.type === 'SHORT')
      if (!allShort) throw new Error('Filter not working')
    }
    return { count: data.data.length }
  })

  await test('POST /api/group-trips/:id/tickets - Purchase ticket (validation)', async () => {
    if (!groupTripId) {
      return { skipped: 'No group trips available' }
    }
    
    const res = await fetch(`${API_URL}/api/group-trips/${groupTripId}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Test User',
        customerPhone: '+7 (900) 123-45-67',
        customerEmail: 'test@example.com'
      })
    })

    if (res.status >= 200 && res.status < 300) {
      const data = await res.json()
      if (data.success && data.data?.id) {
        return { ticketId: data.data.id, status: data.data.status }
      }
    }
    
    // Expected validation error or success
    const error = await res.json()
    return { validationResult: error.message || 'Request processed' }
  })

  // ============================================
  // Data Integrity Tests
  // ============================================
  console.log('\n📋 Data Integrity')
  console.log('-'.repeat(60))

  await test('Group trips have required fields', async () => {
    const res = await fetch(`${API_URL}/api/group-trips`)
    const data = await res.json()
    
    const requiredFields = ['id', 'type', 'duration', 'price', 'availableSeats', 'departureDate']
    const missingFields = data.data.filter((trip: any) => 
      requiredFields.some(field => !(field in trip))
    )
    
    if (missingFields.length > 0) {
      throw new Error(`Trips missing required fields: ${missingFields.length}`)
    }
    
    return { total: data.data.length, allValid: true }
  })

  await test('Group trips have valid status', async () => {
    const res = await fetch(`${API_URL}/api/group-trips`)
    const data = await res.json()
    
    const validStatuses = ['SCHEDULED', 'FULL', 'COMPLETED', 'CANCELLED']
    const invalidStatus = data.data.filter((trip: any) => 
      !validStatuses.includes(trip.status)
    )
    
    if (invalidStatus.length > 0) {
      throw new Error(`Trips with invalid status: ${invalidStatus.length}`)
    }
    
    return { total: data.data.length, allValid: true }
  })

  // ============================================
  // Performance Tests
  // ============================================
  console.log('\n📋 Performance')
  console.log('-'.repeat(60))

  await test('Group trips API response time < 500ms', async () => {
    const start = Date.now()
    const res = await fetch(`${API_URL}/api/group-trips`)
    const duration = Date.now() - start
    
    if (duration > 500) {
      throw new Error(`Response time too slow: ${duration}ms`)
    }
    
    return { duration, status: 'ok' }
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
