// Admin authentication endpoint

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '~~/server/utils/db'
import { createAdminSessionToken, getAdminSessionTtlSeconds } from '~~/server/utils/adminAuth'

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

    const config = useRuntimeConfig()
    const adminPassword = config.adminPassword || ''
    const adminPasswordHash = config.adminPasswordHash || ''
    const adminSessionSecret = config.adminSessionSecret || ''

    if (!adminSessionSecret) {
      throw createError({
        statusCode: 500,
        message: 'Admin auth is not configured'
      })
    }

    if (!adminPassword && !adminPasswordHash) {
      throw createError({
        statusCode: 500,
        message: 'Admin password is not configured'
      })
    }

    let isValidPassword = false
    if (adminPasswordHash) {
      isValidPassword = await bcrypt.compare(body.password, adminPasswordHash)
    } else {
      if (adminPassword.length !== body.password.length) {
        isValidPassword = false
      } else {
        isValidPassword = crypto.timingSafeEqual(
          Buffer.from(body.password),
          Buffer.from(adminPassword)
        )
      }
    }

    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        message: 'Неверный email или пароль'
      })
    }

    // Create session token (simple implementation)
    // In production, use JWT or session management
    const sessionToken = createAdminSessionToken(
      { uid: admin.id, role: admin.role },
      adminSessionSecret
    )

    // Set cookie
    setCookie(event, 'admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: getAdminSessionTtlSeconds(),
      path: '/'
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
