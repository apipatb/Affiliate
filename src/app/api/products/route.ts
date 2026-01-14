import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { productSchema, validateData } from '@/lib/validations'
import { rateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const featured = searchParams.get('featured')

  // Pagination parameters
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (category) {
    where.category = { slug: category }
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ]
  }

  if (featured === 'true') {
    where.featured = true
  } else if (featured === 'false') {
    where.featured = false
  }

  // Get total count for pagination metadata
  const total = await prisma.product.count({ where })

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  })

  return NextResponse.json({
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  })
}

export async function POST(request: NextRequest) {
  // Check authentication
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  // Rate limiting
  const identifier = getClientIdentifier(request)
  const rateLimitResult = rateLimit(identifier, RateLimitPresets.MODERATE)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        limit: rateLimitResult.limit,
        reset: new Date(rateLimitResult.reset).toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    )
  }

  try {
    const body = await request.json()

    // Validate request body
    const validation = validateData(productSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      )
    }

    const { title, description, price, affiliateUrl, imageUrl, categoryId, featured, mediaType } = validation.data

    // Validate categoryId exists
    const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Invalid categoryId: category does not exist' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price,
        affiliateUrl,
        imageUrl,
        categoryId,
        featured,
        mediaType,
      },
      include: { category: true },
    })

    // Revalidate pages to show new product
    revalidatePath('/', 'layout')
    revalidatePath('/products')
    if (featured) {
      revalidatePath('/featured')
    }
    revalidatePath('/categories')

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create product', details: errorMessage },
      { status: 500 }
    )
  }
}
