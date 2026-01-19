// Update booking status (Admin only)

import { prisma } from '~~/server/utils/db'
import { n8nEvents } from '~~/server/utils/n8n'

export default defineEventHandler(async (event) => {
  try {
    // TODO: Add admin authentication check

    const id = getRouterParam(event, 'id')
    const body = await readBody<{ status?: string }>(event)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID бронирования не указан'
      })
    }

    const booking = await prisma.booking.findUnique({
      where: { id }
    })

    if (!booking) {
      throw createError({
        statusCode: 404,
        message: 'Бронирование не найдено'
      })
    }

    const updateData: any = {}
    
    if (body.status) {
      updateData.status = body.status
      
      if (body.status === 'CONFIRMED' && booking.status === 'PENDING') {
        updateData.confirmedAt = new Date()
      }
      
      if (body.status === 'CANCELLED' && booking.status !== 'CANCELLED') {
        updateData.cancelledAt = new Date()
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        boat: {
          select: { name: true }
        }
      }
    })

    // Trigger n8n webhook
    if (body.status === 'CONFIRMED') {
      await n8nEvents.onBookingConfirmed({
        bookingId: updatedBooking.id,
        boatName: updatedBooking.boat.name,
        customerName: updatedBooking.customerName
      })
    } else if (body.status === 'CANCELLED') {
      await n8nEvents.onBookingCancelled({
        bookingId: updatedBooking.id,
        boatName: updatedBooking.boat.name,
        customerName: updatedBooking.customerName
      })
    }

    return {
      success: true,
      data: updatedBooking
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    console.error('Error updating booking:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении бронирования'
    })
  }
})
