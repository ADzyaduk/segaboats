// Get single group trip details

import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID поездки не указан'
      })
    }

    const trip = await prisma.groupTrip.findUnique({
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
        tickets: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED'] }
          },
          select: {
            id: true,
            customerName: true,
            status: true
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

    if (!trip) {
      throw createError({
        statusCode: 404,
        message: 'Групповая поездка не найдена'
      })
    }

    return {
      success: true,
      data: trip
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    console.error('Error fetching group trip:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении деталей поездки'
    })
  }
})
