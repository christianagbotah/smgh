import { db } from '@/lib/db'
import { hash, compare } from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'

const SESSION_COOKIE = 'smgh_session'
const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'login') {
      const { username, password } = body
      const admin = await db.adminUser.findUnique({ where: { username } })
      
      if (!admin) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const valid = await compare(password, admin.password)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const token = generateToken()
      const cookieStore = await cookies()
      cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      })

      // Store session in settings (simple approach for SQLite)
      await db.siteSetting.upsert({
        where: { key: `session_${token}` },
        update: { value: admin.id },
        create: { key: `session_${token}`, value: admin.id },
      })

      return NextResponse.json({ success: true, user: { name: admin.name, username: admin.username, role: admin.role || 'editor' } })
    }

    if (action === 'register') {
      const user = await requireAuth()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const { username, password, name } = body
      const existing = await db.adminUser.findUnique({ where: { username } })
      if (existing) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
      }

      const hashedPassword = await hash(password, 10)
      const admin = await db.adminUser.create({
        data: { username, password: hashedPassword, name, role: body.role === 'super_admin' ? 'super_admin' : 'editor' },
      })

      return NextResponse.json({ success: true, user: { name: admin.name, username: admin.username, role: admin.role } })
    }

    if (action === 'change-password') {
      const { currentPassword, newPassword } = body

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: 'Current password and new password are required' },
          { status: 400 }
        )
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters' },
          { status: 400 }
        )
      }

      // Validate session from cookie
      const cookieStore = await cookies()
      const token = cookieStore.get(SESSION_COOKIE)?.value

      if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }

      const session = await db.siteSetting.findUnique({
        where: { key: `session_${token}` },
      })

      if (!session) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 })
      }

      const admin = await db.adminUser.findUnique({ where: { id: session.value } })
      if (!admin) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 })
      }

      // Verify current password
      const isCurrentValid = await compare(currentPassword, admin.password)
      if (!isCurrentValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      // Hash new password and update
      const hashedNewPassword = await hash(newPassword, 10)
      await db.adminUser.update({
        where: { id: admin.id },
        data: { password: hashedNewPassword },
      })

      return NextResponse.json({ success: true, message: 'Password changed successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const session = await db.siteSetting.findUnique({
      where: { key: `session_${token}` },
    })

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const admin = await db.adminUser.findUnique({ where: { id: session.value } })
    if (!admin) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({ authenticated: true, user: { name: admin.name, username: admin.username, role: admin.role || 'editor' } })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value

    if (token) {
      await db.siteSetting.deleteMany({ where: { key: `session_${token}` } }).catch(() => {})
      cookieStore.delete(SESSION_COOKIE)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
