import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Redirect tracking route
 * Tracks clicks and redirects to affiliate URL
 *
 * Usage: /products/{productId}/go
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    // Find product
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        affiliateUrl: true,
        clicks: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Increment click count (fire and forget)
    prisma.product.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    }).catch((err) => {
      console.error('Failed to increment clicks:', err)
    })

    // Log click for analytics (optional)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer') || 'direct'

    console.log('Affiliate click:', {
      productId: id,
      productTitle: product.title,
      clicks: product.clicks + 1,
      userAgent,
      referer,
      timestamp: new Date().toISOString(),
    })

    // Redirect to affiliate URL
    return NextResponse.redirect(product.affiliateUrl, { status: 302 })
  } catch (error) {
    console.error('Redirect error:', error)
    return NextResponse.json(
      { error: 'Failed to redirect' },
      { status: 500 }
    )
  }
}
