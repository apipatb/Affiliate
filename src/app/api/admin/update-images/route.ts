import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { getCategoryPlaceholderImage } from '@/lib/category-matcher'

export async function POST(request: NextRequest) {
  // Check authentication
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  try {
    console.log('🔄 Starting image update process...')

    // Get all products with categories
    const products = await prisma.product.findMany({
      include: { category: true }
    })

    console.log(`Found ${products.length} products to update`)

    const updated = []
    const errors = []

    for (const product of products) {
      try {
        // Get placeholder image based on category
        const newImageUrl = getCategoryPlaceholderImage(product.category.slug)

        // Update product image
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: newImageUrl }
        })

        updated.push({
          id: product.id,
          title: product.title,
          category: product.category.name,
          newImage: newImageUrl
        })

        console.log(`✅ Updated: ${product.title.substring(0, 50)}... → ${product.category.name}`)
      } catch (error) {
        errors.push({
          id: product.id,
          title: product.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        console.error(`❌ Error updating ${product.title}:`, error)
      }
    }

    console.log(`✅ Successfully updated ${updated.length} products`)

    return NextResponse.json({
      success: true,
      message: `อัพเดทรูปภาพสำเร็จ ${updated.length} สินค้า`,
      total: products.length,
      updated: updated.length,
      failed: errors.length,
      products: updated,
      errors
    })
  } catch (error) {
    console.error('Error updating images:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
