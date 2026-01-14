import { prisma } from './src/lib/prisma'

async function main() {
  const productCount = await prisma.product.count()
  const categoryCount = await prisma.category.count()
  const userCount = await prisma.user.count()

  console.log('Database Stats:')
  console.log('Products:', productCount)
  console.log('Categories:', categoryCount)
  console.log('Users:', userCount)

  if (productCount > 0) {
    const products = await prisma.product.findMany({ take: 3 })
    console.log('\nSample products:')
    products.forEach(p => console.log(`- ${p.title}`))
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
