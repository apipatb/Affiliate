import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  // Check authentication
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  try {
    const body = await request.json()
    const { productIds } = body

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'productIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Delete products
    const result = await prisma.product.deleteMany({
      where: {
        id: {
          in: productIds,
        },
      },
    })

    // Revalidate pages
    revalidatePath('/', 'layout')
    revalidatePath('/products')
    revalidatePath('/categories')
    revalidatePath('/featured')

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `ลบสินค้า ${result.count} รายการเรียบร้อยแล้ว`,
    })
  } catch (error) {
    console.error('Error bulk deleting products:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to delete products', details: errorMessage },
      { status: 500 }
    )
  }
}
