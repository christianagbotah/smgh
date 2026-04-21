import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const records = await db.foundationRecord.findMany({
      orderBy: { year: 'desc' },
      include: {
        galleryItems: { orderBy: { sortOrder: 'asc' } },
      },
    })
    const totalBeneficiaries = records.reduce((sum, r) => sum + (r.beneficiariesCount || 0), 0)
    const totalRaised = records.reduce((sum, r) => sum + (r.amountRaised || 0), 0)
    return NextResponse.json({ records, totalBeneficiaries, totalRaised })
  } catch (error) {
    console.error('Foundation GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch foundation records' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { year, description, amountRaised, amountSpent, beneficiariesCount, locations } = body

    if (!year || !description) {
      return NextResponse.json({ error: 'Year and description are required' }, { status: 400 })
    }

    const record = await db.foundationRecord.create({
      data: {
        year,
        description,
        amountRaised: amountRaised || null,
        amountSpent: amountSpent || null,
        beneficiariesCount: beneficiariesCount || null,
        locations: locations || null,
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Foundation POST error:', error)
    return NextResponse.json({ error: 'Failed to create foundation record' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Foundation record ID is required' }, { status: 400 })
    }

    const record = await db.foundationRecord.update({ where: { id }, data })
    return NextResponse.json(record)
  } catch (error) {
    console.error('Foundation PUT error:', error)
    return NextResponse.json({ error: 'Failed to update foundation record' }, { status: 500 })
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
      return NextResponse.json({ error: 'Foundation record ID is required' }, { status: 400 })
    }

    await db.foundationRecord.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Foundation DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete foundation record' }, { status: 500 })
  }
}
