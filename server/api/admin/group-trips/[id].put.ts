// Update group trip (Admin only)

import { prisma } from '~~/server/utils/db'
import { requireAdminAuth } from '~~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminAuth(event)
    const id = getRouterParam(event, 'id')
    const body = await readBody<Partial<{
      type: string
      duration: number
      price: number
      availableSeats: number
      departureDate: string
      departureTime: string
      boatId: string
      status: string
    }>>()

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID поездки не указан'
      })
    }

    const trip = await prisma.groupTrip.findUnique({
      where: { id }
    })

    if (!trip) {
      throw createError({
        statusCode: 404,
        message: 'Групповая поездка не найдена'
      })
    }

    const updateData: any = {}
    
    if (body.type !== undefined) updateData.type = body.type
    if (body.duration !== undefined) updateData.duration = body.duration
    if (body.price !== undefined) updateData.price = body.price
    if (body.availableSeats !== undefined) updateData.availableSeats = body.availableSeats
    if (body.departureDate !== undefined) {
      const departureDate = new Date(body.departureDate)
      if (body.departureTime) {
        const [hours, minutes] = body.departureTime.split(':').map(Number)
        departureDate.setHours(hours, minutes, 0, 0)
      }
      updateData.departureDate = departureDate
    }
    if (body.departureTime !== undefined) updateData.departureTime = body.departureTime
    if (body.boatId !== undefined) updateData.boatId = body.boatId
    if (body.status !== undefined) updateData.status = body.status

    const updatedTrip = await prisma.groupTrip.update({
      where: { id },
      data: updateData,
      include: {
        boat: {
          select: { name: true }
        }
      }
    })

    return {
      success: true,
      data: updatedTrip
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    console.error('Error updating group trip:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении поездки'
    })
  }
})
