import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { productUpdateSchema, validateData } from '@/lib/validations'
import { rateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      media: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json(product)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  // Check authentication
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  // Rate limiting
  const identifier = getClientIdentifier(request)
  const rateLimitResult = rateLimit(identifier, RateLimitPresets.MODERATE)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { id } = await context.params
    const body = await request.json()

    // Validate request body
    const validation = validateData(productUpdateSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      )
    }

    const { media, ...updateData } = validation.data

    // If media array is provided, delete old media and create new ones
    if (media !== undefined) {
      // Delete existing media
      await prisma.productMedia.deleteMany({
        where: { productId: id },
      })
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        // Create new ProductMedia records if media array provided
        ...(media && media.length > 0
          ? {
              media: {
                create: media.map((item: any) => ({
                  url: item.url,
                  type: item.type || 'IMAGE',
                  order: item.order || 0,
                })),
              },
            }
          : {}),
      },
      include: {
        category: true,
        media: {
          orderBy: { order: 'asc' },
        },
      },
    })

    // Revalidate pages to show updated product
    revalidatePath('/', 'layout')
    revalidatePath('/products')
    revalidatePath('/featured')
    revalidatePath(`/products/${id}`)

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  // Check authentication
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  // Rate limiting
  const identifier = getClientIdentifier(request)
  const rateLimitResult = rateLimit(identifier, RateLimitPresets.MODERATE)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { id } = await context.params

    await prisma.product.delete({
      where: { id },
    })

    // Revalidate pages after deleting product
    revalidatePath('/', 'layout')
    revalidatePath('/products')
    revalidatePath('/featured')
    revalidatePath('/categories')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
