/**
 * Test scraper with ONE product to debug
 */

const { chromium } = require('playwright');

async function testOneProduct() {
  console.log('🧪 Testing Shopee Image Extraction\n');

  const url = 'https://shopee.co.th/product/392907657/29633783059';

  const browser = await chromium.launch({
    headless: false, // Show browser
    slowMo: 1000, // Slow down by 1 second per step
  });

  const page = await browser.newPage();

  try {
    console.log('1️⃣ Navigating...');
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });

    console.log('2️⃣ Waiting for page to settle (10 seconds)...');
    await page.waitForTimeout(10000);

    console.log('3️⃣ Scrolling...');
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(3000);

    console.log('4️⃣ Extracting images...');
    const images = await page.evaluate(() => {
      const found = [];

      document.querySelectorAll('img').forEach(img => {
        const src = img.src || img.getAttribute('data-src');
        if (src && src.includes('susercontent.com') && src.includes('file/')) {
          found.push({
            src: src,
            width: img.width || img.naturalWidth,
            height: img.height || img.naturalHeight,
          });
        }
      });

      return found;
    });

    console.log(`\n✅ Found ${images.length} images:`);
    images.forEach((img, i) => {
      console.log(`${i + 1}. [${img.width}x${img.height}]`);
      console.log(`   ${img.src.substring(0, 100)}...`);
    });

    console.log('\n📷 Taking screenshot...');
    await page.screenshot({ path: 'test-shopee.png' });

    console.log('\n✨ Waiting 20 seconds for you to inspect...');
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n🛑 Done!');
  }
}

testOneProduct().catch(console.error);
