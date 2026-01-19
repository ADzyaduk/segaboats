// Скрипт для проверки подключения к базе данных
// Использование: tsx scripts/check-db.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Проверка подключения к базе данных...\n')

    // 1. Проверка подключения
    console.log('1. Тест подключения...')
    await prisma.$queryRaw`SELECT 1`
    console.log('   ✅ Подключение успешно\n')

    // 2. Проверка таблиц
    console.log('2. Проверка таблиц...')
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    console.log(`   ✅ Найдено таблиц: ${tables.length}`)
    tables.forEach(t => console.log(`      - ${t.tablename}`))
    console.log('')

    // 3. Проверка админов
    console.log('3. Проверка админов в БД...')
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'OWNER'] }
      },
      select: {
        id: true,
        email: true,
        telegramId: true,
        role: true,
        isActive: true
      }
    })

    if (admins.length === 0) {
      console.log('   ⚠️  Админов не найдено!')
      console.log('   💡 Создайте админа: tsx scripts/create-admin.ts')
    } else {
      console.log(`   ✅ Найдено админов: ${admins.length}`)
      admins.forEach(admin => {
        console.log(`      - Email: ${admin.email || 'не указан'}`)
        console.log(`        Telegram ID: ${admin.telegramId}`)
        console.log(`        Role: ${admin.role}`)
        console.log(`        Active: ${admin.isActive ? 'да' : 'нет'}`)
      })
    }
    console.log('')

    // 4. Проверка переменных окружения
    console.log('4. Проверка переменных окружения...')
    const adminPassword = process.env.ADMIN_PASSWORD
    if (adminPassword) {
      console.log('   ✅ ADMIN_PASSWORD установлен')
    } else {
      console.log('   ⚠️  ADMIN_PASSWORD не установлен в .env')
      console.log('   💡 Добавьте в .env: ADMIN_PASSWORD=ваш_пароль')
    }

    const dbUrl = process.env.DATABASE_URL
    if (dbUrl) {
      const dbMatch = dbUrl.match(/\/\/(?:[^:]+:)?[^@]+@[^:]+:\d+\/([^?]+)/)
      const dbName = dbMatch ? dbMatch[1] : 'unknown'
      console.log(`   ✅ DATABASE_URL установлен (БД: ${dbName})`)
    } else {
      console.log('   ❌ DATABASE_URL не установлен в .env')
    }

    console.log('\n✅ Проверка завершена!')
  } catch (error) {
    console.error('\n❌ Ошибка при проверке базы данных:')
    console.error(error instanceof Error ? error.message : error)
    console.error('\n💡 Проверьте:')
    console.error('   1. PostgreSQL запущен')
    console.error('   2. DATABASE_URL правильно настроен в .env')
    console.error('   3. База данных создана')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
