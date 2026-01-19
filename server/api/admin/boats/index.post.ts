// Create new boat (Admin only)

import { prisma } from '~~/server/utils/db'

interface BoatData {
  name: string
  description?: string
  detailedDescription?: string
  type: 'YACHT' | 'CATAMARAN' | 'SPEEDBOAT' | 'SAILBOAT'
  capacity: number
  recommendedCapacity?: number
  length?: number
  width?: number
  year?: number
  pricePerHour: number
  pricePerDay?: number
  minimumHours?: number
  thumbnail?: string
  images?: string[]
  location?: string
  pier?: string
  features?: string[]
  hasCapitan?: boolean
  hasCrew?: boolean
  ownerId?: string
}

export default defineEventHandler(async (event) => {
  try {
    // TODO: Add admin authentication check
    // const isAdmin = await checkAdminAuth(event)
    // if (!isAdmin) {
    //   throw createError({ statusCode: 403, message: 'Forbidden' })
    // }

    const body = await readBody<BoatData>(event)

    console.log('Received boat data:', JSON.stringify(body, null, 2))

    // Validate required fields
    if (!body.name || !body.type || body.capacity === undefined || body.pricePerHour === undefined) {
      console.error('Validation failed:', {
        name: body.name,
        type: body.type,
        capacity: body.capacity,
        pricePerHour: body.pricePerHour
      })
      throw createError({
        statusCode: 400,
        message: 'Заполните все обязательные поля: name, type, capacity, pricePerHour'
      })
    }

    // Ensure numeric types
    const capacity = Number(body.capacity)
    const pricePerHour = Number(body.pricePerHour)
    
    if (isNaN(capacity) || capacity < 1) {
      throw createError({
        statusCode: 400,
        message: 'Вместимость должна быть числом больше 0'
      })
    }
    
    if (isNaN(pricePerHour) || pricePerHour <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Цена за час должна быть положительным числом'
      })
    }

    // Ensure capacity is 11 (by regulations)
    if (body.capacity !== 11) {
      console.warn(`Boat capacity set to ${body.capacity}, but should be 11 by regulations`)
    }

    // Prepare data for Prisma - ensure all types match schema
    const boatData: any = {
      name: String(body.name).trim(),
      type: body.type,
      capacity: Math.floor(capacity), // Int in Prisma
      pricePerHour: Math.floor(pricePerHour), // Int in Prisma
      minimumHours: body.minimumHours ? Math.floor(Number(body.minimumHours)) : 1, // Int, default 1
      images: '[]', // Default empty array as JSON string
      location: body.location || 'Сочи',
      features: '[]', // Default empty array as JSON string
      hasCapitan: body.hasCapitan !== undefined ? Boolean(body.hasCapitan) : true,
      hasCrew: body.hasCrew !== undefined ? Boolean(body.hasCrew) : false,
      isActive: true,
      isAvailable: true
    }

    // Optional fields
    if (body.description) boatData.description = String(body.description)
    if (body.detailedDescription) boatData.detailedDescription = String(body.detailedDescription)
    if (body.recommendedCapacity) boatData.recommendedCapacity = Math.floor(Number(body.recommendedCapacity))
    if (body.length) boatData.length = Number(body.length) // Float
    if (body.width) boatData.width = Number(body.width) // Float
    if (body.year) boatData.year = Math.floor(Number(body.year)) // Int
    if (body.pricePerDay) boatData.pricePerDay = Math.floor(Number(body.pricePerDay)) // Int
    if (body.thumbnail) boatData.thumbnail = String(body.thumbnail)
    if (body.pier) boatData.pier = String(body.pier)
    if (body.ownerId) boatData.ownerId = String(body.ownerId)

    // Arrays - ensure they're valid JSON strings
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      boatData.images = JSON.stringify(body.images)
    }
    if (body.features && Array.isArray(body.features) && body.features.length > 0) {
      boatData.features = JSON.stringify(body.features)
    }

    console.log('Creating boat with Prisma data:', JSON.stringify(boatData, null, 2))

    // Validate data before creating
    if (!boatData.name || boatData.name.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Название яхты не может быть пустым'
      })
    }

    // Create boat
    let boat
    try {
      boat = await prisma.boat.create({
        data: boatData
      })
      console.log('Boat created successfully:', boat.id)
    } catch (prismaError: any) {
      console.error('Prisma create error:', prismaError)
      console.error('Prisma error code:', prismaError.code)
      console.error('Prisma error meta:', prismaError.meta)
      
      // Handle unique constraint violation
      if (prismaError.code === 'P2002') {
        throw createError({
          statusCode: 400,
          message: `Яхта с названием "${boatData.name}" уже существует`
        })
      }
      
      throw prismaError
    }

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
  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    // Log full error details
    console.error('Error creating boat:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error message:', error?.message)
    console.error('Error name:', error?.name)
    
    // Check for Prisma errors
    if (error?.code) {
      console.error('Prisma error code:', error.code)
    }
    
    // Return more specific error message
    const errorMessage = error?.message || 'Ошибка при создании яхты'
    throw createError({
      statusCode: 500,
      message: errorMessage,
      data: {
        originalError: error?.message,
        code: error?.code
      }
    })
  }
})
