import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const members = await db.teamMember.findMany({
      where: category ? { category, active: true } : undefined,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    })
    return NextResponse.json(members)
  } catch (error) {
    console.error('Team GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { name, role, photo, bio, email, phone, socialLinks, category, sortOrder, active } = body

    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 })
    }

    const member = await db.teamMember.create({
      data: {
        name,
        role,
        photo: photo || null,
        bio: bio || null,
        email: email || null,
        phone: phone || null,
        socialLinks: socialLinks || null,
        category: category || 'leadership',
        sortOrder: sortOrder || 0,
        active: active !== undefined ? active : true,
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Team POST error:', error)
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Team member ID is required' }, { status: 400 })
    }

    const member = await db.teamMember.update({ where: { id }, data })
    return NextResponse.json(member)
  } catch (error) {
    console.error('Team PUT error:', error)
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Team member ID is required' }, { status: 400 })
    }

    await db.teamMember.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Team DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 })
  }
}
