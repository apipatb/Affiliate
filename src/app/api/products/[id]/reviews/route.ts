import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/products/[id]/reviews
 * Get reviews for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const rating = searchParams.get('rating')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: Record<string, unknown> = { productId: id }
    if (rating) {
      where.rating = parseInt(rating)
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          media: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ])

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId: id },
      _count: { rating: true },
    })

    // Calculate average rating
    const avgResult = await prisma.review.aggregate({
      where: { productId: id },
      _avg: { rating: true },
    })

    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }
    ratingDistribution.forEach((r) => {
      distribution[r.rating as keyof typeof distribution] = r._count.rating
    })

    return NextResponse.json({
      reviews,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      averageRating: avgResult._avg.rating || 0,
      distribution,
    })
  } catch (error) {
    console.error('[Reviews API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products/[id]/reviews
 * Create a new review (guest or logged in)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const body = await request.json()

    const { userName, userEmail, rating, comment } = body

    // Validate required fields
    if (!userName || !rating || !comment) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบ (ชื่อ, คะแนน, ความคิดเห็น)' },
        { status: 400 }
      )
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'คะแนนต้องอยู่ระหว่าง 1-5' },
        { status: 400 }
      )
    }

    // Validate comment length
    if (comment.length < 10) {
      return NextResponse.json(
        { error: 'ความคิดเห็นต้องมีอย่างน้อย 10 ตัวอักษร' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'ไม่พบสินค้านี้' },
        { status: 404 }
      )
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        productId,
        userName: userName.trim(),
        userEmail: userEmail?.trim() || null,
        rating,
        comment: comment.trim(),
        verified: false, // Guest reviews are not verified
      },
      include: {
        media: true,
      },
    })

    // Update product rating and review count
    const stats = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    })

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count.rating,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'ขอบคุณสำหรับรีวิว!',
      review,
    })
  } catch (error) {
    console.error('[Reviews API] Error:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถบันทึกรีวิวได้' },
      { status: 500 }
    )
  }
}
