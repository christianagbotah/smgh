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
    const donations = await db.donation.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const header = [
      'Name',
      'Email',
      'Phone',
      'Amount (₵)',
      'Status',
      'Payment Provider',
      'Donor Type',
      'Date',
    ].join(',')

    const rows = donations.map((d) =>
      [
        csvEscape(d.name),
        csvEscape(d.email),
        csvEscape(d.phone),
        csvEscape(d.amount),
        csvEscape(d.status),
        csvEscape(d.paymentProvider),
        csvEscape(d.donorType),
        csvEscape(d.createdAt.toISOString()),
      ].join(',')
    )

    const csv = [header, ...rows].join('\r\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=donations.csv',
      },
    })
  } catch (error) {
    console.error('Failed to export donations:', error)
    return NextResponse.json({ error: 'Failed to export donations' }, { status: 500 })
  }
}
