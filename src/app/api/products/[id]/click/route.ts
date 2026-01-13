import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const product = await prisma.product.update({
      where: { id },
      data: {
        clicks: { increment: 1 },
      },
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
