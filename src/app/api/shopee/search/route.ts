import { requireAuth } from '@/lib/auth'
import { shopeeAPI } from '@/lib/shopee-affiliate'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Check authentication
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const keyword = searchParams.get('keyword') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Check if Shopee Affiliate API credentials are configured
    const hasCredentials = process.env.SHOPEE_APP_ID && process.env.SHOPEE_SECRET

    if (!hasCredentials) {
      return NextResponse.json(
        {
          error: 'Shopee Affiliate API not configured',
          message: 'Please add SHOPEE_APP_ID and SHOPEE_SECRET environment variables'
        },
        { status: 503 }
      )
    }

    // Search products
    const products = await shopeeAPI.searchProducts({
      keyword,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: products,
      total: products.length,
    })
  } catch (error) {
    console.error('Error searching Shopee products:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to search products', details: errorMessage },
      { status: 500 }
    )
  }
}
