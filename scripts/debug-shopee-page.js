/**
 * Debug script to see what Shopee page HTML looks like
 */

const { chromium } = require('playwright');

async function debugShopeePage(url) {
  console.log('🔍 Debugging Shopee page...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser to see what happens
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('📍 Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    console.log('⏳ Waiting 5 seconds...');
    await page.waitForTimeout(5000);

    // Scroll to trigger lazy loading
    console.log('📜 Scrolling...');
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(3000);

    // Try to find product images
    const analysis = await page.evaluate(() => {
      const results = {
        totalImages: 0,
        productImages: [],
        allImageSrcs: [],
        thumbnails: [],
        largeImages: [],
      };

      // Count all images
      const allImages = document.querySelectorAll('img');
      results.totalImages = allImages.length;

      allImages.forEach(img => {
        const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
        const width = img.width || img.naturalWidth;
        const height = img.height || img.naturalHeight;

        if (src) {
          results.allImageSrcs.push({
            src: src.substring(0, 100),
            width,
            height,
            classes: img.className,
          });

          if (src.includes('susercontent.com')) {
            if (width > 300 || height > 300) {
              results.largeImages.push(src);
            }
            if (src.includes('_tn')) {
              results.thumbnails.push(src);
            } else if (src.includes('file/')) {
              results.productImages.push(src);
            }
          }
        }
      });

      return results;
    });

    console.log('\n📊 Analysis Results:');
    console.log('─'.repeat(60));
    console.log(`Total <img> tags found: ${analysis.totalImages}`);
    console.log(`Large images (>300px): ${analysis.largeImages.length}`);
    console.log(`Thumbnails (_tn): ${analysis.thumbnails.length}`);
    console.log(`Product images (file/): ${analysis.productImages.length}`);

    if (analysis.productImages.length > 0) {
      console.log('\n✅ Product Images Found:');
      analysis.productImages.slice(0, 5).forEach((url, i) => {
        console.log(`  ${i + 1}. ${url.substring(0, 80)}...`);
      });
    }

    if (analysis.largeImages.length > 0) {
      console.log('\n📸 Large Images Found:');
      analysis.largeImages.slice(0, 5).forEach((url, i) => {
        console.log(`  ${i + 1}. ${url.substring(0, 80)}...`);
      });
    }

    console.log('\n🔍 Sample of all images:');
    analysis.allImageSrcs.slice(0, 10).forEach((img, i) => {
      console.log(`  ${i + 1}. [${img.width}x${img.height}] ${img.src}...`);
      if (img.classes) console.log(`     Classes: ${img.classes.substring(0, 50)}`);
    });

    // Take screenshot
    await page.screenshot({ path: 'shopee-debug.png', fullPage: true });
    console.log('\n📷 Screenshot saved: shopee-debug.png');

    console.log('\n⏸️  Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

const url = process.argv[2] || 'https://shopee.co.th/product/392907657/29633783059';
debugShopeePage(url).catch(console.error);
