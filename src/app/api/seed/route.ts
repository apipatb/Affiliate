import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

const categories = [
  { name: 'อิเล็กทรอนิกส์', slug: 'electronics' },
  { name: 'แฟชั่น', slug: 'fashion' },
  { name: 'ของใช้ในบ้าน', slug: 'home' },
  { name: 'ความงาม', slug: 'beauty' },
  { name: 'กีฬา', slug: 'sports' },
  { name: 'หนังสือ', slug: 'books' },
  { name: 'ของเล่น', slug: 'toys' },
  { name: 'อาหารและเครื่องดื่ม', slug: 'food' },
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { secret } = body

    // Simple secret check
    if (secret !== 'seed-production-database-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if already seeded
    const existingProducts = await prisma.product.count()
    if (existingProducts > 0) {
      return NextResponse.json({
        message: 'Database already has data',
        counts: {
          products: existingProducts,
          categories: await prisma.category.count(),
          users: await prisma.user.count()
        }
      })
    }

    console.log('Starting seed...')

    // Create categories
    for (const category of categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {},
        create: category,
      })
    }

    const createdCategories = await prisma.category.findMany()
    console.log('Categories created')

    // Create products
    const products = []
    const titles = ['Elite', 'Pro', 'Mega', 'Premium', 'Super', 'Ultra']
    const types = ['Wireless Headphones', 'Smart Watch', 'Fitness Tracker', 'Speaker', 'Camera']

    for (const category of createdCategories) {
      for (let i = 0; i < 15; i++) {
        const title = `${titles[i % titles.length]} ${types[i % types.length]} ${i > 5 ? 'Plus' : i > 10 ? 'Max' : ''}`
        products.push({
          title,
          description: `คุณภาพสูง ${title} สำหรับทุกความต้องการของคุณ`,
          price: Math.floor(Math.random() * 5000) + 500,
          affiliateUrl: `https://shopee.co.th/product/${Math.random().toString(36).substring(7)}`,
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
          mediaType: 'IMAGE' as const,
          categoryId: category.id,
          featured: Math.random() > 0.8,
        })
      }
    }

    console.log(`Creating ${products.length} products...`)

    for (const product of products) {
      await prisma.product.create({ data: product })
    }

    console.log(`✅ Created ${products.length} products`)

    // Create admin user
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12)
    await prisma.user.upsert({
      where: { email: process.env.ADMIN_EMAIL || 'admin@example.com' },
      update: {},
      create: {
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    })

    console.log('Admin user created')

    const finalCounts = {
      products: await prisma.product.count(),
      categories: await prisma.category.count(),
      users: await prisma.user.count()
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      counts: finalCounts
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
