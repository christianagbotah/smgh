import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET — list products (admin: all, public: active only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const category = searchParams.get('category')
    const all = searchParams.get('all') // admin flag
    const id = searchParams.get('id')

    if (id) {
      const product = await db.product.findUnique({
        where: { id },
        include: {
          variants: { orderBy: [{ colorName: 'asc' }, { size: 'asc' }] },
          event: { select: { title: true, slug: true } },
        },
      })
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      return NextResponse.json(product)
    }

    const where: any = {}
    if (!all) where.isActive = true
    if (eventId) where.eventId = eventId
    if (category) where.category = category

    const products = await db.product.findMany({
      where,
      include: {
        variants: { orderBy: [{ colorName: 'asc' }, { size: 'asc' }] },
        event: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST — create product or variant
export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()

    // Create variant
    if (body.action === 'create-variant') {
      const { productId, name, color, colorName, size, price, stock, image } = body
      if (!productId || !colorName || !size) {
        return NextResponse.json({ error: 'productId, colorName, and size are required' }, { status: 400 })
      }
      const variant = await db.productVariant.create({
        data: {
          productId,
          name: name || `${colorName} / ${size}`,
          color: color || '#000000',
          colorName,
          size,
          price: parseFloat(price) || 0,
          stock: parseInt(stock) || 0,
          image: image || null,
        },
      })
      // Update product base price if no price set
      const product = await db.product.findUnique({ where: { id: productId } })
      if (product && (!product.basePrice || product.basePrice === 0) && price) {
        await db.product.update({ where: { id: productId }, data: { basePrice: parseFloat(price) } })
      }
      return NextResponse.json(variant)
    }

    // Create product
    const { name, slug, description, basePrice, category, eventId, primaryImage, galleryImages, fabric, style, fit, material, careInstructions } = body
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Check slug uniqueness
    const existing = await db.product.findUnique({ where: { slug: finalSlug } })
    if (existing) return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 400 })

    const product = await db.product.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        basePrice: parseFloat(basePrice) || 0,
        category: category || 'tshirt',
        eventId: eventId || null,
        primaryImage: primaryImage || null,
        galleryImages: galleryImages || null,
        fabric: fabric || null,
        style: style || null,
        fit: fit || null,
        material: material || null,
        careInstructions: careInstructions || null,
      },
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Product create error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create' }, { status: 500 })
  }
}

// PUT — update product or variant
export async function PUT(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()

    // Update variant
    if (body.action === 'update-variant') {
      const { id, name, color, colorName, size, price, stock, image, isActive } = body
      if (!id) return NextResponse.json({ error: 'Variant id is required' }, { status: 400 })

      const updateData: any = {}
      if (name !== undefined) updateData.name = name
      if (color !== undefined) updateData.color = color
      if (colorName !== undefined) updateData.colorName = colorName
      if (size !== undefined) updateData.size = size
      if (price !== undefined) updateData.price = parseFloat(price) || 0
      if (stock !== undefined) updateData.stock = parseInt(stock) || 0
      if (image !== undefined) updateData.image = image || null
      if (isActive !== undefined) updateData.isActive = isActive

      const variant = await db.productVariant.update({
        where: { id },
        data: updateData,
      })
      return NextResponse.json(variant)
    }

    // Update product
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Product id is required' }, { status: 400 })

    const updateData: any = {}
    const allowedFields = ['name', 'slug', 'description', 'basePrice', 'category', 'eventId', 'primaryImage', 'galleryImages', 'fabric', 'style', 'fit', 'material', 'careInstructions', 'isActive']
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = field === 'basePrice' ? parseFloat(updates[field]) || 0 : updates[field]
      }
    }

    const product = await db.product.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Product update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 })
  }
}

// DELETE — delete product or variant
export async function DELETE(request: NextRequest) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const variantId = searchParams.get('variantId')

    if (variantId) {
      await db.productVariant.delete({ where: { id: variantId } })
      return NextResponse.json({ success: true })
    }

    if (!id) return NextResponse.json({ error: 'Id is required' }, { status: 400 })

    await db.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Product delete error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 })
  }
}
