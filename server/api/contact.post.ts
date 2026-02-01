// API endpoint for contact form submission
// Sends the request to admin via Telegram bot

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{
      name?: string
      phone?: string
      email?: string
      message?: string
    }>(event)

    if (!body?.name?.trim() || !body?.phone?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Имя и телефон обязательны'
      })
    }

    const { notifyAdminContactForm } = await import('~~/server/utils/notifications')

    const result = await notifyAdminContactForm({
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim() || undefined,
      message: body.message?.trim() || undefined
    })

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось отправить заявку. Попробуйте позже.'
      })
    }

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('[api/contact] Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Произошла ошибка при отправке заявки'
    })
  }
})
