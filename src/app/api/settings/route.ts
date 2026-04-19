import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

// Keys that should never be exposed via the public GET endpoint
const SECRET_KEYS = [
  'paystack_secret_key',
  'hubtel_client_secret',
  'admin_password',
]

export async function GET() {
  try {
    const settings = await db.siteSetting.findMany()
    const settingsMap: Record<string, string> = {}
    settings.forEach(s => {
      // Mask secret keys - never return actual values
      if (SECRET_KEYS.includes(s.key)) {
        settingsMap[s.key] = s.value ? '********' : ''
      } else {
        settingsMap[s.key] = s.value
      }
    })
    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { settings } = body as { settings: Record<string, string> }

    if (!settings) {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 })
    }

    for (const [key, value] of Object.entries(settings)) {
      // Don't update secret keys if the value is masked
      if (SECRET_KEYS.includes(key) && value === '********') {
        continue
      }
      await db.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
