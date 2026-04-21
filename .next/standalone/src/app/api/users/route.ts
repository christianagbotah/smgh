import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { hash } from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/users - List all admin users
export async function GET() {
  const auth = await requireAuth()
  if (!auth || auth.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const users = await db.adminUser.findMany({
    select: { id: true, username: true, name: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(users)
}

// POST /api/users - Create new admin user
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth || auth.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { username, password, name, role } = body

  if (!username || !password || !name) {
    return NextResponse.json({ error: 'Username, password, and name are required' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const existing = await db.adminUser.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
  }

  const hashedPassword = await hash(password, 10)
  const user = await db.adminUser.create({
    data: { username, password: hashedPassword, name, role: role === 'super_admin' ? 'super_admin' : 'editor', active: true },
  })

  return NextResponse.json({ id: user.id, username: user.username, name: user.name, role: user.role, active: user.active }, { status: 201 })
}
