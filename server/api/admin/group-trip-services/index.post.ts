// Create group trip service (Admin only)

import { prisma } from '~~/server/utils/db'
import { requireAdminAuth } from '~~/server/utils/adminAuth'

interface ServiceBody {
  type: 'SHORT' | 'MEDIUM' | 'FISHING'
  duration: number
  price: number
  title: string
  description?: string
  image?: string
  isActive?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminAuth(event)

    const body = await readBody<ServiceBody>(event)

    // Validate required fields
    if (!body.type || !body.duration || !body.price || !body.title) {
      throw createError({
        statusCode: 400,
        message: 'Заполните все обязательные поля'
      })
    }

    // Validate type
    const validTypes = ['SHORT', 'MEDIUM', 'FISHING']
    if (!validTypes.includes(body.type)) {
      throw createError({
        statusCode: 400,
        message: 'Некорректный тип услуги'
      })
    }

    // Check if service with this type already exists
    const existing = await prisma.groupTripService.findUnique({
      where: { type: body.type }
    })

    if (existing) {
      throw createError({
        statusCode: 400,
        message: 'Услуга с таким типом уже существует'
      })
    }

    // Create service
    const service = await prisma.groupTripService.create({
      data: {
        type: body.type,
        duration: body.duration,
        price: body.price,
        title: body.title,
        description: body.description || null,
        image: body.image || null,
        isActive: body.isActive !== undefined ? body.isActive : true
      }
    })

    return {
      success: true,
      data: service
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error creating group trip service:', error)
    throw createError({
      statusCode: 500,
      message: error?.message || 'Ошибка при создании услуги'
    })
  }
})
