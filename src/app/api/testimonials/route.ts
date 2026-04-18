import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const testimonials = await db.eventTestimonial.findMany({
      include: {
        event: {
          select: { title: true, date: true, slug: true },
        },
      },
      orderBy: { event: { date: 'desc' } },
      take: 20,
    })
    return NextResponse.json(testimonials)
  } catch (error) {
    console.error('Testimonials GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 })
  }
}
