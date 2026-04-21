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
    const subscribers = await db.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const header = ['Email', 'Status', 'Date'].join(',')

    const rows = subscribers.map((s) =>
      [
        csvEscape(s.email),
        csvEscape(s.active ? 'Active' : 'Inactive'),
        csvEscape(s.createdAt.toISOString()),
      ].join(',')
    )

    const csv = [header, ...rows].join('\r\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=subscribers.csv',
      },
    })
  } catch (error) {
    console.error('Failed to export subscribers:', error)
    return NextResponse.json({ error: 'Failed to export subscribers' }, { status: 500 })
  }
}
