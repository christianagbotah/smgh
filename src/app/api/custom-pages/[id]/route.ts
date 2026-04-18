import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/custom-pages/:id
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const page = await db.customPage.findUnique({ where: { id } })
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(page)
}

// PUT /api/custom-pages/:id
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { slug, title, content, bannerImage, status, sortOrder } = body

  const existing = await db.customPage.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check slug uniqueness if changing
  if (slug && slug !== existing.slug) {
    const slugExists = await db.customPage.findUnique({ where: { slug: slug.replace(/^\/+|\/+$/g, '') } })
    if (slugExists) return NextResponse.json({ error: 'Slug already in use' }, { status: 400 })
  }

  const page = await db.customPage.update({
    where: { id },
    data: {
      ...(slug !== undefined && { slug: slug.replace(/^\/+|\/+$/g, '') }),
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(bannerImage !== undefined && { bannerImage }),
      ...(status !== undefined && { status }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  })

  return NextResponse.json(page)
}

// DELETE /api/custom-pages/:id
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await db.customPage.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
