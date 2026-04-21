import { PrismaClient } from '@/generated/prisma'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  // Log which engine is being used (helpful for debugging on cPanel)
  const isWasm = typeof WebAssembly !== 'undefined'
  if (isWasm) {
    console.warn(
      '[Prisma] WebAssembly is available — if you see WASM OOM errors, ' +
      'ensure the .node binary files are present in the deployment.'
    )
  }

  return client
}

// Prevent process crashes from DB disconnects
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})

export const db =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
