import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/users/:id - Update user role or active status
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth || auth.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { role, active } = body

  // Prevent super admin from deactivating themselves
  if (id === auth.id && active === false) {
    return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 })
  }

  const user = await db.adminUser.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const updated = await db.adminUser.update({
    where: { id },
    data: {
      ...(role !== undefined && { role }),
      ...(active !== undefined && { active }),
    },
    select: { id: true, username: true, name: true, role: true, active: true, createdAt: true },
  })

  return NextResponse.json(updated)
}

// DELETE /api/users/:id - Delete user
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth || auth.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params

  // Prevent self-deletion
  if (id === auth.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  await db.adminUser.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
