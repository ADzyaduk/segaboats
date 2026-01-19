// Get list of available group trips

import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    
    // Parse query parameters
    const type = query.type as string | undefined
    const date = query.date as string | undefined

    // Build where clause
    const where: any = {
      status: { in: ['SCHEDULED'] }, // Only show scheduled trips
      availableSeats: { gt: 0 } // Only show trips with available seats
    }

    if (type) {
      where.type = type
    }

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      where.departureDate = {
        gte: startOfDay,
        lte: endOfDay
      }
    } else {
      // By default, show trips from today onwards
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      where.departureDate = { gte: today }
    }

    // Get group trips
    const trips = await prisma.groupTrip.findMany({
      where,
      orderBy: [
        { departureDate: 'asc' },
        { createdAt: 'desc' }
      ],
      take: 50, // Limit results for performance
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
            tickets: {
              where: {
                status: { in: ['PENDING', 'CONFIRMED'] }
              }
            }
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
      message: 'Ошибка при получении списка групповых поездок'
    })
  }
})
