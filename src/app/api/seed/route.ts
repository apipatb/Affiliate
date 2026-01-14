import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

const categories = [
  { name: 'แฟชั่นและเครื่องแต่งกาย', slug: 'fashion' },
  { name: 'รองเท้าและกระเป๋า', slug: 'shoes-bags' },
  { name: 'ความงามและของใช้ส่วนตัว', slug: 'beauty' },
  { name: 'อิเล็กทรอนิกส์', slug: 'electronics' },
  { name: 'ของใช้ในบ้าน', slug: 'home' },
  { name: 'กีฬาและกิจกรรมกลางแจ้ง', slug: 'sports' },
  { name: 'ดูแลรักษาและทำความสะอาด', slug: 'care-cleaning' },
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { secret, clean = false } = body

    // Simple secret check
    if (secret !== 'seed-production-database-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clean database if requested
    if (clean) {
      console.log('🧹 Cleaning database...')
      await prisma.product.deleteMany()
      await prisma.category.deleteMany()
      // Don't delete users
      console.log('✅ Database cleaned')
    } else {
      // Check if already seeded
      const existingProducts = await prisma.product.count()
      if (existingProducts > 0) {
        return NextResponse.json({
          message: 'Database already has data. Use { "clean": true } to reset',
          counts: {
            products: existingProducts,
            categories: await prisma.category.count(),
            users: await prisma.user.count()
          }
        })
      }
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

    // Get category IDs
    const fashionCat = createdCategories.find(c => c.slug === 'fashion')!
    const cleaningCat = createdCategories.find(c => c.slug === 'care-cleaning')!

    // Create real products from CSV
    const products = [
      {
        title: 'ROCKER น้ำยาทำความสะอาดรองเท้า Premium',
        description: `🔥อันดับ1🔥 ROCKER น้ำยาทำความสะอาดรองเท้า Premium สูตรใหม่

ฟรีแปรง+ผ้าไมโครไฟเบอร์
- ซักรองเท้าได้ทุกชนิด
- ขัดรองเท้าให้สะอาดเหมือนใหม่
- เช็ดรองเท้าง่าย ไม่ทำลายผิว

ร้านค้า: ROCKER น้ำยาทำความสะอาดรองเท้า
ยอดขาย: 200พัน+
ค่าคอมมิชชั่น: ฿27.36 (13.75%)`,
        price: 199,
        affiliateUrl: 'https://s.shopee.co.th/8fM5ddAqJi',
        imageUrl: 'https://down-th.img.susercontent.com/file/th-11134207-7r98o-lxq9s8gd7uj38e',
        mediaType: 'IMAGE' as const,
        categoryId: cleaningCat.id,
        featured: true,
      },
      {
        title: 'Adidas Originals CTT 3.0 Denim Jacket',
        description: `🌷ของแท้ 100% 🎆 Adidas Originals CTT 3.0 Denim Jacket

- ยูนิเซ็กซ์ ใส่ได้ทั้งชายและหญิง
- แจ็คเก็ตยีนส์ทรงหลวม
- สไตล์สตรีท แฟชั่น
- คุณภาพพรีเมียม

ร้านค้า: Roy's Clothing.th
ยอดขาย: 7
ค่าคอมมิชชั่น: ฿619.75 (16.75%)`,
        price: 3700,
        affiliateUrl: 'https://s.shopee.co.th/8pfVpwACyl',
        imageUrl: 'https://down-th.img.susercontent.com/file/sg-11134201-7rdvy-m23yp9yfbwbzbe',
        mediaType: 'IMAGE' as const,
        categoryId: fashionCat.id,
        featured: true,
      },
    ]

    console.log(`Creating ${products.length} products...`)

    for (const product of products) {
      await prisma.product.create({ data: product })
    }

    console.log(`✅ Created ${products.length} products across ${createdCategories.length} categories`)

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
