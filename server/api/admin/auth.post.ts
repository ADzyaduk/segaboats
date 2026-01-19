// Admin authentication endpoint

import { prisma } from '~~/server/utils/db'

interface AuthBody {
  email: string
  password: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<AuthBody>(event)

    if (!body.email || !body.password) {
      throw createError({
        statusCode: 400,
        message: 'Email и пароль обязательны'
      })
    }

    // Find admin user
    const admin = await prisma.user.findFirst({
      where: {
        email: body.email,
        role: { in: ['ADMIN', 'OWNER'] },
        isActive: true
      }
    })

    if (!admin) {
      throw createError({
        statusCode: 401,
        message: 'Неверный email или пароль'
      })
    }

    // Simple password check (in production, use bcrypt)
    // For now, check if password matches a simple pattern
    // TODO: Implement proper password hashing
    const isValidPassword = body.password === 'admin2026' // Temporary default password

    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        message: 'Неверный email или пароль'
      })
    }

    // Create session token (simple implementation)
    // In production, use JWT or session management
    const sessionToken = crypto.randomUUID()

    // Set cookie
    setCookie(event, 'admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return {
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        firstName: admin.firstName,
        lastName: admin.lastName
      }
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    console.error('Admin auth error:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка аутентификации'
    })
  }
})
