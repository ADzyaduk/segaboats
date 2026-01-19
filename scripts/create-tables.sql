-- SQL скрипт для создания всех таблиц базы данных
-- Выполнить: docker exec -i boats2026-db psql -U boats -d boats2026 < create-tables.sql

-- Создание ENUM типов
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'OWNER');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PAID', 'CANCELLED', 'COMPLETED');
CREATE TYPE "BoatType" AS ENUM ('YACHT', 'CATAMARAN', 'SPEEDBOAT', 'SAILBOAT');
CREATE TYPE "GroupTripType" AS ENUM ('SHORT', 'MEDIUM', 'FISHING');
CREATE TYPE "GroupTripStatus" AS ENUM ('SCHEDULED', 'FULL', 'COMPLETED', 'CANCELLED');
CREATE TYPE "GroupTripTicketStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- Таблица User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "telegramUsername" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
CREATE INDEX "User_telegramId_idx" ON "User"("telegramId");
CREATE INDEX "User_role_idx" ON "User"("role");

-- Таблица Boat
CREATE TABLE "Boat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "detailedDescription" TEXT,
    "type" "BoatType" NOT NULL DEFAULT 'YACHT',
    "capacity" INTEGER NOT NULL,
    "recommendedCapacity" INTEGER,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "year" INTEGER,
    "pricePerHour" INTEGER NOT NULL,
    "pricePerDay" INTEGER,
    "minimumHours" INTEGER NOT NULL DEFAULT 2,
    "images" TEXT NOT NULL DEFAULT '[]',
    "thumbnail" TEXT,
    "location" TEXT NOT NULL DEFAULT 'Сочи',
    "pier" TEXT,
    "features" TEXT NOT NULL DEFAULT '[]',
    "hasCapitan" BOOLEAN NOT NULL DEFAULT true,
    "hasCrew" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT,

    CONSTRAINT "Boat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Boat_name_key" ON "Boat"("name");
CREATE INDEX "Boat_type_idx" ON "Boat"("type");
CREATE INDEX "Boat_isActive_isAvailable_idx" ON "Boat"("isActive", "isAvailable");
CREATE INDEX "Boat_pricePerHour_idx" ON "Boat"("pricePerHour");

-- Таблица Booking
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "hours" INTEGER NOT NULL,
    "passengers" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "deposit" INTEGER,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerNotes" TEXT,
    "paymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Booking_status_idx" ON "Booking"("status");
CREATE INDEX "Booking_startDate_endDate_idx" ON "Booking"("startDate", "endDate");
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX "Booking_boatId_idx" ON "Booking"("boatId");

-- Таблица TelegramLog
CREATE TABLE "TelegramLog" (
    "id" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "updateType" TEXT NOT NULL,
    "chatId" TEXT,
    "userId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TelegramLog_updateId_idx" ON "TelegramLog"("updateId");
CREATE INDEX "TelegramLog_chatId_idx" ON "TelegramLog"("chatId");

-- Таблица GroupTrip
CREATE TABLE "GroupTrip" (
    "id" TEXT NOT NULL,
    "type" "GroupTripType" NOT NULL,
    "duration" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 11,
    "availableSeats" INTEGER NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "departureTime" TEXT,
    "boatId" TEXT,
    "status" "GroupTripStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupTrip_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GroupTrip_status_idx" ON "GroupTrip"("status");
CREATE INDEX "GroupTrip_departureDate_idx" ON "GroupTrip"("departureDate");
CREATE INDEX "GroupTrip_type_idx" ON "GroupTrip"("type");

-- Таблица GroupTripService
CREATE TABLE "GroupTripService" (
    "id" TEXT NOT NULL,
    "type" "GroupTripType" NOT NULL,
    "duration" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupTripService_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroupTripService_type_key" ON "GroupTripService"("type");

-- Таблица GroupTripTicket
CREATE TABLE "GroupTripTicket" (
    "id" TEXT NOT NULL,
    "tripId" TEXT,
    "serviceType" "GroupTripType" NOT NULL,
    "userId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "desiredDate" TIMESTAMP(3),
    "status" "GroupTripTicketStatus" NOT NULL DEFAULT 'PENDING',
    "totalPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "GroupTripTicket_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GroupTripTicket_tripId_idx" ON "GroupTripTicket"("tripId");
CREATE INDEX "GroupTripTicket_serviceType_idx" ON "GroupTripTicket"("serviceType");
CREATE INDEX "GroupTripTicket_userId_idx" ON "GroupTripTicket"("userId");
CREATE INDEX "GroupTripTicket_status_idx" ON "GroupTripTicket"("status");

-- Внешние ключи
ALTER TABLE "Boat" ADD CONSTRAINT "Boat_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GroupTrip" ADD CONSTRAINT "GroupTrip_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroupTripTicket" ADD CONSTRAINT "GroupTripTicket_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "GroupTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupTripTicket" ADD CONSTRAINT "GroupTripTicket_serviceType_fkey" FOREIGN KEY ("serviceType") REFERENCES "GroupTripService"("type") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GroupTripTicket" ADD CONSTRAINT "GroupTripTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
