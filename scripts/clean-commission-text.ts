import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanCommissionText() {
  console.log('🧹 Starting to clean commission text from product descriptions...')

  try {
    // Find all products with "คอมมิชชั่น" or "ค่าคอมมิชชั่น" in description
    const products = await prisma.product.findMany({
      where: {
        description: {
          contains: 'คอมมิชชั่น',
        },
      },
    })

    console.log(`📦 Found ${products.length} products with commission text`)

    let updated = 0

    for (const product of products) {
      // Remove commission line from description
      // Pattern: \nค่าคอมมิชชั่น: ฿13.48 (8.75%)
      const cleanedDescription = product.description.replace(
        /\nค่าคอมมิชชั่น:.*?(?=\n|$)/g,
        ''
      ).trim()

      if (cleanedDescription !== product.description) {
        await prisma.product.update({
          where: { id: product.id },
          data: { description: cleanedDescription },
        })
        updated++
        console.log(`✅ Cleaned: ${product.title}`)
      }
    }

    console.log(`\n✨ Successfully cleaned ${updated} products`)
    console.log(`📊 Total checked: ${products.length}`)
  } catch (error) {
    console.error('❌ Error cleaning commission text:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanCommissionText()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
