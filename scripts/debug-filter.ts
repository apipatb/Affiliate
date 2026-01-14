import { prisma } from '../src/lib/prisma'

async function debugFilter() {
  console.log('🔍 Debug Category Filter Issue\n')

  // Get all categories
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true }
  })

  console.log('📁 Categories in database:')
  categories.forEach((cat) => {
    console.log(`   ${cat.name}: ${cat.id}`)
  })

  // Get sports category specifically
  const sportsCategory = categories.find((c) => c.name.includes('กีฬา'))

  if (!sportsCategory) {
    console.error('\n❌ Sports category not found!')
    return
  }

  console.log(`\n🎯 Sports Category ID: ${sportsCategory.id}`)
  console.log(`   Name: ${sportsCategory.name}`)
  console.log(`   Slug: ${sportsCategory.slug}`)

  // Get all products
  const allProducts = await prisma.product.findMany({
    include: { category: true }
  })

  console.log(`\n📦 Total products: ${allProducts.length}`)

  // Filter products by sports category manually
  const sportsProducts = allProducts.filter((p) => p.categoryId === sportsCategory.id)

  console.log(`\n🏃 Products in Sports category (${sportsCategory.id}):`)
  console.log(`   Count: ${sportsProducts.length}`)

  if (sportsProducts.length > 0) {
    console.log('\n   Products:')
    sportsProducts.forEach((p) => {
      console.log(`   - ${p.title}`)
      console.log(`     Category ID: ${p.categoryId}`)
      console.log(`     Category Name: ${p.category.name}`)
    })
  } else {
    console.log('\n   ❌ No products found!')
  }

  // Show sample products from other categories
  console.log('\n📊 Sample products from database:')
  allProducts.slice(0, 5).forEach((p) => {
    console.log(`   - ${p.title.substring(0, 40)}`)
    console.log(`     Category ID: ${p.categoryId}`)
    console.log(`     Category: ${p.category.name}`)
    console.log('')
  })

  await prisma.$disconnect()
}

debugFilter()
