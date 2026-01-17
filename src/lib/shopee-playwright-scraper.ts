/**
 * Shopee Image Scraper using Playwright
 * Server-side only utility for extracting images from Shopee product pages
 * Uses persistent context to maintain login session
 */

import { chromium, BrowserContext } from 'playwright'
import path from 'path'
import fs from 'fs'

// Directory to store browser session data (cookies, localStorage, etc.)
const USER_DATA_DIR = path.join(process.cwd(), '.playwright-session')

let persistentContext: BrowserContext | null = null

/**
 * Get or create a persistent browser context
 * This maintains login session across requests
 */
async function getPersistentContext(headless: boolean = true): Promise<BrowserContext> {
  if (persistentContext && persistentContext.browser()?.isConnected()) {
    return persistentContext
  }

  // Ensure user data directory exists
  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true })
  }

  console.log('[Playwright] Launching persistent browser context...')
  console.log(`[Playwright] Session directory: ${USER_DATA_DIR}`)

  persistentContext = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless,
    slowMo: headless ? 0 : 50,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  })

  return persistentContext
}

/**
 * Check if Shopee session is logged in
 */
export async function checkShopeeSession(): Promise<{ loggedIn: boolean; username?: string }> {
  try {
    const context = await getPersistentContext(true)
    const page = await context.newPage()

    try {
      await page.goto('https://affiliate.shopee.co.th/account/signin', {
        waitUntil: 'networkidle',
        timeout: 15000
      })

      // Check if redirected to dashboard (means logged in)
      const currentUrl = page.url()
      if (currentUrl.includes('offer') || currentUrl.includes('dashboard') || currentUrl.includes('home')) {
        // Try to get username
        const username = await page.evaluate(() => {
          const el = document.querySelector('[class*="username"], [class*="user-name"], .account-name')
          return el?.textContent?.trim() || undefined
        })
        return { loggedIn: true, username }
      }

      return { loggedIn: false }
    } finally {
      await page.close()
    }
  } catch (error) {
    console.error('[Playwright] Error checking session:', error)
    return { loggedIn: false }
  }
}

/**
 * Open browser for manual Shopee login
 * Returns when user completes login or timeout
 */
export async function openShopeeLogin(): Promise<{ success: boolean; message: string }> {
  try {
    // Close existing context first (it might be headless)
    await closeBrowser()

    // Launch with headless: false so user can see and interact
    const context = await getPersistentContext(false)
    const page = await context.newPage()

    console.log('[Playwright] Opening Shopee login page...')
    await page.goto('https://affiliate.shopee.co.th/account/signin', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    })

    // Wait for user to login (check for redirect to dashboard)
    console.log('[Playwright] Waiting for user to login...')

    try {
      // Wait up to 5 minutes for login
      await page.waitForURL(/offer|dashboard|home/, { timeout: 300000 })
      console.log('[Playwright] Login successful!')

      await page.close()
      return { success: true, message: 'เข้าสู่ระบบ Shopee สำเร็จ! Session จะถูกเก็บไว้ใช้งานต่อ' }
    } catch {
      await page.close()
      return { success: false, message: 'หมดเวลา หรือ login ไม่สำเร็จ' }
    }
  } catch (error) {
    console.error('[Playwright] Login error:', error)
    return { success: false, message: `เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown'}` }
  }
}

/**
 * Close the persistent browser context
 */
export async function closeBrowser() {
  if (persistentContext) {
    await persistentContext.close()
    persistentContext = null
  }
}

/**
 * Clear saved session (logout)
 */
export async function clearSession(): Promise<void> {
  await closeBrowser()
  if (fs.existsSync(USER_DATA_DIR)) {
    fs.rmSync(USER_DATA_DIR, { recursive: true, force: true })
    console.log('[Playwright] Session cleared')
  }
}

/**
 * Extract image URLs from Shopee product page
 * Uses persistent context to maintain login session
 */
export async function extractImagesFromShopee(productUrl: string): Promise<string[]> {
  const context = await getPersistentContext(true)
  const page = await context.newPage()

  try {
    console.log(`[Playwright] Navigating to: ${productUrl}`)

    // Navigate and wait for redirects (short links redirect to actual product page)
    await page.goto(productUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    })

    // Wait for URL to change (for short links that redirect)
    await page.waitForTimeout(3000)

    const finalUrl = page.url()
    console.log(`[Playwright] Final URL: ${finalUrl}`)

    // Wait for product images to load
    try {
      await page.waitForSelector('img[src*="susercontent.com"]', { timeout: 10000 })
    } catch {
      console.log('[Playwright] No Shopee images found with selector, trying alternative...')
    }

    // Scroll to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, 300)
    })
    await page.waitForTimeout(2000)

    await page.evaluate(() => {
      window.scrollTo(0, 600)
    })
    await page.waitForTimeout(2000)

    // Extract image URLs - find ALL images with susercontent.com
    const imageUrls = await page.evaluate(() => {
      const urls = new Set<string>()

      // Get all images on the page
      document.querySelectorAll('img').forEach(img => {
        const element = img as HTMLImageElement
        const src = element.src || element.getAttribute('data-src') || element.getAttribute('data-lazy-src')

        if (src && src.includes('susercontent.com')) {
          // Clean URL and add
          const cleanUrl = src.split('?')[0]
          urls.add(cleanUrl)
        }
      })

      // Also check background images
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el)
        const bgImage = style.backgroundImage
        if (bgImage && bgImage !== 'none') {
          const match = bgImage.match(/url\(['"]?(.*?)['"]?\)/)
          if (match && match[1] && match[1].includes('susercontent.com')) {
            const cleanUrl = match[1].split('?')[0]
            urls.add(cleanUrl)
          }
        }
      })

      return Array.from(urls)
    })

    console.log(`[Playwright] Found ${imageUrls.length} total images`)

    // Filter to get only product images (not icons, avatars, etc.)
    const filteredUrls = imageUrls.filter((url: string) => {
      // Must have file/ in URL (product images)
      if (!url.includes('/file/')) return false

      // Exclude small images (thumbnails, icons)
      if (url.includes('_tn')) return false

      // Exclude avatars, logos, icons
      if (url.includes('avatar')) return false
      if (url.includes('logo')) return false
      if (url.includes('icon')) return false
      if (url.includes('seller')) return false
      if (url.includes('shop')) return false
      if (url.includes('badge')) return false
      if (url.includes('voucher')) return false
      if (url.includes('coin')) return false

      return true
    })

    console.log(`[Playwright] After filtering: ${filteredUrls.length} product images`)

    // Log first few URLs for debugging
    filteredUrls.slice(0, 3).forEach((url, i) => {
      console.log(`[Playwright] Image ${i + 1}: ${url.substring(0, 80)}...`)
    })

    return filteredUrls

  } catch (error) {
    console.error(`[Playwright] Error extracting images:`, error)
    return []
  } finally {
    await page.close()
    // Don't close context - keep it for reuse
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
