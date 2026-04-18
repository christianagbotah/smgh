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
    const orders = await db.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    })

    const header = [
      'Order Number',
      'Customer Name',
      'Email',
      'Phone',
      'Status',
      'Payment Status',
      'Total (₵)',
      'Tracking Number',
      'Date',
    ].join(',')

    const rows = orders.map((order) =>
      [
        csvEscape(order.orderNumber),
        csvEscape(order.customerName),
        csvEscape(order.customerEmail),
        csvEscape(order.customerPhone),
        csvEscape(order.status),
        csvEscape(order.paymentStatus),
        csvEscape(order.totalAmount),
        csvEscape(order.trackingNumber),
        csvEscape(order.createdAt.toISOString()),
      ].join(',')
    )

    const csv = [header, ...rows].join('\r\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=orders.csv',
      },
    })
  } catch (error) {
    console.error('Failed to export orders:', error)
    return NextResponse.json({ error: 'Failed to export orders' }, { status: 500 })
  }
}
