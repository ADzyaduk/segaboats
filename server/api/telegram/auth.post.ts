import { prisma } from '~~/server/utils/db'
import { validateTelegramWebAppData } from '~~/server/utils/telegram'

interface AuthBody {
  initData: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<AuthBody>(event)

    if (!body.initData) {
      throw createError({
        statusCode: 400,
        message: 'initData is required'
      })
    }

    // Validate Telegram WebApp data
    const telegramData = validateTelegramWebAppData(body.initData)

    if (!telegramData || !telegramData.user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid Telegram authentication'
      })
    }

    const telegramUser = telegramData.user

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramUser.id) }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: BigInt(telegramUser.id),
          telegramUsername: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name
        }
      })
    } else {
      // Update user info if changed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramUsername: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          updatedAt: new Date()
        }
      })
    }

    // Get user's bookings count
    const bookingsCount = await prisma.booking.count({
      where: {
        userId: user.id,
        status: { in: ['CONFIRMED', 'PAID', 'COMPLETED'] }
      }
    })

    return {
      success: true,
      data: {
        id: user.id,
        telegramId: user.telegramId.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.telegramUsername,
        role: user.role,
        bookingsCount
      }
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    console.error('Telegram auth error:', error)
    throw createError({
      statusCode: 500,
      message: 'Authentication failed'
    })
  }
})
