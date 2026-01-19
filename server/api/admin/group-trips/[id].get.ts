// Get single group trip with tickets (Admin only)

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
            thumbnail: true
          }
        },
        tickets: {
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            customerEmail: true,
            status: true,
            totalPrice: true,
            createdAt: true,
            confirmedAt: true,
            cancelledAt: true
          }
        },
        _count: {
          select: {
            tickets: true
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
      message: 'Ошибка при получении поездки'
    })
  }
})
