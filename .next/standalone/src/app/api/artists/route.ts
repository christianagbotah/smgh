import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const artists = await db.artist.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(artists)
  } catch (error) {
    console.error('Artists GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch artists' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { name, location, bio, image, featured } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const artist = await db.artist.create({
      data: {
        name,
        location: location || null,
        bio: bio || null,
        image: image || null,
        featured: featured || false,
      },
    })

    return NextResponse.json(artist, { status: 201 })
  } catch (error) {
    console.error('Artists POST error:', error)
    return NextResponse.json({ error: 'Failed to create artist' }, { status: 500 })
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
      return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 })
    }

    const artist = await db.artist.update({ where: { id }, data })
    return NextResponse.json(artist)
  } catch (error) {
    console.error('Artists PUT error:', error)
    return NextResponse.json({ error: 'Failed to update artist' }, { status: 500 })
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
      return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 })
    }

    await db.artist.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Artists DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete artist' }, { status: 500 })
  }
}
