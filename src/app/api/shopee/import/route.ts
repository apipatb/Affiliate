import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

interface ShopeeProductData {
  title: string
  description: string
  price: number
  imageUrl: string
  affiliateUrl: string
}

async function fetchShopeeProduct(url: string): Promise<ShopeeProductData | null> {
  try {
    // Extract shop_id and item_id from Shopee URL
    // Format: https://shopee.co.th/product-name-i.{shop_id}.{item_id}
    const urlPattern = /shopee\.co\.th\/.*-i\.(\d+)\.(\d+)/
    const match = url.match(urlPattern)

    if (!match) {
      throw new Error('Invalid Shopee URL format')
    }

    const [, shopId, itemId] = match

    // Shopee API v2 endpoint (public)
    const apiUrl = `https://shopee.co.th/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://shopee.co.th/',
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch product from Shopee')
    }

    const data = await response.json()

    if (!data.data || data.error) {
      throw new Error('Product not found')
    }

    const item = data.data

    // Extract product information
    const title = item.name || 'Unknown Product'
    const description = item.description || title
    const price = item.price ? item.price / 100000 : 0 // Shopee stores price in special format
    const imageUrl = item.image
      ? `https://down-th.img.susercontent.com/file/${item.image}`
      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'

    return {
      title,
      description,
      price,
      imageUrl,
      affiliateUrl: url,
    }
  } catch (error) {
    console.error('Error fetching Shopee product:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  // Check authentication
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  try {
    const body = await request.json()
    const { url, categoryId, featured = false } = body

    if (!url || !categoryId) {
      return NextResponse.json(
        { error: 'url and categoryId are required' },
        { status: 400 }
      )
    }

    // Validate categoryId exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Invalid categoryId: category does not exist' },
        { status: 400 }
      )
    }

    // Fetch product data from Shopee
    const productData = await fetchShopeeProduct(url)

    if (!productData) {
      return NextResponse.json(
        { error: 'Failed to fetch product from Shopee URL' },
        { status: 400 }
      )
    }

    // Create product in database
    const product = await prisma.product.create({
      data: {
        title: productData.title,
        description: productData.description,
        price: productData.price,
        affiliateUrl: productData.affiliateUrl,
        imageUrl: productData.imageUrl,
        mediaType: 'IMAGE',
        categoryId,
        featured,
      },
      include: { category: true },
    })

    return NextResponse.json({
      success: true,
      product,
      message: 'Product imported from Shopee successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error importing Shopee product:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to import product', details: errorMessage },
      { status: 500 }
    )
  }
}
