import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/custom-pages - List all custom pages
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const pages = await db.customPage.findMany({
    where: status ? { status } : undefined,
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      slug: true,
      title: true,
      bannerImage: true,
      status: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  return NextResponse.json(pages)
}

// POST /api/custom-pages - Create a new page
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { slug, title, content, bannerImage, status, sortOrder } = body

  if (!slug || !title) {
    return NextResponse.json({ error: 'Slug and title are required' }, { status: 400 })
  }

  // Check for duplicate slug
  const existing = await db.customPage.findUnique({ where: { slug: slug.replace(/^\/+|\/+$/g, '') } })
  if (existing) {
    return NextResponse.json({ error: 'A page with this slug already exists' }, { status: 400 })
  }

  const page = await db.customPage.create({
    data: {
      slug: slug.replace(/^\/+|\/+$/g, ''),
      title,
      content: content || '',
      bannerImage,
      status: status || 'draft',
      sortOrder: sortOrder || 0,
    },
  })

  return NextResponse.json(page, { status: 201 })
}
