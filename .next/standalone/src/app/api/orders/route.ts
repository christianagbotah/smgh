import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('orderNumber')
    const phone = searchParams.get('phone')
    const email = searchParams.get('email')

    if (orderNumber) {
      const order = await db.order.findUnique({
        where: { orderNumber },
        include: { items: true },
      })
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      return NextResponse.json(order)
    }

    if (phone || email) {
      const orders = await db.order.findMany({
        where: {
          ...(phone ? { customerPhone: phone } : {}),
          ...(email ? { customerEmail: email } : {}),
        },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(orders)
    }

    // Admin: return all orders
    const orders = await db.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, customerPhone, deliveryAddress, deliveryCity, deliveryRegion, items, notes, paymentProvider } = body

    if (!customerName || !customerPhone || !items || items.length === 0) {
      return NextResponse.json({ error: 'Name, phone, and at least one item are required' }, { status: 400 })
    }

    // Generate order number: SMGH-YYYYMMDD-XXXX
    const now = new Date()
    const dateStr = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0')
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const orderNumber = `SMGH-${dateStr}-${rand}`

    // Calculate total
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0)

    const order = await db.order.create({
      data: {
        orderNumber,
        customerName,
        customerEmail: customerEmail || null,
        customerPhone,
        deliveryAddress: deliveryAddress || null,
        deliveryCity: deliveryCity || null,
        deliveryRegion: deliveryRegion || null,
        totalAmount,
        currency: 'GHS',
        notes: notes || null,
        paymentProvider: paymentProvider || null,
        paymentStatus: paymentProvider ? 'pending' : 'pending',
        status: 'pending',
        items: {
          create: items.map((item: any) => ({
            productName: item.productName,
            variantName: item.variantName || null,
            productId: item.productId || null,
            productVariantId: item.productVariantId || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
