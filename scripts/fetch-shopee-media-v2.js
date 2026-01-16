/**
 * Script to fetch product images and videos from Shopee using their API
 * Works by extracting shop_id and item_id from product URLs
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Parse CSV manually
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].replace(/^\ufeff/, '').split(',');
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
      return value.toString().includes(',') ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// Make HTTPS request
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://shopee.co.th/',
        ...options.headers
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return httpsRequest(response.headers.location, options)
          .then(resolve)
          .catch(reject);
      }

      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

// Download file
async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const fileStream = require('fs').createWriteStream(filepath);

    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }

      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      require('fs').unlink(filepath, () => reject(err));
    });
  });
}

// Extract shop_id and item_id from Shopee URL
function extractShopeeIds(url) {
  // Format: https://shopee.co.th/product/{shop_id}/{item_id}
  const match = url.match(/\/product\/(\d+)\/(\d+)/);
  if (match) {
    return { shop_id: match[1], item_id: match[2] };
  }

  // Try to extract from short URL by checking the URL structure
  const shortMatch = url.match(/https:\/\/s\.shopee\.co\.th\/([A-Za-z0-9]+)/);
  if (shortMatch) {
    return { short_code: shortMatch[1] };
  }

  return null;
}

// Fetch product details from Shopee API
async function fetchProductDetails(shop_id, item_id) {
  const apiUrl = `https://shopee.co.th/api/v4/item/get?itemid=${item_id}&shopid=${shop_id}`;

  try {
    const data = await httpsRequest(apiUrl);

    console.log('  🔍 API Response:', JSON.stringify(data).substring(0, 200));

    if (data.error || !data.data) {
      console.log('  ⚠️  Error code:', data.error, 'Message:', data.error_msg || data.msg);
      throw new Error('Failed to fetch product data');
    }

    return data.data;
  } catch (error) {
    console.error('  ❌ API Error:', error.message);
    return null;
  }
}

// Get full image URL
function getImageUrl(imageHash) {
  return `https://down-th.img.susercontent.com/file/${imageHash}`;
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
    console.log(`  🔗 Link: ${productLink}`);

    const ids = extractShopeeIds(productLink);
    if (!ids || !ids.shop_id || !ids.item_id) {
      console.log('  ⚠️  Could not extract shop_id and item_id from URL');
      return { ...product, mediaStatus: 'invalid-url' };
    }

    console.log(`  📊 Shop ID: ${ids.shop_id}, Item ID: ${ids.item_id}`);
    console.log(`  📥 Fetching from Shopee API...`);

    const productData = await fetchProductDetails(ids.shop_id, ids.item_id);

    if (!productData) {
      console.log('  ❌ Failed to fetch product data');
      return { ...product, mediaStatus: 'api-error' };
    }

    // Extract images
    const images = productData.images || [];
    const video = productData.video_info_list?.[0];

    console.log(`  ✅ Found ${images.length} images${video ? ', 1 video' : ''}`);

    // Create product directory
    const productId = product['รหัสสินค้า'] || product.productId || ids.item_id;
    const productDir = path.join(outputDir, productId.toString());
    await fs.mkdir(productDir, { recursive: true });

    const downloadedImages = [];
    const downloadedVideos = [];

    // Download images
    for (let i = 0; i < images.length; i++) {
      try {
        const imageUrl = getImageUrl(images[i]);
        const filename = `image-${i + 1}.jpg`;
        const filepath = path.join(productDir, filename);

        console.log(`  ⬇️  Downloading image ${i + 1}/${images.length}...`);
        await downloadFile(imageUrl, filepath);

        downloadedImages.push(`/products/${productId}/${filename}`);
      } catch (error) {
        console.log(`  ❌ Failed to download image ${i + 1}: ${error.message}`);
      }
    }

    // Download video if exists
    if (video && video.default_format?.url) {
      try {
        const videoUrl = video.default_format.url;
        const filename = 'video-1.mp4';
        const filepath = path.join(productDir, filename);

        console.log(`  ⬇️  Downloading video...`);
        await downloadFile(videoUrl, filepath);

        downloadedVideos.push(`/products/${productId}/${filename}`);
      } catch (error) {
        console.log(`  ❌ Failed to download video: ${error.message}`);
      }
    }

    return {
      ...product,
      imageUrls: downloadedImages.join('|'),
      videoUrls: downloadedVideos.join('|'),
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
  const inputFile = args[0] || 'public/sample-shopee-import.csv';
  const outputFile = args[1] || 'shopee-products-with-media.csv';

  console.log('🚀 Shopee Media Fetcher v2');
  console.log('===========================\n');
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
  const failed = results.length - successful;
  const totalImages = results.reduce((sum, r) => sum + (r.imagesCount || 0), 0);
  const totalVideos = results.reduce((sum, r) => sum + (r.videosCount || 0), 0);

  console.log(`  ✅ Success: ${successful}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  🖼️  Total Images: ${totalImages}`);
  console.log(`  🎬 Total Videos: ${totalVideos}`);

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
