import { config } from 'dotenv'
import { join } from 'path'
// Load .env explicitly to ensure correct DB path (system env vars may override)
config({ path: process.cwd() + '/.env', override: true })

import { PrismaClient } from '@/generated/prisma'

// Force correct DATABASE_URL for SQLite regardless of env
if (!process.env.DATABASE_URL?.startsWith('file:') && !process.env.DATABASE_URL?.startsWith('mysql://')) {
  process.env.DATABASE_URL = `file:${join(process.cwd(), 'prisma', 'db', 'smgh.db')}`
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || `file:${join(process.cwd(), 'prisma', 'db', 'smgh.db')}`

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
