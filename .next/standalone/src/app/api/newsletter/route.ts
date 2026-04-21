import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function GET() {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const subscribers = await db.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(subscribers)
  } catch (error) {
    console.error('Newsletter GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const { allowed, retryAfter } = rateLimit(`newsletter:${ip}`)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) }
    })
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const existing = await db.newsletterSubscriber.findUnique({ where: { email } })
    if (existing) {
      if (existing.active) {
        return NextResponse.json({ message: 'Already subscribed' }, { status: 200 })
      }
      const updated = await db.newsletterSubscriber.update({
        where: { email },
        data: { active: true },
      })
      return NextResponse.json(updated, { status: 200 })
    }

    const subscriber = await db.newsletterSubscriber.create({
      data: { email },
    })

    return NextResponse.json(subscriber, { status: 201 })
  } catch (error) {
    console.error('Newsletter POST error:', error)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
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
      return NextResponse.json({ error: 'Subscriber ID is required' }, { status: 400 })
    }

    await db.newsletterSubscriber.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Newsletter DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete subscriber' }, { status: 500 })
  }
}
