import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning database...')

  // Delete all data
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Database cleaned')

  // Create categories (เหมาะสมกับสินค้าจริง)
  const categories = [
    { name: 'แฟชั่นและเครื่องแต่งกาย', slug: 'fashion' },
    { name: 'รองเท้าและกระเป๋า', slug: 'shoes-bags' },
    { name: 'ความงามและของใช้ส่วนตัว', slug: 'beauty' },
    { name: 'อิเล็กทรอนิกส์', slug: 'electronics' },
    { name: 'ของใช้ในบ้าน', slug: 'home' },
    { name: 'กีฬาและกิจกรรมกลางแจ้ง', slug: 'sports' },
    { name: 'ดูแลรักษาและทำความสะอาด', slug: 'care-cleaning' },
  ]

  console.log('📁 Creating categories...')

  for (const cat of categories) {
    await prisma.category.create({ data: cat })
  }

  const createdCategories = await prisma.category.findMany()
  console.log(`✅ Created ${createdCategories.length} categories`)

  // Get category IDs
  const fashionCat = createdCategories.find(c => c.slug === 'fashion')!
  const cleaningCat = createdCategories.find(c => c.slug === 'care-cleaning')!

  console.log('🛍️ Creating products from CSV...')

  // Products from CSV
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
      categoryId: fashionCat.id,
      featured: true,
    },
  ]

  for (const product of products) {
    await prisma.product.create({ data: product })
  }

  console.log(`✅ Created ${products.length} products`)

  // Create admin user
  console.log('👤 Creating admin user...')

  const hashedPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || 'admin123',
    12
  )

  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@example.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Admin user created')

  console.log('\n=================================')
  console.log('✨ Seed completed successfully!')
  console.log('=================================')
  console.log(`\n📊 Database Summary:`)
  console.log(`   Categories: ${await prisma.category.count()}`)
  console.log(`   Products: ${await prisma.product.count()}`)
  console.log(`   Users: ${await prisma.user.count()}`)
  console.log('\n🔑 Admin Credentials:')
  console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@example.com'}`)
  console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
