import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { extractImagesFromShopee, closeBrowser } from '@/lib/shopee-playwright-scraper'

// Force Node.js runtime
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max

/**
 * GET /api/shopee/update-images
 * Get count of products with placeholder images
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  try {
    // Find products with placeholder images (unsplash or no shopee image)
    const productsWithPlaceholder = await prisma.product.findMany({
      where: {
        OR: [
          { imageUrl: { contains: 'unsplash.com' } },
          { imageUrl: { contains: 'placeholder' } },
          { imageUrl: { not: { contains: 'susercontent.com' } } },
        ],
        affiliateUrl: { contains: 'shopee' },
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        affiliateUrl: true,
      },
    })

    return NextResponse.json({
      count: productsWithPlaceholder.length,
      products: productsWithPlaceholder.slice(0, 10), // Preview first 10
    })
  } catch (error) {
    console.error('[Update Images] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get products' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/shopee/update-images
 * Update images for products with placeholder
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  try {
    const body = await request.json().catch(() => ({}))
    const limit = body.limit || 10 // Default update 10 at a time

    // Find products with placeholder images
    const productsToUpdate = await prisma.product.findMany({
      where: {
        OR: [
          { imageUrl: { contains: 'unsplash.com' } },
          { imageUrl: { contains: 'placeholder' } },
          { imageUrl: { not: { contains: 'susercontent.com' } } },
        ],
        affiliateUrl: { contains: 'shopee' },
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        affiliateUrl: true,
      },
      take: limit,
    })

    if (productsToUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'ไม่มีสินค้าที่ต้องอัพเดทรูป',
        updated: 0,
        total: 0,
      })
    }

    console.log(`[Update Images] Starting update for ${productsToUpdate.length} products`)

    const results = {
      updated: 0,
      failed: 0,
      details: [] as Array<{ id: string; title: string; status: string; imageUrl?: string }>,
    }

    for (const product of productsToUpdate) {
      console.log(`[Update Images] Processing: ${product.title.substring(0, 50)}...`)

      try {
        // Extract product link from affiliate URL or use directly
        let productLink = product.affiliateUrl

        // Try to extract images
        const images = await extractImagesFromShopee(productLink)

        if (images.length > 0) {
          // Update product with new image
          await prisma.product.update({
            where: { id: product.id },
            data: { imageUrl: images[0] },
          })

          results.updated++
          results.details.push({
            id: product.id,
            title: product.title,
            status: 'success',
            imageUrl: images[0],
          })
          console.log(`[Update Images] ✅ Updated: ${product.title.substring(0, 30)}`)
        } else {
          results.failed++
          results.details.push({
            id: product.id,
            title: product.title,
            status: 'no_images_found',
          })
          console.log(`[Update Images] ⚠️ No images found: ${product.title.substring(0, 30)}`)
        }

        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        results.failed++
        results.details.push({
          id: product.id,
          title: product.title,
          status: 'error',
        })
        console.error(`[Update Images] ❌ Error for ${product.title}:`, error)
      }
    }

    // Close browser after batch
    await closeBrowser()

    // Get remaining count
    const remainingCount = await prisma.product.count({
      where: {
        OR: [
          { imageUrl: { contains: 'unsplash.com' } },
          { imageUrl: { contains: 'placeholder' } },
          { imageUrl: { not: { contains: 'susercontent.com' } } },
        ],
        affiliateUrl: { contains: 'shopee' },
      },
    })

    console.log(`[Update Images] Completed. Updated: ${results.updated}, Failed: ${results.failed}, Remaining: ${remainingCount}`)

    return NextResponse.json({
      success: true,
      message: `อัพเดทรูปสำเร็จ ${results.updated} รายการ${results.failed > 0 ? `, ล้มเหลว ${results.failed} รายการ` : ''}`,
      updated: results.updated,
      failed: results.failed,
      remaining: remainingCount,
      details: results.details,
    })
  } catch (error) {
    console.error('[Update Images] Error:', error)
    await closeBrowser()
    return NextResponse.json(
      { error: 'Failed to update images', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
