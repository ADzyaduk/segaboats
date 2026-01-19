// Get list of available group trip services

import { getActiveGroupTripServices } from '~~/server/utils/groupTripServices'

export default defineEventHandler(async (event) => {
  try {
    // Get all active group trip services from static config
    const services = getActiveGroupTripServices()

    return {
      success: true,
      data: services
    }
  } catch (error: any) {
    console.error('Error fetching group trip services:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении списка типов услуг'
    })
  }
})
