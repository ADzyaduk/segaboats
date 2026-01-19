import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID бронирования не указан'
      })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        boat: {
          select: {
            id: true,
            name: true,
            thumbnail: true,
            location: true,
            pier: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            telegramId: true
          }
        }
      }
    })

    if (!booking) {
      throw createError({
        statusCode: 404,
        message: 'Бронирование не найдено'
      })
    }

    return {
      success: true,
      data: booking
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    console.error('Error fetching booking:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении бронирования'
    })
  }
})
