import { prisma } from './src/lib/prisma'

async function main() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' }
  })
  
  console.log('📊 Categories with product counts:\n')
  for (const cat of categories) {
    console.log(`- ${cat.name} (${cat.slug}): ${cat._count.products} สินค้า`)
  }
  
  const totalProducts = await prisma.product.count()
  console.log(`\n📦 Total products in database: ${totalProducts}`)
}

main().finally(() => prisma.$disconnect())
