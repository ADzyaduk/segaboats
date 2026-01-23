// Get list of available group trip services

import { getActiveGroupTripServices } from '~~/server/utils/groupTripServices'
import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Get static config (source of truth for prices)
    const staticServices = getActiveGroupTripServices()
    
    // Get services from database for additional fields
    const dbServices = await prisma.groupTripService.findMany({
      where: { isActive: true },
      orderBy: { type: 'asc' }
    })
    
    // Merge: use static config prices, but DB for other fields
    const services = staticServices.map(staticService => {
      const dbService = dbServices.find(s => s.type === staticService.type)
      return {
        id: dbService?.id || staticService.id,
        type: staticService.type,
        duration: staticService.duration,
        price: staticService.price, // Use price from static config (source of truth)
        title: staticService.title,
        description: staticService.description,
        image: dbService?.image || staticService.image,
        isActive: dbService?.isActive ?? staticService.isActive
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
