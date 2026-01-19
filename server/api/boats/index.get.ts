import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    
    // Parse query parameters
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 10, 50)
    const minPrice = parseInt(query.minPrice as string) || undefined
    const maxPrice = parseInt(query.maxPrice as string) || undefined

    // Build where clause
    const where: any = {
      isActive: true,
      isAvailable: true
    }

    if (minPrice || maxPrice) {
      where.pricePerHour = {}
      if (minPrice) where.pricePerHour.gte = minPrice
      if (maxPrice) where.pricePerHour.lte = maxPrice
    }

    // Get boats with pagination
    const [boats, total] = await Promise.all([
      prisma.boat.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { pricePerHour: 'asc' },
          { createdAt: 'desc' }
        ],
        select: {
          id: true,
          name: true,
          description: true,
          detailedDescription: true,
          type: true,
          capacity: true,
          recommendedCapacity: true,
          length: true,
          width: true,
          year: true,
          pricePerHour: true,
          pricePerDay: true,
          minimumHours: true,
          thumbnail: true,
          images: true,
          location: true,
          pier: true,
          features: true,
          hasCapitan: true,
          hasCrew: true,
          isActive: true,
          isAvailable: true
        }
      }),
      prisma.boat.count({ where })
    ])

    // Parse JSON fields
    const boatsWithParsedJson = boats.map(boat => ({
      ...boat,
      images: typeof boat.images === 'string' ? JSON.parse(boat.images) : boat.images,
      features: typeof boat.features === 'string' ? JSON.parse(boat.features) : boat.features
    }))

    return {
      success: true,
      data: boatsWithParsedJson,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Error fetching boats:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении списка яхт'
    })
  }
})
