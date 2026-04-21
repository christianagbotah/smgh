import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    const rsvps = await db.eventRSVP.findMany({
      where: eventId ? { eventId } : undefined,
      include: { event: { select: { id: true, title: true, slug: true, date: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(rsvps)
  } catch (error) {
    console.error('RSVP GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch RSVPs' }, { status: 500 })
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
      return NextResponse.json({ error: 'RSVP ID is required' }, { status: 400 })
    }

    // Get RSVP to decrement attendance count
    const rsvp = await db.eventRSVP.findUnique({ where: { id } })
    if (rsvp) {
      await db.event.update({
        where: { id: rsvp.eventId },
        data: { attendanceCount: { decrement: rsvp.guests } },
      })
    }

    await db.eventRSVP.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('RSVP DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete RSVP' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const { allowed, retryAfter } = rateLimit(`rsvp:${ip}`)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) }
    })
  }

  try {
    const body = await request.json()
    const { eventId, name, email, phone, guests, message } = body

    if (!eventId || !name) {
      return NextResponse.json({ error: 'Event ID and name are required' }, { status: 400 })
    }

    const rsvp = await db.eventRSVP.create({
      data: {
        eventId,
        name,
        email: email || null,
        phone: phone || null,
        guests: guests || 1,
        message: message || null,
      },
    })

    // Update attendance count
    await db.event.update({
      where: { id: eventId },
      data: { attendanceCount: { increment: guests || 1 } },
    })

    return NextResponse.json(rsvp)
  } catch (error) {
    console.error('RSVP error:', error)
    return NextResponse.json({ error: 'Failed to create RSVP' }, { status: 500 })
  }
}
