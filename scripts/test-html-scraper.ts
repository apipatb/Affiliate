import { scrapeShopeeProductHTML } from '../src/lib/shopee-html-scraper'

async function test() {
  console.log('🧪 Testing HTML Scraper...\n')

  // Test with a real Shopee URL
  const testUrl = 'https://shopee.co.th/product/76279376/7031409370'

  console.log(`Testing URL: ${testUrl}\n`)

  const result = await scrapeShopeeProductHTML(testUrl)

  if (result) {
    console.log('✅ Success!')
    console.log(`Found ${result.images.length} images`)
    console.log('\nFirst 3 images:')
    result.images.slice(0, 3).forEach((img, i) => {
      console.log(`${i + 1}. ${img}`)
    })
    if (result.video) {
      console.log('\nVideo:', result.video)
    }
  } else {
    console.log('❌ Failed to scrape')
  }
}

test()
