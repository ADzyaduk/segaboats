// Update boat (Admin only)

import { prisma } from '~~/server/utils/db'
import { requireAdminAuth } from '~~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminAuth(event)
    const id = getRouterParam(event, 'id')
    const body = await readBody<Partial<{
      name: string
      description: string
      detailedDescription: string
      type: string
      capacity: number
      recommendedCapacity: number
      length: number
      width: number
      year: number
      pricePerHour: number
      pricePerDay: number
      minimumHours: number
      thumbnail: string
      images: string[]
      location: string
      pier: string
      features: string[]
      hasCapitan: boolean
      hasCrew: boolean
      isActive: boolean
      isAvailable: boolean
    }>>(event)

    console.log('Received update data:', JSON.stringify(body, null, 2))

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID яхты не указан'
      })
    }

    // Check if boat exists
    const existingBoat = await prisma.boat.findUnique({
      where: { id }
    })

    if (!existingBoat) {
      throw createError({
        statusCode: 404,
        message: 'Яхта не найдена'
      })
    }

    // Prepare update data with proper types
    const updateData: any = {}
    
    if (body.name !== undefined) updateData.name = String(body.name).trim()
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.detailedDescription !== undefined) updateData.detailedDescription = body.detailedDescription || null
    if (body.type !== undefined) updateData.type = body.type
    if (body.capacity !== undefined) {
      const capacity = Number(body.capacity)
      if (isNaN(capacity) || capacity < 1) {
        throw createError({
          statusCode: 400,
          message: 'Вместимость должна быть числом больше 0'
        })
      }
      updateData.capacity = capacity
    }
    if (body.recommendedCapacity !== undefined) {
      updateData.recommendedCapacity = body.recommendedCapacity ? Number(body.recommendedCapacity) : null
    }
    if (body.length !== undefined) updateData.length = body.length ? Number(body.length) : null
    if (body.width !== undefined) updateData.width = body.width ? Number(body.width) : null
    if (body.year !== undefined) updateData.year = body.year ? Number(body.year) : null
    if (body.pricePerHour !== undefined) {
      const pricePerHour = Number(body.pricePerHour)
      if (isNaN(pricePerHour) || pricePerHour <= 0) {
        throw createError({
          statusCode: 400,
          message: 'Цена за час должна быть положительным числом'
        })
      }
      updateData.pricePerHour = pricePerHour
    }
    if (body.pricePerDay !== undefined) updateData.pricePerDay = body.pricePerDay ? Number(body.pricePerDay) : null
    if (body.minimumHours !== undefined) updateData.minimumHours = Number(body.minimumHours) || 1
    if (body.thumbnail !== undefined) updateData.thumbnail = body.thumbnail || null
    if (body.images !== undefined) {
      updateData.images = Array.isArray(body.images) ? JSON.stringify(body.images) : '[]'
    }
    if (body.location !== undefined) updateData.location = body.location || 'Сочи'
    if (body.pier !== undefined) updateData.pier = body.pier || null
    if (body.features !== undefined) {
      updateData.features = Array.isArray(body.features) ? JSON.stringify(body.features) : '[]'
    }
    if (body.hasCapitan !== undefined) updateData.hasCapitan = Boolean(body.hasCapitan)
    if (body.hasCrew !== undefined) updateData.hasCrew = Boolean(body.hasCrew)
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive)
    if (body.isAvailable !== undefined) updateData.isAvailable = Boolean(body.isAvailable)

    console.log('Updating boat with data:', updateData)

    // Update boat
    const boat = await prisma.boat.update({
      where: { id },
      data: updateData
    })

    // Parse JSON fields for response
    let parsedImages = []
    let parsedFeatures = []
    
    try {
      parsedImages = typeof boat.images === 'string' ? JSON.parse(boat.images) : (Array.isArray(boat.images) ? boat.images : [])
    } catch (e) {
      console.error('Error parsing images:', e)
      parsedImages = []
    }
    
    try {
      parsedFeatures = typeof boat.features === 'string' ? JSON.parse(boat.features) : (Array.isArray(boat.features) ? boat.features : [])
    } catch (e) {
      console.error('Error parsing features:', e)
      parsedFeatures = []
    }
    
    const response = {
      ...boat,
      images: parsedImages,
      features: parsedFeatures
    }

    return {
      success: true,
      data: response
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    console.error('Error updating boat:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении яхты'
    })
  }
})
