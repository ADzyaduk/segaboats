// Create group trip (Admin only)

import { prisma } from '~~/server/utils/db'

interface GroupTripData {
  type: 'SHORT' | 'MEDIUM' | 'FISHING'
  duration: number
  price: number
  maxCapacity?: number
  availableSeats: number
  departureDate: string
  departureTime?: string
  boatId?: string
}

export default defineEventHandler(async (event) => {
  try {
    // TODO: Add admin authentication check

    const body = await readBody<GroupTripData>()

    // Validate required fields
    if (!body.type || !body.duration || !body.price || !body.availableSeats || !body.departureDate) {
      throw createError({
        statusCode: 400,
        message: 'Заполните все обязательные поля'
      })
    }

    // Parse departure date
    const departureDate = new Date(body.departureDate)
    if (body.departureTime) {
      const [hours, minutes] = body.departureTime.split(':').map(Number)
      departureDate.setHours(hours, minutes, 0, 0)
    }

    // Create trip
    const trip = await prisma.groupTrip.create({
      data: {
        type: body.type,
        duration: body.duration,
        price: body.price,
        maxCapacity: body.maxCapacity || 11,
        availableSeats: body.availableSeats,
        departureDate,
        departureTime: body.departureTime,
        boatId: body.boatId,
        status: 'SCHEDULED'
      },
      include: {
        boat: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return {
      success: true,
      data: trip
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    console.error('Error creating group trip:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при создании групповой поездки'
    })
  }
})
