import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const productCount = await prisma.product.count()
    const categoryCount = await prisma.category.count()
    const userCount = await prisma.user.count()

    const products = await prisma.product.findMany({
      take: 3,
      include: { category: true }
    })

    return NextResponse.json({
      success: true,
      counts: {
        products: productCount,
        categories: categoryCount,
        users: userCount,
      },
      sampleProducts: products,
      env: {
        hasPostgresUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      }
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}
