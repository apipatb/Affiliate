import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Run all independent queries in parallel for better performance
    const [
      totalProducts,
      totalClicks,
      totalCategories,
      topProductsRaw,
      clicksByCategory,
      productsWithClicks
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.aggregate({ _sum: { clicks: true } }),
      prisma.category.count(),
      prisma.product.findMany({
        orderBy: { clicks: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          clicks: true,
          category: { select: { name: true } }
        }
      }),
      prisma.category.findMany({
        select: {
          name: true,
          products: { select: { clicks: true } }
        }
      }),
      prisma.product.count({ where: { clicks: { gt: 0 } } })
    ])

    // Add platform field (fallback since it might not exist)
    const topProducts = topProductsRaw.map(p => ({ ...p, platform: 'SHOPEE' }))

    const categoryStats = clicksByCategory.map(cat => ({
      name: cat.name,
      clicks: cat.products.reduce((sum, p) => sum + p.clicks, 0),
      productCount: cat.products.length
    })).sort((a, b) => b.clicks - a.clicks)

    // Get clicks by platform
    let platformStats: { platform: string; clicks: number; count: number }[] = []
    try {
      const platformData = await (prisma.product.groupBy as any)({
        by: ['platform'],
        _sum: { clicks: true },
        _count: { id: true }
      })
      platformStats = platformData.map((p: any) => ({
        platform: p.platform || 'SHOPEE',
        clicks: p._sum.clicks || 0,
        count: p._count.id || 0
      }))
    } catch {
      // Fallback for SQLite without platform field
      const allProducts = await prisma.product.findMany({
        select: { clicks: true }
      })
      platformStats = [{
        platform: 'SHOPEE',
        clicks: allProducts.reduce((sum, p) => sum + p.clicks, 0),
        count: allProducts.length
      }]
    }

    // Get recent activity in parallel with platform stats
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentActivity = await prisma.product.findMany({
      where: {
        updatedAt: { gte: sevenDaysAgo },
        clicks: { gt: 0 }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10, // Reduced from 20 for faster load
      select: {
        id: true,
        title: true,
        clicks: true,
        updatedAt: true
      }
    })

    const avgClicksPerProduct = totalProducts > 0
      ? (totalClicks._sum.clicks || 0) / totalProducts
      : 0

    const response = NextResponse.json({
      overview: {
        totalProducts,
        totalClicks: totalClicks._sum.clicks || 0,
        totalCategories,
        productsWithClicks,
        clickRate: totalProducts > 0 ? ((productsWithClicks / totalProducts) * 100).toFixed(1) : 0,
        avgClicksPerProduct: avgClicksPerProduct.toFixed(1)
      },
      topProducts,
      categoryStats,
      platformStats,
      recentActivity
    })

    // Cache for 2 minutes
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')

    return response
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json({
      error: 'Failed to fetch analytics',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}
