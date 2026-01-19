import { PrismaClient } from '@prisma/client'

// Prisma client singleton
// Prevents multiple instances during hot reload in development

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error']
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Helper function to get Prisma client
export function usePrisma() {
  return prisma
}

// Graceful shutdown
export async function disconnectPrisma() {
  await prisma.$disconnect()
}
