// Get list of available group trip services

import { getActiveGroupTripServices } from '~~/server/utils/groupTripServices'
import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Get services from database (source of truth for prices)
    const dbServices = await prisma.groupTripService.findMany({
      where: { isActive: true },
      orderBy: { type: 'asc' }
    })

    // Get static config for fallback (titles, descriptions, etc.)
    const staticServices = getActiveGroupTripServices()
    
    // Merge: use DB prices, but static config for other fields
    const services = dbServices.map(dbService => {
      const staticService = staticServices.find(s => s.type === dbService.type)
      return {
        id: dbService.id,
        type: dbService.type,
        duration: dbService.duration,
        price: dbService.price, // Use price from database (source of truth)
        title: staticService?.title || dbService.title,
        description: staticService?.description || dbService.description || '',
        image: dbService.image || staticService?.image,
        isActive: dbService.isActive
      }
    })

    return {
      success: true,
      data: services
    }
  } catch (error: any) {
    console.error('Error fetching group trip services:', error)
    // Fallback to static config if DB fails
    const services = getActiveGroupTripServices()
    return {
      success: true,
      data: services
    }
  }
})
