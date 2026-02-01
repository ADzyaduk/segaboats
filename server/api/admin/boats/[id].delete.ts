// Delete boat (Admin only)

import { prisma } from '~~/server/utils/db'
import { requireAdminAuth } from '~~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminAuth(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID яхты не указан'
      })
    }

    // Check if boat exists
    const boat = await prisma.boat.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'PAID'] }
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

    // Check for active bookings
    if (boat.bookings.length > 0) {
      // Soft delete - just mark as inactive
      await prisma.boat.update({
        where: { id },
        data: {
          isActive: false,
          isAvailable: false
        }
      })

      return {
        success: true,
        message: 'Яхта деактивирована (есть активные бронирования)',
        data: { id, deleted: false, deactivated: true }
      }
    }

    // Hard delete if no active bookings
    await prisma.boat.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Яхта удалена',
      data: { id, deleted: true }
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    console.error('Error deleting boat:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при удалении яхты'
    })
  }
})
