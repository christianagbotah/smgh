import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const eventId = searchParams.get('eventId')
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const foundationRecordId = searchParams.get('foundationRecordId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (year) where.year = parseInt(year)
    if (eventId) where.eventId = eventId
    if (type) where.type = type
    if (category) where.category = category
    if (foundationRecordId) where.foundationRecordId = foundationRecordId

    const items = await db.galleryItem.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { sortOrder: 'asc' },
      take: limit,
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Gallery GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch gallery items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const type = (formData.get('type') as string) || 'image'
    const eventId = formData.get('eventId') as string
    const foundationRecordId = formData.get('foundationRecordId') as string
    const year = formData.get('year') ? parseInt(formData.get('year') as string) : null
    const category = formData.get('category') as string
    const file = formData.get('file') as File | null

    let url = formData.get('url') as string

    if (file) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ext = file.name.split('.').pop()
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadDir, { recursive: true })
      const filepath = path.join(uploadDir, filename)
      await writeFile(filepath, buffer)
      url = `/uploads/${filename}`
    }

    if (!url) {
      return NextResponse.json({ error: 'File or URL is required' }, { status: 400 })
    }

    const item = await db.galleryItem.create({
      data: {
        title: title || null,
        description: description || null,
        type,
        url,
        eventId: eventId || null,
        foundationRecordId: foundationRecordId || null,
        year,
        category: category || null,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Gallery POST error:', error)
    return NextResponse.json({ error: 'Failed to create gallery item' }, { status: 500 })
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
      return NextResponse.json({ error: 'Gallery item ID is required' }, { status: 400 })
    }

    const item = await db.galleryItem.update({
      where: { id },
      data,
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Gallery PUT error:', error)
    return NextResponse.json({ error: 'Failed to update gallery item' }, { status: 500 })
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
      return NextResponse.json({ error: 'Gallery item ID is required' }, { status: 400 })
    }

    await db.galleryItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Gallery DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete gallery item' }, { status: 500 })
  }
}
