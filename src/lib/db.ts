import { config } from 'dotenv'
// Load .env explicitly to ensure correct DB path (system env vars may override)
config({ path: process.cwd() + '/.env', override: true })

import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || ''

  // Only add connection pool parameters for MySQL (remote databases)
  const isMySQL = dbUrl.startsWith('mysql://')
  const finalUrl = isMySQL
    ? `${dbUrl}${dbUrl.includes('?') ? '&' : '?'}connection_limit=5&pool_timeout=30&connect_timeout=10`
    : dbUrl

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    datasources: {
      db: {
        url: finalUrl,
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
