async function testAPI() {
  console.log('🧪 Testing API /api/products\n')

  try {
    const response = await fetch('http://localhost:3000/api/products?limit=10000')
    const data = await response.json()

    const products = data.data || data

    console.log(`✅ API Response:`)
    console.log(`   Total products: ${products.length}`)
    console.log(`   Response structure: ${Object.keys(data).join(', ')}`)

    // Check if products have category info
    if (products.length > 0) {
      const firstProduct = products[0]
      console.log(`\n📦 First product structure:`)
      console.log(`   Keys: ${Object.keys(firstProduct).join(', ')}`)
      console.log(`   Has category: ${firstProduct.category ? '✅ YES' : '❌ NO'}`)

      if (firstProduct.category) {
        console.log(`   Category structure: ${Object.keys(firstProduct.category).join(', ')}`)
      }
    }

    // Filter for sports category
    const sportsCategoryId = 'cmkdfs4x20005p2t5y6t85njs'
    const sportsProducts = products.filter((p: any) => p.categoryId === sportsCategoryId)

    console.log(`\n🏃 Sports products from API:`)
    console.log(`   Count: ${sportsProducts.length}`)

    if (sportsProducts.length > 0) {
      sportsProducts.forEach((p: any) => {
        console.log(`   - ${p.title.substring(0, 50)}`)
        console.log(`     categoryId: ${p.categoryId}`)
        console.log(`     category: ${p.category ? p.category.name : 'MISSING!'}`)
      })
    } else {
      console.log('   ❌ No sports products found in API response!')
      console.log('\n   Sample categoryIds from API:')
      products.slice(0, 5).forEach((p: any) => {
        console.log(`   - ${p.title.substring(0, 40)}: ${p.categoryId}`)
      })
    }

  } catch (error) {
    console.error('❌ API Error:', error)
  }
}

testAPI()
