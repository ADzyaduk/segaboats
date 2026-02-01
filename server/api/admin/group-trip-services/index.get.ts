// Get all group trip services (Admin only)
// Note: Services are now static, this endpoint is for viewing only

import { GROUP_TRIP_SERVICES } from '~~/server/utils/groupTripServices'
import { requireAdminAuth } from '~~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminAuth(event)

    // Return static services (read-only)
    return {
      success: true,
      data: GROUP_TRIP_SERVICES
    }
  } catch (error) {
    console.error('Error fetching group trip services:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении типов услуг'
    })
  }
})
