// Скрипт для создания админа в базе данных
// Использование: tsx scripts/create-admin.ts [email] [telegramId]

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const email = process.argv[2] || 'admin@boats2026.ru'
const telegramId = process.argv[3] || 'admin'

async function createAdmin() {
  try {
    console.log('🔧 Создание админа...\n')
    console.log(`   Email: ${email}`)
    console.log(`   Telegram ID: ${telegramId}\n`)

    // Проверяем, существует ли уже админ
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { telegramId }
        ],
        role: { in: ['ADMIN', 'OWNER'] }
      }
    })

    if (existingAdmin) {
      console.log('⚠️  Админ уже существует:')
      console.log(`   ID: ${existingAdmin.id}`)
      console.log(`   Email: ${existingAdmin.email}`)
      console.log(`   Telegram ID: ${existingAdmin.telegramId}`)
      console.log(`   Role: ${existingAdmin.role}`)
      console.log(`   Active: ${existingAdmin.isActive ? 'да' : 'нет'}\n`)
      
      if (!existingAdmin.isActive) {
        console.log('💡 Активирую админа...')
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { isActive: true }
        })
        console.log('✅ Админ активирован!')
      }
      return
    }

    // Создаем админа
    const admin = await prisma.user.create({
      data: {
        telegramId,
        email,
        role: 'ADMIN',
        isActive: true,
        firstName: 'Admin',
        lastName: 'User'
      }
    })

    console.log('✅ Админ создан успешно!')
    console.log(`   ID: ${admin.id}`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Telegram ID: ${admin.telegramId}`)
    console.log(`   Role: ${admin.role}\n`)
    
    console.log('💡 ВАЖНО:')
    console.log('   1. Убедитесь, что ADMIN_PASSWORD в .env установлен')
    console.log(`   2. Войдите в админ-панель с email: ${email}`)
    console.log('   3. Используйте пароль из ADMIN_PASSWORD в .env')
  } catch (error) {
    console.error('❌ Ошибка при создании админа:', error)
    if (error instanceof Error) {
      console.error('   Сообщение:', error.message)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
