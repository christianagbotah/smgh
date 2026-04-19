import { NextResponse } from 'next/server'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cwd = process.cwd()
  const dbPath = join(cwd, 'prisma', 'db', 'smgh.db')
  const dbUrl = `file:${dbPath}`
  const envUrl = process.env.DATABASE_URL || '(empty)'

  // Try to list files in cwd
  const fs = await import('fs')
  let files: string[] = []
  try {
    files = fs.readdirSync(cwd)
  } catch (e: any) {
    files = [`Error reading cwd: ${e.message}`]
  }

  // Check if db file exists
  let dbExists = false
  let dbSize = 0
  try {
    dbExists = fs.existsSync(dbPath)
    if (dbExists) dbSize = fs.statSync(dbPath).size
  } catch {}

  // Check if prisma directory exists
  let prismaExists = false
  try {
    prismaExists = fs.existsSync(join(cwd, 'prisma'))
  } catch {}

  // Check if db directory exists
  let dbDirExists = false
  try {
    dbDirExists = fs.existsSync(join(cwd, 'prisma', 'db'))
  } catch {}

  return NextResponse.json({
    cwd,
    dbPath,
    dbUrl,
    envUrl,
    dbExists,
    dbSize,
    prismaExists,
    dbDirExists,
    files: files.slice(0, 20),
  })
}
