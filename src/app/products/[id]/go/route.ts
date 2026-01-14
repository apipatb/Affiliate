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

    // Increment click count and wait for it to complete
    try {
      await prisma.product.update({
        where: { id },
        data: { clicks: { increment: 1 } },
      })

      // Log click for analytics
      const userAgent = request.headers.get('user-agent') || 'unknown'
      const referer = request.headers.get('referer') || 'direct'

      console.log('✅ Affiliate click tracked:', {
        productId: id,
        productTitle: product.title,
        newClickCount: product.clicks + 1,
        userAgent,
        referer,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      console.error('❌ Failed to increment clicks:', err)
      // Continue with redirect even if click tracking fails
    }

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
