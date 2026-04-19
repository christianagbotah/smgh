import { config } from 'dotenv'
import { join } from 'path'
// Load .env explicitly to ensure correct DB path (system env vars may override)
config({ path: process.cwd() + '/.env', override: true })

import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  let dbUrl = process.env.DATABASE_URL || ''

  // If DATABASE_URL doesn't start with file: or mysql:, it's invalid — fix it
  if (!dbUrl.startsWith('file:') && !dbUrl.startsWith('mysql://')) {
    // Default to SQLite relative to project root
    dbUrl = `file:${join(process.cwd(), 'prisma', 'db', 'smgh.db')}`
  }

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
