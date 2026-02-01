// Update booking status (Admin only)

import { prisma } from '~~/server/utils/db'
import { 
  notifyCustomerBookingConfirmed, 
  notifyCustomerBookingCancelled 
} from '~~/server/utils/notifications'
import { requireAdminAuth } from '~~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminAuth(event)

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
          select: { 
            name: true,
            pier: true
          }
        },
        user: {
          select: {
            telegramId: true
          }
        }
      }
    })

    // Notify customer about status change
    if (body.status === 'CONFIRMED') {
      await notifyCustomerBookingConfirmed({
        id: updatedBooking.id,
        boatName: updatedBooking.boat.name,
        startDate: updatedBooking.startDate,
        hours: updatedBooking.hours,
        totalPrice: updatedBooking.totalPrice,
        userTelegramId: updatedBooking.user.telegramId,
        boatPier: updatedBooking.boat.pier
      })
    } else if (body.status === 'CANCELLED') {
      await notifyCustomerBookingCancelled({
        id: updatedBooking.id,
        boatName: updatedBooking.boat.name,
        startDate: updatedBooking.startDate,
        userTelegramId: updatedBooking.user.telegramId
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
