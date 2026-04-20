import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const info: Record<string, string> = {}
  try {
    info.NODE_ENV = process.env.NODE_ENV || 'not set'
    info.DATABASE_URL = (process.env.DATABASE_URL || 'not set').replace(/:.*@/, ':***@')
    info.PWD = process.cwd()
  } catch (e: any) {
    info.envError = e.message
  }

  try {
    const count = await db.siteSetting.count()
    info.dbStatus = 'OK'
    info.dbCount = String(count)
  } catch (e: any) {
    info.dbStatus = 'ERROR'
    info.dbError = e.message
    info.dbCode = e.code || 'none'
  }

  return NextResponse.json(info)
}
