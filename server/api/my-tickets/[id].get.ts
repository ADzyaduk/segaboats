// Get single ticket details

import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID билета не указан'
      })
    }

    const ticket = await prisma.groupTripTicket.findUnique({
      where: { id },
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

    if (!ticket) {
      throw createError({
        statusCode: 404,
        message: 'Билет не найден'
      })
    }

    return {
      success: true,
      data: ticket
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    console.error('Error fetching ticket:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении билета'
    })
  }
})
