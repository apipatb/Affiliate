import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

interface ScrapeRequest {
  url: string
  limit: number
}

// Helper function to delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Random delay between min and max seconds
const randomDelay = async (minSec: number = 2, maxSec: number = 3) => {
  const ms = (Math.random() * (maxSec - minSec) + minSec) * 1000
  await delay(ms)
}

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const auth = await requireAuth(request)
    if (!auth.session || auth.session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ScrapeRequest = await request.json()
    const { url, limit = 50 } = body

    // Validate inputs
    if (!url || !url.includes('shopee.co.th')) {
      return NextResponse.json(
        { error: 'Invalid URL - must be a Shopee URL' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    console.log(`[Scraper] Starting scrape: ${url} (limit: ${limit})`)

    // NOTE: Shopee Affiliate Dashboard requires authentication and likely renders via JavaScript
    // This is a challenge for server-side scraping

    // RECOMMENDED APPROACH:
    // Instead of server-side scraping, we should provide a browser extension or bookmarklet
    // that users can use while logged into Shopee Affiliate Dashboard

    // For now, let's return a helpful error message with instructions
    return NextResponse.json(
      {
        error: 'Server-side scraping not available',
        message: 'หน้า Shopee Affiliate Dashboard ต้องการการ login และใช้ JavaScript rendering',
        solution: {
          method1: {
            title: 'วิธีที่ 1: Browser Extension (แนะนำ)',
            description: 'ติดตั้ง Extension แล้วกดปุ่มเดียวเพื่อดึงข้อมูล',
            available: false,
          },
          method2: {
            title: 'วิธีที่ 2: Bookmarklet Script',
            description: 'Copy JavaScript code ไปวางใน Console ของ browser',
            available: true,
            code: `
// Shopee Affiliate Scraper Bookmarklet
(function() {
  const products = [];
  const items = document.querySelectorAll('[data-product-id]'); // Update selector

  items.forEach((item, index) => {
    if (index >= ${limit}) return;

    const title = item.querySelector('.product-title')?.textContent?.trim();
    const price = item.querySelector('.product-price')?.textContent?.trim();
    const image = item.querySelector('img')?.src;
    const link = item.querySelector('a')?.href;

    if (title && price && image && link) {
      products.push({ title, price, image, link });
    }
  });

  console.log('Found products:', products.length);

  // Convert to CSV
  const csv = products.map(p =>
    [p.title, p.price, p.image, p.link].join(',')
  ).join('\\n');

  // Download CSV
  const blob = new Blob(['\\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shopee-products.csv';
  a.click();
})();
            `.trim(),
          },
          method3: {
            title: 'วิธีที่ 3: Manual CSV Export',
            description: 'Export CSV จาก Shopee Affiliate Dashboard โดยตรง แล้ว import ที่นี่',
            available: true,
          },
        },
      },
      { status: 501 }
    )

    // IF WE HAD PUPPETEER/PLAYWRIGHT:
    // const browser = await puppeteer.launch()
    // const page = await browser.newPage()
    // await page.goto(url)
    // const products = await page.evaluate(() => {
    //   return Array.from(document.querySelectorAll('.product-item')).map(el => ({
    //     title: el.querySelector('.title')?.textContent,
    //     price: el.querySelector('.price')?.textContent,
    //     image: el.querySelector('img')?.src,
    //   }))
    // })
    // await browser.close()
    // return NextResponse.json({ products })

  } catch (error) {
    console.error('[Scraper] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
