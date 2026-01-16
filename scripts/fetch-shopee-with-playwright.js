/**
 * Automated Shopee Image Fetcher using Playwright
 *
 * This script uses browser automation to:
 * 1. Read CSV with Shopee product links
 * 2. Open each product page in browser
 * 3. Wait for images to load
 * 4. Extract all image and video URLs
 * 5. Download media files
 * 6. Update CSV with local image paths
 *
 * Usage:
 *   node scripts/fetch-shopee-with-playwright.js input.csv output.csv [options]
 *
 * Options:
 *   --headless        Run browser in headless mode (no window)
 *   --limit=N         Process only first N products
 *   --delay=MS        Delay between products in milliseconds (default: 2000)
 *   --skip-download   Only extract URLs, don't download images
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

// Parse CSV
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].replace(/^\ufeff/, '').split(',');
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index].replace(/^"|"$/g, '');
      });
      rows.push(row);
    }
  }

  return rows;
}

// Convert to CSV
function jsonToCSV(data, headers) {
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = (row[header] || '').toString();
      return value.includes(',') || value.includes('"')
        ? `"${value.replace(/"/g, '""')}"`
        : value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// Download file
async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://shopee.co.th/'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const fileStream = require('fs').createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve(filepath);
      });

      fileStream.on('error', (err) => {
        require('fs').unlink(filepath, () => reject(err));
      });
    });

    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Extract media from Shopee page using Playwright
async function extractMediaFromPage(page, url) {
  console.log('  🌐 Navigating to:', url);

  try {
    // Navigate to page
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for product images to load
    await page.waitForTimeout(3000);

    // Try multiple selectors for images
    const imageUrls = await page.evaluate(() => {
      const urls = new Set();

      // Method 1: Find all img tags
      document.querySelectorAll('img').forEach(img => {
        const src = img.src || img.getAttribute('data-src');
        if (src &&
            (src.includes('susercontent.com') || src.includes('shopee')) &&
            !src.includes('_tn') &&
            !src.includes('avatar') &&
            !src.includes('icon') &&
            (img.width > 200 || img.naturalWidth > 200)) {
          urls.add(src);
        }
      });

      // Method 2: Find background images
      document.querySelectorAll('[style*="background-image"]').forEach(el => {
        const style = el.style.backgroundImage;
        const match = style.match(/url\(['"]?(.*?)['"]?\)/);
        if (match && match[1] &&
            (match[1].includes('susercontent.com') || match[1].includes('shopee')) &&
            !match[1].includes('_tn')) {
          urls.add(match[1]);
        }
      });

      // Method 3: Check for data attributes
      document.querySelectorAll('[data-image], [data-src]').forEach(el => {
        const src = el.getAttribute('data-image') || el.getAttribute('data-src');
        if (src &&
            (src.includes('susercontent.com') || src.includes('shopee')) &&
            !src.includes('_tn')) {
          urls.add(src);
        }
      });

      return Array.from(urls);
    });

    // Try to find video URLs
    const videoUrls = await page.evaluate(() => {
      const urls = new Set();

      // Find video tags
      document.querySelectorAll('video source, video').forEach(video => {
        const src = video.src || video.getAttribute('data-src');
        if (src && (src.includes('.mp4') || src.includes('video'))) {
          urls.add(src);
        }
      });

      return Array.from(urls);
    });

    console.log(`  ✅ Found ${imageUrls.length} images, ${videoUrls.length} videos`);

    return {
      images: imageUrls,
      videos: videoUrls
    };

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return {
      images: [],
      videos: []
    };
  }
}

// Process a single product
async function processProduct(page, product, index, outputDir, options) {
  const productId = product['รหัสสินค้า'] || product.productId || `product-${index}`;
  const productName = product['ชื่อสินค้า'] || product.title || 'Unnamed';
  const productLink = product['ลิงก์สินค้า'] || product.productLink;

  console.log(`\n[${'='.repeat(60)}]`);
  console.log(`[${index + 1}] ${productName}`);
  console.log(`🆔 ID: ${productId}`);

  if (!productLink) {
    console.log('  ⚠️  No product link');
    return { ...product, mediaStatus: 'no-link' };
  }

  try {
    // Extract media from page
    const media = await extractMediaFromPage(page, productLink);

    if (media.images.length === 0 && media.videos.length === 0) {
      console.log('  ⚠️  No media found');
      return { ...product, mediaStatus: 'no-media' };
    }

    // Store URLs
    const imageUrls = media.images.join('|');
    const videoUrls = media.videos.join('|');

    // If skip download, just return URLs
    if (options.skipDownload) {
      console.log('  ℹ️  Skipping download (--skip-download)');
      return {
        ...product,
        imageUrls,
        videoUrls,
        imagesCount: media.images.length,
        videosCount: media.videos.length,
        mediaStatus: 'urls-extracted'
      };
    }

    // Download media
    const productDir = path.join(outputDir, productId.toString());
    await fs.mkdir(productDir, { recursive: true });

    const downloadedImages = [];
    const downloadedVideos = [];

    // Download images
    for (let i = 0; i < media.images.length; i++) {
      try {
        const url = media.images[i];
        const ext = path.extname(new URL(url).pathname) || '.jpg';
        const filename = `image-${i + 1}${ext}`;
        const filepath = path.join(productDir, filename);

        console.log(`  ⬇️  Image [${i + 1}/${media.images.length}]...`);
        await downloadFile(url, filepath);

        downloadedImages.push(`/products/${productId}/${filename}`);
      } catch (error) {
        console.log(`  ❌ Failed image ${i + 1}: ${error.message}`);
      }
    }

    // Download videos
    for (let i = 0; i < media.videos.length; i++) {
      try {
        const url = media.videos[i];
        const filename = `video-${i + 1}.mp4`;
        const filepath = path.join(productDir, filename);

        console.log(`  ⬇️  Video [${i + 1}/${media.videos.length}]...`);
        await downloadFile(url, filepath);

        downloadedVideos.push(`/products/${productId}/${filename}`);
      } catch (error) {
        console.log(`  ❌ Failed video ${i + 1}: ${error.message}`);
      }
    }

    console.log(`  ✅ Downloaded: ${downloadedImages.length} images, ${downloadedVideos.length} videos`);

    return {
      ...product,
      imageUrls,
      videoUrls,
      downloadedImages: downloadedImages.join('|'),
      downloadedVideos: downloadedVideos.join('|'),
      imagesCount: downloadedImages.length,
      videosCount: downloadedVideos.length,
      mediaStatus: 'success'
    };

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return { ...product, mediaStatus: 'error', error: error.message };
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const inputFile = args.find(arg => !arg.startsWith('--'));
  const outputFile = args[1] && !args[1].startsWith('--') ? args[1] : 'shopee-products-with-media.csv';

  const options = {
    headless: args.includes('--headless'),
    limit: parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || null,
    delay: parseInt(args.find(arg => arg.startsWith('--delay='))?.split('=')[1]) || 2000,
    skipDownload: args.includes('--skip-download')
  };

  if (!inputFile) {
    console.log(`
🤖 Shopee Media Fetcher with Playwright
========================================

Automatically extracts images and videos from Shopee product pages using browser automation.

Usage:
  node scripts/fetch-shopee-with-playwright.js <input.csv> [output.csv] [options]

Options:
  --headless          Run browser in headless mode (no window)
  --limit=N           Process only first N products
  --delay=MS          Delay between products in milliseconds (default: 2000)
  --skip-download     Only extract URLs, don't download files

Examples:
  # Basic usage (show browser)
  node scripts/fetch-shopee-with-playwright.js products.csv output.csv

  # Headless mode (faster, no browser window)
  node scripts/fetch-shopee-with-playwright.js products.csv output.csv --headless

  # Test with first 3 products
  node scripts/fetch-shopee-with-playwright.js products.csv output.csv --limit=3

  # Only extract URLs (no download)
  node scripts/fetch-shopee-with-playwright.js products.csv output.csv --skip-download

CSV Format:
  Must have columns: รหัสสินค้า (or productId), ลิงก์สินค้า (or productLink)
    `);
    process.exit(0);
  }

  console.log('🤖 Shopee Media Fetcher with Playwright');
  console.log('=========================================\n');
  console.log(`📄 Input:     ${inputFile}`);
  console.log(`💾 Output:    ${outputFile}`);
  console.log(`👁️  Headless:  ${options.headless ? 'Yes' : 'No'}`);
  console.log(`⏱️  Delay:     ${options.delay}ms`);
  if (options.limit) console.log(`🔢 Limit:     ${options.limit} products`);
  if (options.skipDownload) console.log(`⏭️  Mode:      Extract URLs only (no download)`);
  console.log('');

  // Create output directory
  const outputDir = path.join(process.cwd(), 'public', 'products');
  await fs.mkdir(outputDir, { recursive: true });
  console.log(`📁 Output dir: ${outputDir}\n`);

  // Read CSV
  const csvContent = await fs.readFile(inputFile, 'utf-8');
  let products = parseCSV(csvContent);

  // Apply limit
  if (options.limit) {
    products = products.slice(0, options.limit);
  }

  console.log(`📦 Products: ${products.length}\n`);
  console.log('🚀 Starting browser...\n');

  // Launch browser
  const browser = await chromium.launch({
    headless: options.headless
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  console.log('✅ Browser ready\n');
  console.log('='.repeat(70));

  // Process products
  const results = [];
  for (let i = 0; i < products.length; i++) {
    const result = await processProduct(page, products[i], i, outputDir, options);
    results.push(result);

    // Delay between products
    if (i < products.length - 1) {
      console.log(`\n  ⏱️  Waiting ${options.delay}ms...\n`);
      await page.waitForTimeout(options.delay);
    }
  }

  // Close browser
  await browser.close();
  console.log('\n' + '='.repeat(70));
  console.log('\n🛑 Browser closed\n');

  // Summary
  console.log('📊 Summary:');
  const success = results.filter(r => r.mediaStatus === 'success' || r.mediaStatus === 'urls-extracted').length;
  const failed = results.filter(r => r.mediaStatus === 'error').length;
  const noMedia = results.filter(r => r.mediaStatus === 'no-media').length;
  const noLink = results.filter(r => r.mediaStatus === 'no-link').length;
  const totalImages = results.reduce((sum, r) => sum + (r.imagesCount || 0), 0);
  const totalVideos = results.reduce((sum, r) => sum + (r.videosCount || 0), 0);

  console.log(`  ✅ Success:   ${success}`);
  console.log(`  ❌ Failed:    ${failed}`);
  console.log(`  ⚠️  No media:  ${noMedia}`);
  console.log(`  ⚠️  No link:   ${noLink}`);
  console.log(`  🖼️  Images:    ${totalImages}`);
  console.log(`  🎬 Videos:    ${totalVideos}`);

  // Write CSV
  const originalHeaders = Object.keys(products[0]);
  const newHeaders = [
    ...originalHeaders,
    'imageUrls',
    'videoUrls',
    'downloadedImages',
    'downloadedVideos',
    'imagesCount',
    'videosCount',
    'mediaStatus'
  ].filter((v, i, a) => a.indexOf(v) === i);

  const csvOutput = jsonToCSV(results, newHeaders);
  await fs.writeFile(outputFile, csvOutput, 'utf-8');

  console.log(`\n💾 Saved: ${outputFile}`);
  console.log('\n✨ Done!\n');
}

// Run
main().catch(console.error);
