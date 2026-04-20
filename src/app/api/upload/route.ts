import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'
]
const ALLOWED_VIDEO_TYPES = [
  'video/mp4', 'video/webm', 'video/quicktime'
]
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]

// Max file size: 10MB
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // Auth check (optional for now — allow uploads from admin)
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const alt = (formData.get('alt') as string) || 'Uploaded file'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not allowed. Allowed: JPG, PNG, GIF, WebP, SVG, MP4, WebM, MOV` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed: 10MB` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'bin'
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`

    // Save to public/uploads/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const filepath = path.join(uploadDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const url = `/uploads/${filename}`

    // Save to MediaFile DB record
    await db.mediaFile.create({
      data: {
        filename: file.name,
        url,
        mimeType: file.type,
        size: file.size,
        alt,
      },
    })

    return NextResponse.json({ url, filename, size: file.size, mimeType: file.type })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
