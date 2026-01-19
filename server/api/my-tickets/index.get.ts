// Get user's tickets

import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Get user from query or session
    // For now, we'll get from query parameter (in production, use session/auth)
    const query = getQuery(event)
    const userId = query.userId as string | undefined

    if (!userId) {
      return {
        success: true,
        data: []
      }
    }

    const tickets = await prisma.groupTripTicket.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        trip: {
          select: {
            type: true,
            duration: true,
            departureDate: true,
            departureTime: true
          }
        }
      }
    })

    return {
      success: true,
      data: tickets
    }
  } catch (error) {
    console.error('Error fetching tickets:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении билетов'
    })
  }
})
