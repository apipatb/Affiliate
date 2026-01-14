import { prisma } from '../src/lib/prisma'

async function checkCategories() {
  console.log('🔍 Checking categories and products...\n')

  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    }
  })

  console.log(`Found ${categories.length} categories:\n`)

  for (const cat of categories) {
    console.log(`📁 ${cat.name}`)
    console.log(`   ID: ${cat.id}`)
    console.log(`   Slug: ${cat.slug}`)
    console.log(`   Products: ${cat._count.products}`)
    console.log()
  }

  // Check products in "กีฬาและกิจกรรมกลางแจ้ง" category
  console.log('🔍 Looking for products in sports category...\n')

  const sportsProducts = await prisma.product.findMany({
    where: {
      category: {
        OR: [
          { name: { contains: 'กีฬา' } },
          { slug: { contains: 'sport' } },
          { name: { contains: 'กิจกรรม' } }
        ]
      }
    },
    include: {
      category: true
    }
  })

  console.log(`Found ${sportsProducts.length} products in sports-related categories:`)
  sportsProducts.forEach((p) => {
    console.log(`- ${p.title} (Category: ${p.category.name}, ID: ${p.categoryId})`)
  })

  await prisma.$disconnect()
}

checkCategories()
