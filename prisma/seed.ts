import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test users
  const user1 = await prisma.user.upsert({
    where: { telegramId: '123456789' },
    update: {},
    create: {
      telegramId: '123456789',
      telegramUsername: 'test_user',
      firstName: 'Иван',
      lastName: 'Иванов',
      phone: '+7 (900) 123-45-67',
      email: 'ivan@example.com',
      role: 'USER'
    }
  })

  const admin = await prisma.user.upsert({
    where: { telegramId: '987654321' },
    update: {},
    create: {
      telegramId: '987654321',
      telegramUsername: 'admin',
      firstName: 'Админ',
      lastName: 'Админов',
      phone: '+7 (900) 999-99-99',
      email: 'admin@yachts-sochi.ru',
      role: 'ADMIN'
    }
  })

  console.log('✅ Users created:', { user1: user1.id, admin: admin.id })

  // Create test boats
  const boats = [
    {
      name: 'Лазурная мечта',
      description: 'Роскошная яхта для незабываемых морских прогулок. Идеально подходит для романтических свиданий и небольших компаний. На борту есть все необходимое для комфортного отдыха.',
      type: 'YACHT' as const,
      capacity: 8,
      length: 12.5,
      year: 2020,
      pricePerHour: 15000,
      pricePerDay: 120000,
      minimumHours: 2,
      thumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
      ]),
      location: 'Сочи',
      pier: 'Морской порт, причал №3',
      features: JSON.stringify(['WiFi', 'Кухня', 'Кондиционер', 'Музыка', 'Душ']),
      hasCapitan: true,
      hasCrew: false,
      isActive: true,
      isAvailable: true,
      ownerId: admin.id
    },
    {
      name: 'Морской бриз',
      description: 'Современный катамаран с просторными палубами. Отлично подходит для больших компаний и корпоративных мероприятий. Стабильность и комфорт на воде.',
      type: 'CATAMARAN' as const,
      capacity: 16,
      length: 15.0,
      year: 2022,
      pricePerHour: 25000,
      pricePerDay: 200000,
      minimumHours: 3,
      thumbnail: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
      ]),
      location: 'Сочи',
      pier: 'Морской порт, причал №5',
      features: JSON.stringify(['WiFi', 'Кухня', 'Кондиционер', 'Музыка', 'Телевизор', 'Каюта']),
      hasCapitan: true,
      hasCrew: true,
      isActive: true,
      isAvailable: true,
      ownerId: admin.id
    },
    {
      name: 'Скоростной дельфин',
      description: 'Быстрый катер для активного отдыха. Идеален для рыбалки и водных развлечений. Мощный двигатель и отличная маневренность.',
      type: 'SPEEDBOAT' as const,
      capacity: 6,
      length: 8.5,
      year: 2023,
      pricePerHour: 8000,
      pricePerDay: 60000,
      minimumHours: 2,
      thumbnail: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
      ]),
      location: 'Сочи',
      pier: 'Морской порт, причал №1',
      features: JSON.stringify(['Музыка', 'Рыбалка']),
      hasCapitan: true,
      hasCrew: false,
      isActive: true,
      isAvailable: true,
      ownerId: admin.id
    },
    {
      name: 'Белый парус',
      description: 'Классическая парусная яхта для истинных ценителей моря. Романтика парусов и свобода ветра. Опытный капитан научит основам управления парусом.',
      type: 'SAILBOAT' as const,
      capacity: 10,
      length: 14.0,
      year: 2019,
      pricePerHour: 12000,
      pricePerDay: 90000,
      minimumHours: 3,
      thumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
      ]),
      location: 'Сочи',
      pier: 'Морской порт, причал №2',
      features: JSON.stringify(['WiFi', 'Кухня', 'Каюта']),
      hasCapitan: true,
      hasCrew: false,
      isActive: true,
      isAvailable: true,
      ownerId: admin.id
    },
    {
      name: 'Королева моря',
      description: 'Премиум яхта класса люкс. Максимальный комфорт и роскошь. Идеальна для особых случаев, свадеб и VIP-мероприятий.',
      type: 'YACHT' as const,
      capacity: 12,
      length: 18.0,
      year: 2024,
      pricePerHour: 35000,
      pricePerDay: 280000,
      minimumHours: 4,
      thumbnail: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
      ]),
      location: 'Сочи',
      pier: 'Морской порт, причал №4',
      features: JSON.stringify(['WiFi', 'Кухня', 'Кондиционер', 'Музыка', 'Телевизор', 'Каюта', 'Душ', 'Джакузи']),
      hasCapitan: true,
      hasCrew: true,
      isActive: true,
      isAvailable: true,
      ownerId: admin.id
    },
    {
      name: 'Семейный отдых',
      description: 'Уютная яхта для семейных прогулок. Безопасность и комфорт для детей. Идеальна для первого знакомства с морем.',
      type: 'YACHT' as const,
      capacity: 6,
      length: 10.0,
      year: 2021,
      pricePerHour: 10000,
      pricePerDay: 75000,
      minimumHours: 2,
      thumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
      ]),
      location: 'Сочи',
      pier: 'Морской порт, причал №1',
      features: JSON.stringify(['WiFi', 'Кухня', 'Музыка']),
      hasCapitan: true,
      hasCrew: false,
      isActive: true,
      isAvailable: true,
      ownerId: admin.id
    }
  ]

  for (const boatData of boats) {
    const boat = await prisma.boat.upsert({
      where: { name: boatData.name },
      update: boatData,
      create: boatData
    })
    console.log(`✅ Boat created: ${boat.name}`)
  }

  // Create test bookings
  const boat1 = await prisma.boat.findFirst({ where: { name: 'Лазурная мечта' } })
  const boat2 = await prisma.boat.findFirst({ where: { name: 'Морской бриз' } })

  if (boat1 && boat2) {
    // Past booking (completed)
    const pastBooking = await prisma.booking.create({
      data: {
        userId: user1.id,
        boatId: boat1.id,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
        hours: 3,
        passengers: 4,
        totalPrice: 45000,
        status: 'COMPLETED',
        customerName: 'Иван Иванов',
        customerPhone: '+7 (900) 123-45-67',
        customerEmail: 'ivan@example.com',
        confirmedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      }
    })
    console.log(`✅ Past booking created: ${pastBooking.id}`)

    // Future booking (confirmed)
    const futureBooking = await prisma.booking.create({
      data: {
        userId: user1.id,
        boatId: boat2.id,
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours later
        hours: 4,
        passengers: 8,
        totalPrice: 100000,
        status: 'CONFIRMED',
        customerName: 'Иван Иванов',
        customerPhone: '+7 (900) 123-45-67',
        customerEmail: 'ivan@example.com',
        confirmedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    })
    console.log(`✅ Future booking created: ${futureBooking.id}`)
  }

  // Create group trips
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const dayAfter = new Date()
  dayAfter.setDate(dayAfter.getDate() + 2)
  dayAfter.setHours(11, 0, 0, 0)

  const in3Days = new Date()
  in3Days.setDate(in3Days.getDate() + 3)
  in3Days.setHours(6, 0, 0, 0)

  const groupTrips = [
    {
      type: 'SHORT' as const,
      duration: 45,
      price: 2200,
      maxCapacity: 20,
      availableSeats: 18,
      departureDate: tomorrow,
      departureTime: '10:00',
      status: 'SCHEDULED' as const
    },
    {
      type: 'MEDIUM' as const,
      duration: 90,
      price: 2500,
      maxCapacity: 20,
      availableSeats: 15,
      departureDate: dayAfter,
      departureTime: '11:00',
      status: 'SCHEDULED' as const
    },
    {
      type: 'FISHING' as const,
      duration: 180,
      price: 3000,
      maxCapacity: 15,
      availableSeats: 12,
      departureDate: in3Days,
      departureTime: '06:00',
      status: 'SCHEDULED' as const
    }
  ]

  for (const tripData of groupTrips) {
    const trip = await prisma.groupTrip.create({
      data: tripData
    })
    console.log(`✅ Group trip created: ${trip.type} on ${trip.departureDate.toLocaleDateString()}`)
  }

  // Create group trip services
  const groupTripServices = [
    {
      type: 'SHORT' as const,
      duration: 45,
      price: 2200,
      title: 'Прогулка 45 минут',
      description: 'Небольшая обзорная прогулка по морю. Идеально для первого знакомства с морскими просторами. Насладитесь свежим морским воздухом и живописными видами побережья Сочи.',
      isActive: true
    },
    {
      type: 'MEDIUM' as const,
      duration: 90,
      price: 2500,
      title: 'Прогулка 1.5 часа',
      description: 'Прогулка под парусами на 1.5 часа. Насладитесь ветром, тишиной и красотой Черного моря. Идеально для романтических моментов и спокойного отдыха.',
      isActive: true
    },
    {
      type: 'FISHING' as const,
      duration: 180,
      price: 3000,
      title: 'Рыбалка 3 часа',
      description: 'Рыбалка в Черном море на 3 часа. Профессиональное снаряжение и опытный капитан обеспечат отличный улов. Все необходимое оборудование предоставляется.',
      isActive: true
    }
  ]

  for (const serviceData of groupTripServices) {
    const service = await prisma.groupTripService.upsert({
      where: { type: serviceData.type },
      update: serviceData,
      create: serviceData
    })
    console.log(`✅ Group trip service created: ${service.title}`)
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
