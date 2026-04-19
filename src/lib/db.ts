import { join } from 'path'
import { PrismaClient } from '@/generated/prisma'

// Always use SQLite at this path — ignore any env DATABASE_URL for SQLite
const SQLITE_PATH = `file:${join(process.cwd(), 'prisma', 'db', 'smgh.db')}`

function getDatabaseUrl(): string {
  // If DATABASE_URL is explicitly set to a remote MySQL, use it
  const envUrl = process.env.DATABASE_URL || ''
  if (envUrl.startsWith('mysql://')) {
    return `${envUrl}${envUrl.includes('?') ? '&' : '?'}connection_limit=5&pool_timeout=30&connect_timeout=10`
  }
  // Otherwise always use SQLite at the correct relative path
  return SQLITE_PATH
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    datasources: {
      db: {
        url: getDatabaseUrl(),
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
