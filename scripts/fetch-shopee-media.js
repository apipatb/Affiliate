/**
 * Script to fetch product images and videos from Shopee product links
 * Reads CSV, scrapes media from Shopee pages, downloads them, and updates CSV
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

// Parse CSV manually to avoid dependencies
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].replace(/^\ufeff/, '').split(','); // Remove BOM
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      rows.push(row);
    }
  }

  return rows;
}

// Convert JSON to CSV
function jsonToCSV(data, headers) {
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape commas in values
      return value.toString().includes(',') ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// Download file from URL
async function downloadFile(url, filepath) {
  const protocol = url.startsWith('https') ? https : http;

  return new Promise((resolve, reject) => {
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        return downloadFile(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const fileStream = require('fs').createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve(filepath);
      });

      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

// Fetch HTML content from URL
async function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return fetchHTML(response.headers.location).then(resolve).catch(reject);
      }

      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Extract media URLs from Shopee product page
function extractMediaFromHTML(html) {
  const media = {
    images: [],
    videos: []
  };

  try {
    // Look for image URLs in various patterns
    // Pattern 1: Look for image URLs in script tags or data attributes
    const imageRegex = /https?:\/\/[^"\s]+\.susercontent\.com\/file\/[^"\s]+/g;
    const foundImages = html.match(imageRegex) || [];

    // Deduplicate and filter images
    const uniqueImages = [...new Set(foundImages)].filter(url => {
      // Filter out small icons/thumbnails (usually have _tn in the URL)
      return !url.includes('_tn') && (
        url.includes('.jpg') ||
        url.includes('.jpeg') ||
        url.includes('.png') ||
        url.includes('.webp')
      );
    });

    media.images = uniqueImages.slice(0, 10); // Max 10 images

    // Look for video URLs
    const videoRegex = /https?:\/\/[^"\s]+\.susercontent\.com\/api\/v4\/[^"\s]+video[^"\s]*/g;
    const foundVideos = html.match(videoRegex) || [];
    media.videos = [...new Set(foundVideos)];

    // Also look for mp4 files
    const mp4Regex = /https?:\/\/[^"\s]+\.mp4/g;
    const foundMp4s = html.match(mp4Regex) || [];
    media.videos.push(...foundMp4s);
    media.videos = [...new Set(media.videos)];

  } catch (error) {
    console.error('Error extracting media:', error);
  }

  return media;
}

// Process a single product
async function processProduct(product, index, outputDir) {
  console.log(`\n[${index + 1}] Processing: ${product['ชื่อสินค้า'] || product.title}`);

  const productLink = product['ลิงก์สินค้า'] || product.productLink;
  if (!productLink) {
    console.log('  ⚠️  No product link found');
    return { ...product, mediaStatus: 'no-link' };
  }

  try {
    console.log(`  📥 Fetching: ${productLink}`);
    const html = await fetchHTML(productLink);

    console.log('  🔍 Extracting media...');
    const media = extractMediaFromHTML(html);

    console.log(`  ✅ Found ${media.images.length} images, ${media.videos.length} videos`);

    // Download media
    const productId = product['รหัสสินค้า'] || product.productId || `product-${index}`;
    const productDir = path.join(outputDir, productId.toString());

    await fs.mkdir(productDir, { recursive: true });

    const downloadedImages = [];
    const downloadedVideos = [];

    // Download images
    for (let i = 0; i < media.images.length; i++) {
      try {
        const imageUrl = media.images[i];
        const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
        const filename = `image-${i + 1}${ext}`;
        const filepath = path.join(productDir, filename);

        console.log(`  ⬇️  Downloading image ${i + 1}/${media.images.length}...`);
        await downloadFile(imageUrl, filepath);

        // Store relative path for CSV
        downloadedImages.push(`/products/${productId}/${filename}`);
      } catch (error) {
        console.log(`  ❌ Failed to download image ${i + 1}:`, error.message);
      }
    }

    // Download videos
    for (let i = 0; i < media.videos.length; i++) {
      try {
        const videoUrl = media.videos[i];
        const filename = `video-${i + 1}.mp4`;
        const filepath = path.join(productDir, filename);

        console.log(`  ⬇️  Downloading video ${i + 1}/${media.videos.length}...`);
        await downloadFile(videoUrl, filepath);

        downloadedVideos.push(`/products/${productId}/${filename}`);
      } catch (error) {
        console.log(`  ❌ Failed to download video ${i + 1}:`, error.message);
      }
    }

    return {
      ...product,
      imageUrls: downloadedImages.join('|'),
      videoUrls: downloadedVideos.join('|'),
      mediaStatus: 'success',
      imagesCount: downloadedImages.length,
      videosCount: downloadedVideos.length
    };

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return { ...product, mediaStatus: 'error', error: error.message };
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const inputFile = args[0] || 'public/sample-shopee-import.csv';
  const outputFile = args[1] || 'shopee-products-with-media.csv';

  console.log('🚀 Shopee Media Fetcher');
  console.log('========================\n');
  console.log(`📄 Input CSV: ${inputFile}`);
  console.log(`💾 Output CSV: ${outputFile}\n`);

  // Create output directory
  const outputDir = path.join(process.cwd(), 'public', 'products');
  await fs.mkdir(outputDir, { recursive: true });
  console.log(`📁 Media directory: ${outputDir}\n`);

  // Read CSV
  const csvContent = await fs.readFile(inputFile, 'utf-8');
  const products = parseCSV(csvContent);

  console.log(`📦 Found ${products.length} products\n`);
  console.log('⏳ Starting download process...\n');
  console.log('='.repeat(50));

  // Process each product
  const results = [];
  for (let i = 0; i < products.length; i++) {
    const result = await processProduct(products[i], i, outputDir);
    results.push(result);

    // Add delay to avoid rate limiting
    if (i < products.length - 1) {
      console.log('\n  ⏱️  Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Summary:');
  const successful = results.filter(r => r.mediaStatus === 'success').length;
  const failed = results.filter(r => r.mediaStatus === 'error').length;
  console.log(`  ✅ Success: ${successful}`);
  console.log(`  ❌ Failed: ${failed}`);

  // Write output CSV
  const originalHeaders = Object.keys(products[0]);
  const newHeaders = [...originalHeaders, 'imageUrls', 'videoUrls', 'imagesCount', 'videosCount', 'mediaStatus'];
  const csvOutput = jsonToCSV(results, newHeaders);

  await fs.writeFile(outputFile, csvOutput, 'utf-8');
  console.log(`\n💾 Output saved to: ${outputFile}`);
  console.log('\n✨ Done!\n');
}

// Run
main().catch(console.error);
