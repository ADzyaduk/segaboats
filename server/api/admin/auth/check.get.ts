// Check admin authentication status

import { getAdminFromEvent } from '~~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    const admin = await getAdminFromEvent(event)

    if (!admin) {
      return { authenticated: false }
    }

    return {
      authenticated: true,
      data: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        firstName: admin.firstName,
        lastName: admin.lastName
      }
    }
  } catch (error) {
    console.error('Auth check error:', error)
    return {
      authenticated: false
    }
  }
})
