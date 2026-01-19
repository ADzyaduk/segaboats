// Upload image endpoint for admin panel
// Stores images in /public/images/boats/{boat-slug}/

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Create slug from boat name (supports Cyrillic)
function createSlug(name: string): string {
  // Simple transliteration for common Cyrillic characters
  const translitMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  }

  return name
    .toLowerCase()
    .trim()
    .split('')
    .map(char => translitMap[char] || char)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters (keep only latin, numbers, spaces, hyphens)
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50) // Limit length
    || 'boat' // Fallback if empty
}

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

    // Find file and boatName in form data
    let file: any = null
    let boatName: string | null = null

    for (const item of formData) {
      if (item.name === 'file' && item.filename) {
        file = item
      } else if (item.name === 'boatName' && item.data) {
        boatName = item.data.toString('utf-8')
      }
    }

    if (!file || !file.filename || !file.data) {
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

    // Create boat folder slug
    const boatSlug = boatName ? createSlug(boatName) : 'default'
    
    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const extension = file.filename.split('.').pop() || 'jpg'
    const filename = `${timestamp}-${random}.${extension}`

    // Create directory structure: public/images/boats/{boat-slug}/
    const uploadDir = join(process.cwd(), 'public', 'images', 'boats', boatSlug)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file
    const filePath = join(uploadDir, filename)
    await writeFile(filePath, file.data)

    // Return URL
    const imageUrl = `/images/boats/${boatSlug}/${filename}`

    return {
      success: true,
      data: {
        url: imageUrl,
        filename: filename,
        boatSlug: boatSlug
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
