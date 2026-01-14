/**
 * Shopee HTML Scraper - No browser needed!
 * Fetches and parses HTML to extract images
 */

interface ScrapedMedia {
  images: string[]
  video?: string
  mainImage: string
}

/**
 * Scrape Shopee product page by fetching HTML
 * Works without browser/playwright
 */
export async function scrapeShopeeProductHTML(productUrl: string): Promise<ScrapedMedia | null> {
  try {
    console.log(`[HTML Scraper] 🌐 Fetching: ${productUrl}`)

    // Fetch page with proper headers
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://shopee.co.th/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Upgrade-Insecure-Requests': '1',
      },
      next: { revalidate: 0 }, // Don't cache
    })

    if (!response.ok) {
      console.error(`[HTML Scraper] HTTP ${response.status}`)
      return null
    }

    const html = await response.text()

    // Extract images from HTML
    const images: string[] = []

    // Method 1: Find in __NEXT_DATA__ script tag (Shopee uses Next.js)
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (nextDataMatch) {
      try {
        const data = JSON.parse(nextDataMatch[1])

        // Navigate through the data structure to find images
        const findImages = (obj: any): void => {
          if (obj && typeof obj === 'object') {
            // Look for image arrays
            if (Array.isArray(obj)) {
              obj.forEach(item => {
                if (typeof item === 'string' && item.includes('susercontent.com')) {
                  const fullUrl = item.startsWith('http')
                    ? item
                    : `https://down-th.img.susercontent.com/file/${item}`
                  if (!images.includes(fullUrl)) {
                    images.push(fullUrl)
                  }
                }
                findImages(item)
              })
            } else {
              // Check common image field names
              const imageFields = ['image', 'images', 'image_url', 'imageUrl', 'picture']
              imageFields.forEach(field => {
                if (obj[field]) {
                  if (typeof obj[field] === 'string' && obj[field].includes('susercontent.com')) {
                    const fullUrl = obj[field].startsWith('http')
                      ? obj[field]
                      : `https://down-th.img.susercontent.com/file/${obj[field]}`
                    if (!images.includes(fullUrl)) {
                      images.push(fullUrl)
                    }
                  } else if (Array.isArray(obj[field])) {
                    findImages(obj[field])
                  }
                }
              })

              // Recurse into object properties
              Object.values(obj).forEach(val => findImages(val))
            }
          }
        }

        findImages(data)
      } catch (e) {
        console.error('[HTML Scraper] Failed to parse __NEXT_DATA__:', e)
      }
    }

    // Method 2: Find image URLs in HTML with regex
    const imgRegex = /https:\/\/[^"'\s]*susercontent\.com[^"'\s]*/g
    const matches = html.match(imgRegex)
    if (matches) {
      matches.forEach(url => {
        // Clean up URL
        const cleanUrl = url
          .replace(/\\u002F/g, '/')
          .replace(/\\"/g, '')
          .replace(/&amp;/g, '&')
          .split(/[<>\s]/)[0] // Remove any trailing characters

        if (cleanUrl && !images.includes(cleanUrl)) {
          images.push(cleanUrl)
        }
      })
    }

    // Method 3: Look for video
    let video: string | undefined
    const videoRegex = /"video_url":"([^"]+)"/
    const videoMatch = html.match(videoRegex)
    if (videoMatch) {
      video = videoMatch[1].replace(/\\u002F/g, '/')
    }

    // Remove duplicates and filter out small/thumbnail images
    const uniqueImages = Array.from(new Set(images))
      .filter(url => {
        // Filter out thumbnails and small images
        return !url.includes('_tn') && !url.includes('thumbnail')
      })
      .slice(0, 10) // Take first 10 images

    if (uniqueImages.length === 0) {
      console.error('[HTML Scraper] ❌ No images found')
      return null
    }

    console.log(`[HTML Scraper] ✅ Found ${uniqueImages.length} images${video ? ' + video' : ''}`)

    return {
      images: uniqueImages,
      video,
      mainImage: uniqueImages[0],
    }
  } catch (error) {
    console.error('[HTML Scraper] ❌ Error:', error)
    return null
  }
}

/**
 * Get main product media (prefer video if available)
 */
export async function getShopeeProductMediaFromHTML(productUrl: string): Promise<{
  url: string
  type: 'IMAGE' | 'VIDEO'
  thumbnail?: string
} | null> {
  const result = await scrapeShopeeProductHTML(productUrl)

  if (!result) return null

  if (result.video) {
    return {
      url: result.video,
      type: 'VIDEO',
      thumbnail: result.mainImage,
    }
  }

  return {
    url: result.mainImage,
    type: 'IMAGE',
  }
}
