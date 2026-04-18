import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const beneficiaries = await db.beneficiary.findMany({
      orderBy: { yearHelped: 'desc' },
    })
    return NextResponse.json(beneficiaries)
  } catch (error) {
    console.error('Beneficiaries GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch beneficiaries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { name, story, photo, category, location, yearHelped, active } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const beneficiary = await db.beneficiary.create({
      data: {
        name,
        story: story || null,
        photo: photo || null,
        category: category || null,
        location: location || null,
        yearHelped: yearHelped || null,
        active: active !== undefined ? active : true,
      },
    })

    return NextResponse.json(beneficiary, { status: 201 })
  } catch (error) {
    console.error('Beneficiaries POST error:', error)
    return NextResponse.json({ error: 'Failed to create beneficiary' }, { status: 500 })
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
      return NextResponse.json({ error: 'Beneficiary ID is required' }, { status: 400 })
    }

    const beneficiary = await db.beneficiary.update({ where: { id }, data })
    return NextResponse.json(beneficiary)
  } catch (error) {
    console.error('Beneficiaries PUT error:', error)
    return NextResponse.json({ error: 'Failed to update beneficiary' }, { status: 500 })
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
      return NextResponse.json({ error: 'Beneficiary ID is required' }, { status: 400 })
    }

    await db.beneficiary.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Beneficiaries DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete beneficiary' }, { status: 500 })
  }
}
