// Get single group trip service by type

import { getGroupTripServiceByType } from '~~/server/utils/groupTripServices'
import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const type = getRouterParam(event, 'type') as string

    if (!type) {
      throw createError({
        statusCode: 400,
        message: 'Тип услуги не указан'
      })
    }

    // Validate type
    const validTypes = ['SHORT', 'MEDIUM', 'FISHING']
    if (!validTypes.includes(type)) {
      throw createError({
        statusCode: 400,
        message: 'Некорректный тип услуги'
      })
    }

    // Get static config (source of truth for prices)
    const staticService = getGroupTripServiceByType(type as 'SHORT' | 'MEDIUM' | 'FISHING')
    
    if (!staticService) {
      throw createError({
        statusCode: 404,
        message: 'Услуга не найдена'
      })
    }

    // Get service from database for additional fields
    const dbService = await prisma.groupTripService.findUnique({
      where: { type: type as 'SHORT' | 'MEDIUM' | 'FISHING' }
    })

    if (dbService && !dbService.isActive) {
      throw createError({
        statusCode: 404,
        message: 'Услуга не найдена'
      })
    }
    
    // Merge: use static config price, but DB for other fields
    const service = {
      id: dbService?.id || staticService.id,
      type: staticService.type,
      duration: staticService.duration,
      price: staticService.price, // Use price from static config (source of truth)
      title: staticService.title,
      description: staticService.description,
      image: dbService?.image || staticService.image,
      isActive: dbService?.isActive ?? staticService.isActive
    }

    return {
      success: true,
      data: service
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error fetching group trip service:', error)
    // Fallback to static config if DB fails
    const service = getGroupTripServiceByType(type as 'SHORT' | 'MEDIUM' | 'FISHING')
    if (!service) {
      throw createError({
        statusCode: 404,
        message: 'Услуга не найдена'
      })
    }
    return {
      success: true,
      data: service
    }
  }
})
