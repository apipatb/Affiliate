import { getShopeeMedia } from '../src/lib/shopee-scraper'

async function test() {
  console.log('🧪 Testing Shopee Scraper...\n')

  // Test with a sample Shopee URL
  const testUrl = 'https://shopee.co.th/product/76279376/7031409370'

  console.log(`Testing URL: ${testUrl}\n`)

  const media = await getShopeeMedia(testUrl)

  if (media) {
    console.log('✅ Success!')
    console.log('Type:', media.type)
    console.log('URL:', media.url)
    if (media.thumbnail) {
      console.log('Thumbnail:', media.thumbnail)
    }
  } else {
    console.log('❌ Failed to fetch media')
  }
}

test()
