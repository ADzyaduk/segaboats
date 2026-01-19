import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID яхты не указан'
      })
    }

    const boat = await prisma.boat.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        detailedDescription: true,
        type: true,
        capacity: true,
        recommendedCapacity: true,
        length: true,
        width: true,
        year: true,
        pricePerHour: true,
        pricePerDay: true,
        minimumHours: true,
        thumbnail: true,
        images: true,
        location: true,
        pier: true,
        features: true,
        hasCapitan: true,
        hasCrew: true,
        isActive: true,
        isAvailable: true,
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PAID']
            },
            startDate: {
              gte: new Date()
            }
          },
          select: {
            startDate: true,
            endDate: true
          }
        }
      }
    })

    if (!boat) {
      throw createError({
        statusCode: 404,
        message: 'Яхта не найдена'
      })
    }

    if (!boat.isActive) {
      throw createError({
        statusCode: 404,
        message: 'Яхта недоступна'
      })
    }

    // Extract booked dates for calendar
    const bookedDates = boat.bookings.map(b => ({
      start: b.startDate,
      end: b.endDate
    }))

    // Remove bookings from response for privacy
    const { bookings, ...boatData } = boat

    // Parse JSON fields
    const parsedBoat = {
      ...boatData,
      images: typeof boatData.images === 'string' ? JSON.parse(boatData.images) : boatData.images,
      features: typeof boatData.features === 'string' ? JSON.parse(boatData.features) : boatData.features,
      bookedDates
    }

    return {
      success: true,
      data: parsedBoat
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    console.error('Error fetching boat:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении данных яхты'
    })
  }
})
