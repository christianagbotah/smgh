import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

function randomString(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  // Auth check
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const alt = formData.get('alt') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Extract extension from original filename
    const originalName = file.name
    const ext = path.extname(originalName) || '.bin'

    // Generate unique filename
    const newFilename = `${Date.now()}-${randomString()}${ext}`

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(uploadsDir, newFilename)
    await writeFile(filePath, buffer)

    // Create database record
    const mediaFile = await db.mediaFile.create({
      data: {
        filename: originalName,
        url: `/uploads/${newFilename}`,
        mimeType: file.type,
        size: file.size,
        alt: alt || null,
      },
    })

    return NextResponse.json({
      url: `/uploads/${newFilename}`,
      id: mediaFile.id,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
