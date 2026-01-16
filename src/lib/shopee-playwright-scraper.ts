/**
 * Shopee Image Scraper using Playwright
 * Server-side only utility for extracting images from Shopee product pages
 */

import { chromium, Browser, Page } from 'playwright'

let browser: Browser | null = null

/**
 * Get or create a shared browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    console.log('[Playwright] Launching browser...')
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    })
  }
  return browser
}

/**
 * Close the shared browser instance
 */
export async function closeBrowser() {
  if (browser) {
    await browser.close()
    browser = null
  }
}

/**
 * Extract image URLs from Shopee product page
 */
export async function extractImagesFromShopee(productUrl: string): Promise<string[]> {
  const browserInstance = await getBrowser()
  const context = await browserInstance.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  })

  const page = await context.newPage()

  try {
    console.log(`[Playwright] Navigating to: ${productUrl}`)

    await page.goto(productUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    // Wait longer for images to load and scroll to trigger lazy loading
    await page.waitForTimeout(2000)

    // Scroll down to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, 500)
    })

    await page.waitForTimeout(3000) // Wait for lazy-loaded images

    // Extract image URLs with better filtering
    const imageUrls = await page.evaluate(() => {
      const urls = new Set<string>()

      // Method 1: Look for specific Shopee product image containers
      // Shopee often uses specific class patterns for product images
      const productImageSelectors = [
        '.page-product__image-wrapper img',
        '.product-image img',
        '[class*="image-view"] img',
        '[class*="product-images"] img',
        '.flex-col img',
        '[data-testid*="image"] img'
      ]

      productImageSelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(img => {
            const element = img as HTMLImageElement
            const src = element.src || element.getAttribute('data-src') || element.getAttribute('data-lazy-src')

            if (src &&
                src.includes('susercontent.com') &&
                !src.includes('_tn') &&
                !src.includes('avatar') &&
                !src.includes('icon') &&
                !src.includes('shopee-logo') &&
                !src.includes('seller') &&
                (element.width > 200 || element.naturalWidth > 200 || src.includes('file/'))) {
              // Remove size parameters and get original
              const cleanUrl = src.split('?')[0]
              urls.add(cleanUrl)
            }
          })
        } catch (e) {
          // Ignore selector errors
        }
      })

      // Method 2: Find all large images (fallback)
      if (urls.size === 0) {
        document.querySelectorAll('img').forEach(img => {
          const element = img as HTMLImageElement
          const src = element.src || element.getAttribute('data-src')

          if (src &&
              src.includes('susercontent.com') &&
              !src.includes('_tn') &&
              !src.includes('avatar') &&
              !src.includes('icon') &&
              !src.includes('shopee-logo') &&
              !src.includes('seller') &&
              !src.includes('placeholder') &&
              (element.naturalWidth > 300 || element.width > 300)) {
            const cleanUrl = src.split('?')[0]
            urls.add(cleanUrl)
          }
        })
      }

      // Method 3: Find background images in product gallery
      document.querySelectorAll('[class*="image"], [class*="gallery"], [class*="slider"]').forEach(el => {
        const style = (el as HTMLElement).style.backgroundImage
        if (style) {
          const match = style.match(/url\(['"]?(.*?)['"]?\)/)
          if (match && match[1] &&
              match[1].includes('susercontent.com') &&
              !match[1].includes('_tn') &&
              !match[1].includes('placeholder')) {
            const cleanUrl = match[1].split('?')[0]
            urls.add(cleanUrl)
          }
        }
      })

      return Array.from(urls)
    })

    console.log(`[Playwright] Found ${imageUrls.length} images`)

    // Filter out any remaining placeholder patterns
    const filteredUrls = imageUrls.filter(url =>
      !url.includes('logo') &&
      !url.includes('default') &&
      !url.includes('placeholder') &&
      url.includes('file/')
    )

    console.log(`[Playwright] After filtering: ${filteredUrls.length} images`)
    return filteredUrls

  } catch (error) {
    console.error(`[Playwright] Error extracting images:`, error)
    return []
  } finally {
    await page.close()
    await context.close()
  }
}

/**
 * Extract images from multiple products (batch processing)
 */
export async function extractImagesBatch(
  products: Array<{ productLink: string; title: string }>,
  onProgress?: (current: number, total: number, title: string) => void
): Promise<Map<string, string[]>> {
  const results = new Map<string, string[]>()

  console.log(`[Playwright] Starting batch extraction for ${products.length} products`)

  for (let i = 0; i < products.length; i++) {
    const product = products[i]

    if (onProgress) {
      onProgress(i + 1, products.length, product.title)
    }

    console.log(`[Playwright] [${i + 1}/${products.length}] ${product.title.substring(0, 50)}...`)

    try {
      const images = await extractImagesFromShopee(product.productLink)
      results.set(product.productLink, images)

      // Small delay between requests
      if (i < products.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    } catch (error) {
      console.error(`[Playwright] Failed to extract images for: ${product.title}`)
      results.set(product.productLink, [])
    }
  }

  console.log(`[Playwright] Batch extraction completed`)
  return results
}
