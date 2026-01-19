// Update group trip service (Admin only)

import { prisma } from '~~/server/utils/db'

interface ServiceBody {
  duration?: number
  price?: number
  title?: string
  description?: string
  image?: string
  isActive?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    // TODO: Add admin authentication check

    const serviceId = getRouterParam(event, 'id')
    const body = await readBody<ServiceBody>(event)

    if (!serviceId) {
      throw createError({
        statusCode: 400,
        message: 'ID услуги не указан'
      })
    }

    // Check if service exists
    const existing = await prisma.groupTripService.findUnique({
      where: { id: serviceId }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Услуга не найдена'
      })
    }

    // Update service
    const updateData: any = {}
    if (body.duration !== undefined) updateData.duration = body.duration
    if (body.price !== undefined) updateData.price = body.price
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.image !== undefined) updateData.image = body.image || null
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const service = await prisma.groupTripService.update({
      where: { id: serviceId },
      data: updateData
    })

    return {
      success: true,
      data: service
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error updating group trip service:', error)
    throw createError({
      statusCode: 500,
      message: error?.message || 'Ошибка при обновлении услуги'
    })
  }
})
