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
    // Delete all products
    const result = await prisma.product.deleteMany({})

    // Revalidate pages
    revalidatePath('/', 'layout')
    revalidatePath('/products')
    revalidatePath('/categories')
    revalidatePath('/featured')

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `ลบสินค้าทั้งหมด ${result.count} รายการเรียบร้อยแล้ว`,
    })
  } catch (error) {
    console.error('Error deleting all products:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to delete all products', details: errorMessage },
      { status: 500 }
    )
  }
}
