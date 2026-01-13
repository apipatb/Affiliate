import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { productUpdateSchema, validateData } from '@/lib/validations'
import { rateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
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

    const product = await prisma.product.update({
      where: { id },
      data: validation.data,
      include: { category: true },
    })

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
