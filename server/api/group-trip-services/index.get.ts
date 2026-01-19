// Get list of available group trip services

import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Get all active group trip services
    const services = await prisma.groupTripService.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        duration: 'asc'
      }
    })

    return {
      success: true,
      data: services
    }
  } catch (error: any) {
    console.error('Error fetching group trip services:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta
    })
    throw createError({
      statusCode: 500,
      message: error?.message || 'Ошибка при получении списка типов услуг'
    })
  }
})
