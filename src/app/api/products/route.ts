import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { productSchema, validateData } from '@/lib/validations'
import { rateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const categorySlug = searchParams.get('category') // For public pages (by slug)
  const categoryId = searchParams.get('categoryId') // For admin pages (by ID)
  const search = searchParams.get('search')
  const featured = searchParams.get('featured')
  const sort = searchParams.get('sort')
  const minRating = searchParams.get('minRating')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')

  // Pagination parameters
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  // Allow higher limit for admin requests (10000 for admin, 100 for public)
  const requestedLimit = parseInt(searchParams.get('limit') || '20')
  const limit = requestedLimit > 1000 ? Math.min(10000, requestedLimit) : Math.min(100, requestedLimit)
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  // Category filter (support both slug and ID)
  if (categoryId) {
    where.categoryId = categoryId
  } else if (categorySlug) {
    where.category = { slug: categorySlug }
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

  // Rating filter
  if (minRating) {
    where.rating = { gte: parseFloat(minRating) }
  }

  // Price range filter
  if (minPrice || maxPrice) {
    where.price = {}
    if (minPrice) {
      ;(where.price as any).gte = parseFloat(minPrice)
    }
    if (maxPrice) {
      ;(where.price as any).lte = parseFloat(maxPrice)
    }
  }

  // Determine orderBy based on sort parameter
  let orderBy: any = { createdAt: 'desc' } // default

  switch (sort) {
    case 'popular':
      orderBy = { clicks: 'desc' }
      break
    case 'rating':
      orderBy = { rating: 'desc' }
      break
    case 'price-low':
      orderBy = { price: 'asc' }
      break
    case 'price-high':
      orderBy = { price: 'desc' }
      break
    default:
      orderBy = { createdAt: 'desc' }
  }

  // Get total count for pagination metadata
  const total = await prisma.product.count({ where })

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      media: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy,
    skip,
    take: limit,
  })

  return NextResponse.json({
    data: products,
    products, // Also return products for infinite scroll compatibility
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
    totalPages: Math.ceil(total / limit), // For infinite scroll compatibility
    currentPage: page, // For infinite scroll compatibility
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

    const { title, description, price, affiliateUrl, imageUrl, categoryId, featured, mediaType, platform, media } = validation.data

    // Validate categoryId exists
    const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Invalid categoryId: category does not exist' },
        { status: 400 }
      )
    }

    // Create product with media gallery
    const productData: any = {
      title,
      description,
      price,
      affiliateUrl,
      imageUrl,
      categoryId,
      featured,
      mediaType,
      platform, // Platform field added to schema
      // Create ProductMedia records if media array provided
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
    }

    const product = await prisma.product.create({
      data: productData,
      include: {
        category: true,
        media: {
          orderBy: { order: 'asc' },
        },
      },
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
