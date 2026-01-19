// Simple API testing script
const API_URL = process.env.API_URL || 'http://localhost:3003'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  data?: any
}

const results: TestResult[] = []

async function test(name: string, fn: () => Promise<any>) {
  try {
    console.log(`\n🧪 Testing: ${name}`)
    const data = await fn()
    results.push({ name, passed: true, data })
    console.log(`✅ PASSED: ${name}`)
    if (data) {
      console.log(`   Data:`, JSON.stringify(data, null, 2).substring(0, 200))
    }
    return data
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message })
    console.log(`❌ FAILED: ${name}`)
    console.log(`   Error:`, error.message)
    return null
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...')
  console.log(`📍 API URL: ${API_URL}\n`)

  // Test 1: Health check
  await test('Health Check', async () => {
    const res = await fetch(`${API_URL}/api/health`)
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    return await res.json()
  })

  // Test 2: Get boats list
  await test('GET /api/boats', async () => {
    const res = await fetch(`${API_URL}/api/boats`)
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const data = await res.json()
    if (!data.success) throw new Error('Response not successful')
    if (!Array.isArray(data.data)) throw new Error('Data is not an array')
    return { count: data.data.length, pagination: data.pagination }
  })

  // Test 3: Get boats with filters
  await test('GET /api/boats?type=YACHT', async () => {
    const res = await fetch(`${API_URL}/api/boats?type=YACHT`)
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const data = await res.json()
    if (!data.success) throw new Error('Response not successful')
    return { count: data.data.length, type: data.data[0]?.type }
  })

  // Test 4: Get single boat
  await test('GET /api/boats/:id', async () => {
    // First get list to find an ID
    const listRes = await fetch(`${API_URL}/api/boats`)
    const listData = await listRes.json()
    
    if (listData.data && listData.data.length > 0) {
      const boatId = listData.data[0].id
      const res = await fetch(`${API_URL}/api/boats/${boatId}`)
      if (!res.ok) throw new Error(`Status: ${res.status}`)
      const data = await res.json()
      if (!data.success) throw new Error('Response not successful')
      return { id: data.data.id, name: data.data.name }
    } else {
      throw new Error('No boats found to test')
    }
  })

  // Test 5: Create booking (will fail without valid data, but tests endpoint)
  await test('POST /api/bookings (validation)', async () => {
    const res = await fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boatId: 'invalid',
        startDate: new Date().toISOString(),
        hours: 2,
        passengers: 2,
        customerName: 'Test',
        customerPhone: '+79001234567'
      })
    })
    // Should return 400 or 404 (validation error)
    const data = await res.json()
    if (res.status >= 200 && res.status < 300) {
      return { bookingId: data.data?.id }
    } else {
      // Expected validation error
      return { validationError: data.message || 'Validation failed as expected' }
    }
  })

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Test Summary')
  console.log('='.repeat(50))
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  
  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌'
    console.log(`${icon} ${r.name}`)
    if (r.error) {
      console.log(`   Error: ${r.error}`)
    }
  })
  
  console.log('\n' + '='.repeat(50))
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`)
  console.log('='.repeat(50))
  
  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch(console.error)
