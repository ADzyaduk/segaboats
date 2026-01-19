// Get all bookings (Admin only)

import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // TODO: Add admin authentication check

    const query = getQuery(event)
    const status = query.status as string | undefined
    const limit = parseInt(query.limit as string) || 100

    const where: any = {}
    if (status) {
      where.status = status
    }

    const bookings = await prisma.booking.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        boat: {
          select: {
            id: true,
            name: true,
            thumbnail: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return {
      success: true,
      data: bookings
    }
  } catch (error) {
    console.error('Error fetching bookings:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении бронирований'
    })
  }
})
