// Get single group trip service by type

import { getGroupTripServiceByType } from '~~/server/utils/groupTripServices'

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

    // Get service by type from static config
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
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error fetching group trip service:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении услуги'
    })
  }
})
