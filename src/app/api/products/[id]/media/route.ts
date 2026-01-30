import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// PUT /api/products/[id]/media - Update product media gallery
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin session
    const session = await getSession()

    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { media } = body

    if (!Array.isArray(media)) {
      return NextResponse.json(
        { error: 'media must be an array' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Delete existing media
    await prisma.productMedia.deleteMany({
      where: { productId: id },
    })

    // Create new media entries
    if (media.length > 0) {
      await prisma.productMedia.createMany({
        data: media.map((item: any, index: number) => ({
          productId: id,
          url: item.url,
          type: item.type || 'IMAGE',
          order: item.order ?? index,
        })),
      })

      // Update product imageUrl if first media is an image
      const firstImage = media.find((m: any) => m.type === 'IMAGE')
      if (firstImage && !product.imageUrl) {
        await prisma.product.update({
          where: { id },
          data: { imageUrl: firstImage.url },
        })
      }
    }

    // Fetch updated product with media
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({
      success: true,
      product: updatedProduct,
    })

  } catch (error: any) {
    console.error('Update media error:', error)
    return NextResponse.json(
      { error: 'Failed to update media', details: error?.message },
      { status: 500 }
    )
  }
}

// GET /api/products/[id]/media - Get product media gallery
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const media = await prisma.productMedia.findMany({
      where: { productId: id },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(media)

  } catch (error: any) {
    console.error('Get media error:', error)
    return NextResponse.json(
      { error: 'Failed to get media', details: error?.message },
      { status: 500 }
    )
  }
}
