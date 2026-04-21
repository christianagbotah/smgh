import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const donorType = searchParams.get('donorType')

    const where: Record<string, string> = {}
    if (status) where.status = status
    if (donorType) where.donorType = donorType

    const donations = await db.donation.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
    })

    const stats = await db.donation.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: 'completed' },
    })

    return NextResponse.json({
      donations,
      stats: {
        total: stats._sum.amount || 0,
        count: stats._count,
      },
    })
  } catch (error) {
    console.error('Donations GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const { allowed, retryAfter } = rateLimit(`donate:${ip}`)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) }
    })
  }

  try {
    const body = await request.json()
    const {
      name, email, phone, address, amount, currency, paymentMethod,
      reference, message, donorType, donationFrequency, organization
    } = body

    if (!name || !amount) {
      return NextResponse.json({ error: 'Name and amount are required' }, { status: 400 })
    }

    const donation = await db.donation.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        amount: parseFloat(amount),
        currency: currency || 'GHS',
        paymentMethod: paymentMethod || 'manual',
        reference: reference || null,
        message: message || null,
        donorType: donorType || 'individual',
        donationFrequency: donationFrequency || null,
        organization: organization || null,
      },
    })

    return NextResponse.json(donation, { status: 201 })
  } catch (error) {
    console.error('Donations POST error:', error)
    return NextResponse.json({ error: 'Failed to create donation' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { id, status, reference } = body

    if (!id) {
      return NextResponse.json({ error: 'Donation ID is required' }, { status: 400 })
    }

    const donation = await db.donation.update({
      where: { id },
      data: { status, reference },
    })

    return NextResponse.json(donation)
  } catch (error) {
    console.error('Donations PUT error:', error)
    return NextResponse.json({ error: 'Failed to update donation' }, { status: 500 })
  }
}
