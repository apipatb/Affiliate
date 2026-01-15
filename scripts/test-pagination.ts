async function testPagination() {
  console.log('🧪 Testing Server-Side Pagination\n')

  const baseUrl = 'http://localhost:3000/api/products'

  // Test 1: Get all products (no filter)
  console.log('📋 Test 1: Get all products (page 1, limit 20)')
  const res1 = await fetch(`${baseUrl}?page=1&limit=20`)
  const data1 = await res1.json()
  console.log(`   Products: ${data1.data.length}`)
  console.log(`   Total: ${data1.pagination.total}`)
  console.log(`   Pages: ${data1.pagination.totalPages}`)
  console.log(`   Has next: ${data1.pagination.hasNext}`)

  // Test 2: Filter by sports category
  const sportsCategoryId = 'cmkdfs4x20005p2t5y6t85njs'
  console.log(`\n🏃 Test 2: Filter by sports category`)
  const res2 = await fetch(`${baseUrl}?page=1&limit=20&categoryId=${sportsCategoryId}`)
  const data2 = await res2.json()
  console.log(`   Products: ${data2.data.length}`)
  console.log(`   Total: ${data2.pagination.total}`)
  console.log(`   Pages: ${data2.pagination.totalPages}`)

  if (data2.data.length > 0) {
    console.log('\n   Found products:')
    data2.data.forEach((p: any) => {
      console.log(`   - ${p.title.substring(0, 50)}`)
    })
  }

  // Test 3: Search
  console.log(`\n🔍 Test 3: Search for "ลองจอน"`)
  const res3 = await fetch(`${baseUrl}?page=1&limit=20&search=ลองจอน`)
  const data3 = await res3.json()
  console.log(`   Products: ${data3.data.length}`)
  console.log(`   Total: ${data3.pagination.total}`)
  console.log(`   First result: ${data3.data[0]?.title.substring(0, 50)}`)

  // Test 4: Pagination (page 2)
  console.log(`\n📄 Test 4: Get page 2`)
  const res4 = await fetch(`${baseUrl}?page=2&limit=20`)
  const data4 = await res4.json()
  console.log(`   Products: ${data4.data.length}`)
  console.log(`   Current page: ${data4.pagination.page}`)
  console.log(`   Has prev: ${data4.pagination.hasPrev}`)
  console.log(`   Has next: ${data4.pagination.hasNext}`)

  console.log('\n✅ All tests completed!')
}

testPagination()
