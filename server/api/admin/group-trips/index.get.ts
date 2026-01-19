// Get all group trips (Admin only)

import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // TODO: Add admin authentication check

    const query = getQuery(event)
    const status = query.status as string | undefined
    const type = query.type as string | undefined

    const where: any = {}
    if (status) {
      where.status = status
    }
    if (type) {
      where.type = type
    }

    const trips = await prisma.groupTrip.findMany({
      where,
      orderBy: { departureDate: 'desc' },
      include: {
        boat: {
          select: {
            id: true,
            name: true,
            thumbnail: true
          }
        },
        _count: {
          select: {
            tickets: true
          }
        }
      }
    })

    return {
      success: true,
      data: trips
    }
  } catch (error) {
    console.error('Error fetching group trips:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении групповых поездок'
    })
  }
})
