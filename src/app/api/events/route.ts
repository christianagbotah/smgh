import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const slug = searchParams.get('slug')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (slug) {
      // Try full query with relations first
      let event = null
      try {
        event = await db.event.findFirst({
          where: { slug },
          include: {
            artists: { include: { artist: true }, orderBy: { sortOrder: 'asc' } },
            guests: { orderBy: { sortOrder: 'asc' } },
            testimonials: true,
            galleryItems: { orderBy: { sortOrder: 'asc' } },
          },
        })
      } catch {
        // Fallback: try without relations if schema is out of sync
        console.warn('Event detail query failed, trying without relations')
        try {
          event = await db.event.findFirst({
            where: { slug },
            include: {
              artists: { include: { artist: true } },
              guests: true,
              testimonials: true,
              galleryItems: true,
            },
          })
        } catch {
          // Final fallback: basic query without any relations
          event = await db.event.findFirst({ where: { slug } })
        }
      }
      if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      return NextResponse.json(event)
    }

    const events = await db.event.findMany({
      where: status ? { status } : undefined,
      orderBy: { date: 'desc' },
      take: limit,
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Events GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const {
      title, slug, date, time, venue, city, address,
      description, bannerImage, status, tags, youtubeUrls,
      artists, guests, testimonials
    } = body

    if (!title || !date || !venue || !city) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const event = await db.event.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        date: new Date(date),
        time: time || null,
        venue,
        city,
        address: address || null,
        description: description || null,
        bannerImage: bannerImage || null,
        status: status || 'upcoming',
        tags: tags || null,
        youtubeUrls: youtubeUrls || null,
        artists: artists ? {
          create: artists.map((a: { artistId: string; sortOrder: number }) => ({
            artistId: a.artistId,
            sortOrder: a.sortOrder || 0,
          })),
        } : undefined,
        guests: guests ? {
          create: guests.map((g: { name: string; title?: string; photo?: string; description?: string; sortOrder?: number }) => ({
            name: g.name,
            title: g.title || null,
            photo: g.photo || null,
            description: g.description || null,
            sortOrder: g.sortOrder || 0,
          })),
        } : undefined,
        testimonials: testimonials ? {
          create: testimonials.map((t: { quote: string; author: string; photo?: string }) => ({
            quote: t.quote,
            author: t.author,
            photo: t.photo || null,
          })),
        } : undefined,
      },
      include: {
        artists: true,
        guests: true,
        testimonials: true,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Events POST error:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { id, artists, guests, testimonials, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // If there are relational updates, handle them
    if (artists || guests || testimonials) {
      // Delete existing relations and recreate
      if (artists) {
        await db.eventArtist.deleteMany({ where: { eventId: id } })
        await db.eventArtist.createMany({
          data: artists.map((a: { artistId: string; sortOrder: number }) => ({
            eventId: id,
            artistId: a.artistId,
            sortOrder: a.sortOrder || 0,
          })),
        })
      }
      if (guests) {
        await db.eventGuest.deleteMany({ where: { eventId: id } })
        if (guests.length > 0) {
          await db.eventGuest.createMany({
            data: guests.map((g: { name: string; title?: string; photo?: string; description?: string; sortOrder?: number }) => ({
              eventId: id,
              name: g.name,
              title: g.title || null,
              photo: g.photo || null,
              description: g.description || null,
              sortOrder: g.sortOrder || 0,
            })),
          })
        }
      }
      if (testimonials) {
        await db.eventTestimonial.deleteMany({ where: { eventId: id } })
        if (testimonials.length > 0) {
          await db.eventTestimonial.createMany({
            data: testimonials.map((t: { quote: string; author: string; photo?: string }) => ({
              eventId: id,
              quote: t.quote,
              author: t.author,
              photo: t.photo || null,
            })),
          })
        }
      }
    }

    const event = await db.event.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: {
        artists: { include: { artist: true } },
        guests: true,
        testimonials: true,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Events PUT error:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
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
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    await db.event.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Events DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
