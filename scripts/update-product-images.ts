import { prisma } from '../src/lib/prisma'
import { getCategoryPlaceholderImage } from '../src/lib/category-matcher'

async function main() {
  console.log('🔄 Updating product images with category placeholders...\n')

  const products = await prisma.product.findMany({
    include: { category: true }
  })

  console.log(`Found ${products.length} products to update\n`)

  let updated = 0

  for (const product of products) {
    // Get placeholder image based on category
    const newImageUrl = getCategoryPlaceholderImage(product.category.slug)

    // Update product image
    await prisma.product.update({
      where: { id: product.id },
      data: { imageUrl: newImageUrl }
    })

    console.log(`✅ Updated: ${product.title.substring(0, 50)}... → ${product.category.name}`)
    updated++
  }

  console.log(`\n🎉 Successfully updated ${updated} products!`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
