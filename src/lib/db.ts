import { join } from 'path'
import { PrismaClient } from '@/generated/prisma'

// This project uses SQLite — always use the local database file
// Ignore any DATABASE_URL env var (cPanel may set a MySQL one)
const SQLITE_PATH = `file:${join(process.cwd(), 'prisma', 'db', 'smgh.db')}`

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    datasources: {
      db: {
        url: SQLITE_PATH,
      },
    },
  })
}

// Prevent process crashes from DB disconnects
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})

export const db =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
