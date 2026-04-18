import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

// GET: List all media files from the database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'image', 'video', or null for all
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}
    if (type) {
      where.mimeType = type === 'image' ? { startsWith: 'image/' } : { startsWith: 'video/' }
    }
    if (search) {
      where.OR = [
        { filename: { contains: search } },
        { alt: { contains: search } },
      ]
    }

    const [files, total] = await Promise.all([
      db.mediaFile.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      db.mediaFile.count(),
    ])

    return NextResponse.json({
      files,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Media GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 })
  }
}

// DELETE: Remove a media file record (does not delete physical file)
export async function DELETE(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Media file ID is required' }, { status: 400 })
    }

    await db.mediaFile.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Media DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 })
  }
}
