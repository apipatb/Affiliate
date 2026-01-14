const url = "https://shopee.co.th/product/392907657/29633783059"

fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }
})
.then(res => res.text())
.then(html => {
  // Find og:image meta tag
  const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
  
  if (ogImageMatch) {
    console.log('✅ Found og:image:', ogImageMatch[1])
  } else {
    console.log('❌ No og:image found')
    
    // Try to find image in JSON data
    const scriptMatch = html.match(/<script>window\.__INITIAL_STATE__=(.+?)<\/script>/)
    if (scriptMatch) {
      try {
        const data = JSON.parse(scriptMatch[1].replace(/;$/, ''))
        console.log('Found initial state data')
      } catch (e) {
        console.log('Cannot parse initial state')
      }
    }
  }
})
.catch(err => console.error('Error:', err))
