// Test Shopee API
const shopId = "392907657"
const itemId = "29633783059"

const apiUrl = `https://shopee.co.th/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`

fetch(apiUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://shopee.co.th/',
  }
})
.then(res => {
  console.log('Status:', res.status)
  return res.json()
})
.then(data => {
  console.log('\nResponse:', JSON.stringify(data, null, 2))
  if (data.data?.image) {
    console.log('\n✅ Image URL:', `https://down-th.img.susercontent.com/file/${data.data.image}`)
  } else if (data.data?.images && data.data.images.length > 0) {
    console.log('\n✅ Image URL:', `https://down-th.img.susercontent.com/file/${data.data.images[0]}`)
  } else {
    console.log('\n❌ No image found in response')
  }
})
.catch(err => console.error('Error:', err))
