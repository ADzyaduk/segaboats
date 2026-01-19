// Get all group trip services (Admin only)

import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // TODO: Add admin authentication check

    const services = await prisma.groupTripService.findMany({
      orderBy: {
        duration: 'asc'
      }
    })

    return {
      success: true,
      data: services
    }
  } catch (error) {
    console.error('Error fetching group trip services:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении типов услуг'
    })
  }
})
