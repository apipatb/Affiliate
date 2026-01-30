import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    // Update click count and get product info
    const product = await prisma.product.update({
      where: { id },
      data: {
        clicks: { increment: 1 },
      },
      select: {
        affiliateUrl: true,
        clicks: true,
        platform: true,
      }
    })

    // Log the click for analytics (don't wait for it)
    ;prisma.clickLog?.create({
      data: {
        productId: id,
        platform: product.platform,
      }
    }).catch((err: any) => {
      // Silent fail for click logging - don't block the redirect
      console.error('Failed to log click:', err)
    })

    return NextResponse.json({
      success: true,
      affiliateUrl: product.affiliateUrl,
      clicks: product.clicks
    })
  } catch (error) {
    console.error('Error tracking click:', error)
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    )
  }
}
