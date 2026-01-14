/**
 * Shopee Product Scraper
 * Fetches product images and videos from Shopee URLs
 */

interface ShopeeMedia {
  type: 'IMAGE' | 'VIDEO'
  url: string
  thumbnail?: string
}

interface ShopeeProduct {
  itemId: string
  shopId: string
  images: string[]
  video?: string
  thumbnail?: string
}

/**
 * Extract shop_id and item_id from Shopee URL
 */
export function extractShopeeIds(url: string): { shopId: string; itemId: string } | null {
  try {
    // Format 1: /product/{shop_id}/{item_id}
    const productPattern = /shopee\.co\.th\/product\/(\d+)\/(\d+)/
    let match = url.match(productPattern)

    if (match) {
      return { shopId: match[1], itemId: match[2] }
    }

    // Format 2: /-i.{shop_id}.{item_id}
    const iPattern = /shopee\.co\.th\/.*-i\.(\d+)\.(\d+)/
    match = url.match(iPattern)

    if (match) {
      return { shopId: match[1], itemId: match[2] }
    }

    return null
  } catch (error) {
    console.error('Error extracting Shopee IDs:', error)
    return null
  }
}

/**
 * Fetch product data from Shopee API
 */
async function fetchShopeeProduct(shopId: string, itemId: string): Promise<ShopeeProduct | null> {
  try {
    const apiUrl = `https://shopee.co.th/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://shopee.co.th/',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': 'https://shopee.co.th',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      console.error(`Shopee API error: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (!data.data) {
      console.error('No data in Shopee response')
      return null
    }

    const item = data.data

    // Extract images
    const images: string[] = []
    if (item.images && Array.isArray(item.images)) {
      item.images.forEach((img: string) => {
        images.push(`https://down-th.img.susercontent.com/file/${img}`)
      })
    } else if (item.image) {
      images.push(`https://down-th.img.susercontent.com/file/${item.image}`)
    }

    // Extract video
    let video: string | undefined
    if (item.video_info_list && item.video_info_list.length > 0) {
      const videoInfo = item.video_info_list[0]
      if (videoInfo.default_format?.url) {
        video = videoInfo.default_format.url
      }
    }

    return {
      itemId,
      shopId,
      images,
      video,
      thumbnail: images[0], // First image as thumbnail
    }
  } catch (error) {
    console.error('Error fetching Shopee product:', error)
    return null
  }
}

/**
 * Get best media (prefer video if available, otherwise first image)
 */
export async function getShopeeMedia(productUrl: string): Promise<ShopeeMedia | null> {
  try {
    const ids = extractShopeeIds(productUrl)
    if (!ids) {
      console.error('Failed to extract Shopee IDs from URL:', productUrl)
      return null
    }

    const product = await fetchShopeeProduct(ids.shopId, ids.itemId)
    if (!product) {
      console.error('Failed to fetch Shopee product data')
      return null
    }

    // Prefer video if available
    if (product.video) {
      return {
        type: 'VIDEO',
        url: product.video,
        thumbnail: product.thumbnail,
      }
    }

    // Otherwise use first image
    if (product.images.length > 0) {
      return {
        type: 'IMAGE',
        url: product.images[0],
      }
    }

    return null
  } catch (error) {
    console.error('Error getting Shopee media:', error)
    return null
  }
}

/**
 * Get all images from Shopee product
 */
export async function getShopeeImages(productUrl: string): Promise<string[]> {
  try {
    const ids = extractShopeeIds(productUrl)
    if (!ids) return []

    const product = await fetchShopeeProduct(ids.shopId, ids.itemId)
    if (!product) return []

    return product.images
  } catch (error) {
    console.error('Error getting Shopee images:', error)
    return []
  }
}
