import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { autoCategorizeBulk, getCategoryPlaceholderImage } from '@/lib/category-matcher'
import { getShopeeProductMediaFromHTML } from '@/lib/shopee-html-scraper'
import { revalidatePath } from 'next/cache'

interface CSVProduct {
  productId: string
  title: string
  price: number
  sales: string
  shopName: string
  commissionRate: string
  commission: string
  productLink: string
  affiliateLink: string
  imageUrl?: string // Optional image URL from CSV
}

function parseCSV(csvText: string): CSVProduct[] {
  const lines = csvText.trim().split('\n')
  const products: CSVProduct[] = []

  // Skip header (first line)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Split by comma, but handle commas inside quotes
    const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || []
    const cleaned = values.map(v => v.replace(/^"|"$/g, '').trim())

    if (cleaned.length >= 9) {
      products.push({
        productId: cleaned[0],
        title: cleaned[1],
        price: parsePrice(cleaned[2]),
        sales: cleaned[3],
        shopName: cleaned[4],
        commissionRate: cleaned[5],
        commission: cleaned[6],
        productLink: cleaned[7],
        affiliateLink: cleaned[8],
        imageUrl: cleaned[9] || undefined, // Optional 10th column
      })
    }
  }

  return products
}

function parsePrice(priceStr: string): number {
  // Remove Thai comma separators and convert
  // "3.7พัน" -> 3700, "200พัน+" -> 200000
  let cleaned = priceStr.replace(/[,+]/g, '')

  if (cleaned.includes('พัน')) {
    const num = parseFloat(cleaned.replace('พัน', ''))
    return num * 1000
  } else if (cleaned.includes('ล้าน')) {
    const num = parseFloat(cleaned.replace('ล้าน', ''))
    return num * 1000000
  }

  return parseFloat(cleaned) || 0
}

async function fetchProductImage(productLink: string): Promise<string> {
  try {
    let shopId: string | undefined
    let itemId: string | undefined

    // Try format 1: /product/{shop_id}/{item_id}
    const productPattern = /shopee\.co\.th\/product\/(\d+)\/(\d+)/
    let match = productLink.match(productPattern)

    if (match) {
      shopId = match[1]
      itemId = match[2]
    } else {
      // Try format 2: /-i.{shop_id}.{item_id}
      const iPattern = /shopee\.co\.th\/.*-i\.(\d+)\.(\d+)/
      match = productLink.match(iPattern)
      if (match) {
        shopId = match[1]
        itemId = match[2]
      }
    }

    if (!shopId || !itemId) {
      console.log(`[Image Fetch] Cannot parse URL: ${productLink}`)
      return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'
    }

    const apiUrl = `https://shopee.co.th/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`
    console.log(`[Image Fetch] Fetching from: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://shopee.co.th/',
        'Accept': 'application/json',
      }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.data?.image) {
        const imageUrl = `https://down-th.img.susercontent.com/file/${data.data.image}`
        console.log(`[Image Fetch] Success: ${imageUrl}`)
        return imageUrl
      } else {
        console.log('[Image Fetch] No image in response:', JSON.stringify(data).substring(0, 200))
      }
    } else {
      console.log(`[Image Fetch] Failed with status: ${response.status}`)
    }
  } catch (error) {
    console.error('[Image Fetch] Error:', error)
  }

  console.log('[Image Fetch] Using fallback image')
  return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'
}

export async function POST(request: NextRequest) {
  // Check authentication
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const featured = formData.get('featured') === 'true'

    if (!file) {
      return NextResponse.json(
        { error: 'file is required' },
        { status: 400 }
      )
    }

    // Get all available categories for auto-categorization
    const availableCategories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true }
    })

    if (availableCategories.length === 0) {
      return NextResponse.json(
        { error: 'No categories found. Please create categories first.' },
        { status: 400 }
      )
    }

    // Read CSV file
    const csvText = await file.text()
    const products = parseCSV(csvText)

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No valid products found in CSV' },
        { status: 400 }
      )
    }

    // Import products
    const imported = []
    const skipped = []
    const errors = []
    let processedCount = 0

    console.log(`[Bulk Import] 🚀 Starting import of ${products.length} products...`)

    for (const product of products) {
      processedCount++
      console.log(`[Bulk Import] 📦 Processing ${processedCount}/${products.length}: ${product.title.substring(0, 50)}...`)
      try {
        // Check if product already exists (by affiliateUrl)
        const existingProduct = await prisma.product.findFirst({
          where: { affiliateUrl: product.affiliateLink }
        })

        if (existingProduct) {
          console.log(`[Bulk Import] ⏭️  Skipping duplicate: ${product.title.substring(0, 50)}...`)
          skipped.push({
            productId: product.productId,
            title: product.title,
            reason: 'Product already exists'
          })
          continue
        }

        // Auto-categorize based on product title
        const categoryId = autoCategorizeBulk(product.title, availableCategories)
        const category = availableCategories.find(c => c.id === categoryId)

        // Determine image URL (priority: CSV > Shopee API > Placeholder)
        let imageUrl: string
        let mediaType: 'IMAGE' | 'VIDEO' = 'IMAGE'

        if (product.imageUrl && product.imageUrl.trim()) {
          // Use image URL from CSV if provided
          imageUrl = product.imageUrl.trim()
          console.log(`[Bulk Import] 📷 Using CSV image`)
        } else {
          // Use placeholder (auto-scraping doesn't work due to Shopee blocking)
          imageUrl = getCategoryPlaceholderImage(category?.slug || 'home')
          console.log(`[Bulk Import] 🎨 Using ${category?.name} placeholder (no imageUrl in CSV)`)
        }

        // Create product in database
        const created = await prisma.product.create({
          data: {
            title: product.title,
            description: `${product.title}\n\nร้านค้า: ${product.shopName}\nยอดขาย: ${product.sales}\nค่าคอมมิชชั่น: ${product.commission} (${product.commissionRate})`,
            price: product.price,
            affiliateUrl: product.affiliateLink,
            imageUrl,
            mediaType,
            categoryId,
            featured,
          },
        })

        imported.push({
          productId: product.productId,
          title: product.title,
          id: created.id,
          category: category?.name || 'Unknown',
        })
      } catch (error) {
        errors.push({
          productId: product.productId,
          title: product.title,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Revalidate pages after bulk import
    if (imported.length > 0) {
      console.log(`[Bulk Import] 🔄 Revalidating pages...`)
      revalidatePath('/', 'layout')
      revalidatePath('/products')
      revalidatePath('/categories')
      if (featured) {
        revalidatePath('/featured')
      }
    }

    console.log(`[Bulk Import] ✅ Completed! Imported: ${imported.length}, Skipped: ${skipped.length}, Failed: ${errors.length}`)

    return NextResponse.json({
      success: true,
      total: products.length,
      imported: imported.length,
      skipped: skipped.length,
      failed: errors.length,
      products: imported,
      skippedProducts: skipped,
      errors,
      message: `สำเร็จ! นำเข้า ${imported.length} สินค้า${skipped.length > 0 ? `, ข้าม ${skipped.length} (ซ้ำ)` : ''}${errors.length > 0 ? `, ล้มเหลว ${errors.length}` : ''}`,
    })
  } catch (error) {
    console.error('Error in bulk import:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to import products', details: errorMessage },
      { status: 500 }
    )
  }
}
