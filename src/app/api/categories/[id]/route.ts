import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { categoryUpdateSchema, validateData } from '@/lib/validations'
import { rateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      products: true,
      _count: { select: { products: true } },
    },
  })

  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  return NextResponse.json(category)
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
    const validation = validateData(categoryUpdateSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      )
    }

    const { name } = validation.data
    const slug = name ? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : undefined

    const category = await prisma.category.update({
      where: { id },
      data: { ...(name && { name, slug }) },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
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

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    })

    if (productCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with products. Remove products first.' },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
