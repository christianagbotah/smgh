import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

function csvEscape(val: string | number | null | undefined): string {
  if (val == null) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET() {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const rsvps = await db.eventRSVP.findMany({
      orderBy: { createdAt: 'desc' },
      include: { event: { select: { title: true } } },
    })

    const header = [
      'Name',
      'Email',
      'Phone',
      'Guests',
      'Event ID',
      'Date',
    ].join(',')

    const rows = rsvps.map((r) =>
      [
        csvEscape(r.name),
        csvEscape(r.email),
        csvEscape(r.phone),
        csvEscape(r.guests),
        csvEscape(r.event.title),
        csvEscape(r.createdAt.toISOString()),
      ].join(',')
    )

    const csv = [header, ...rows].join('\r\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=rsvps.csv',
      },
    })
  } catch (error) {
    console.error('Failed to export RSVPs:', error)
    return NextResponse.json({ error: 'Failed to export RSVPs' }, { status: 500 })
  }
}
