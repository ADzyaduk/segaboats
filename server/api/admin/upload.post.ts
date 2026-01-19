// Upload image endpoint for admin panel
// Stores images in /public/images/boats/

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export default defineEventHandler(async (event) => {
  try {
    // TODO: Add admin authentication check

    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Нет файла для загрузки'
      })
    }

    const file = formData[0]
    
    if (!file.filename || !file.data) {
      throw createError({
        statusCode: 400,
        message: 'Неверный формат файла'
      })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!file.type || !allowedTypes.includes(file.type)) {
      throw createError({
        statusCode: 400,
        message: 'Разрешены только изображения: JPG, PNG, WebP'
      })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.data.length > maxSize) {
      throw createError({
        statusCode: 400,
        message: 'Размер файла не должен превышать 5MB'
      })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const extension = file.filename.split('.').pop() || 'jpg'
    const filename = `boat-${timestamp}-${random}.${extension}`

    // Create directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'images', 'boats')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file
    const filePath = join(uploadDir, filename)
    await writeFile(filePath, file.data)

    // Return URL
    const imageUrl = `/images/boats/${filename}`

    return {
      success: true,
      data: {
        url: imageUrl,
        filename: filename
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Upload error:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка загрузки файла'
    })
  }
})
