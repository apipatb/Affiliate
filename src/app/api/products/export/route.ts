import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Check authentication
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  const searchParams = request.nextUrl.searchParams
  const format = searchParams.get('format') || 'csv'

  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (format === 'json') {
      // Return JSON format
      return new NextResponse(JSON.stringify(products, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="products-${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    }

    // CSV format
    const headers = [
      'ID',
      'Title',
      'Description',
      'Price',
      'Affiliate URL',
      'Image URL',
      'Category',
      'Platform',
      'Featured',
      'Clicks',
      'Rating',
      'Created At',
    ]

    const csvRows = [
      headers.join(','),
      ...products.map((product) => {
        const row = [
          `"${product.id}"`,
          `"${(product.title || '').replace(/"/g, '""')}"`,
          `"${(product.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          product.price,
          `"${product.affiliateUrl || ''}"`,
          `"${product.imageUrl || ''}"`,
          `"${product.category?.name || ''}"`,
          `"${(product as any).platform || 'SHOPEE'}"`,
          product.featured ? 'Yes' : 'No',
          product.clicks || 0,
          product.rating || 0,
          `"${product.createdAt.toISOString()}"`,
        ]
        return row.join(',')
      }),
    ]

    const csv = csvRows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="products-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export products' },
      { status: 500 }
    )
  }
}
