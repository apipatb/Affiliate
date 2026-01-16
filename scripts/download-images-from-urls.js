/**
 * Script to download images from URLs and update CSV
 * Usage:
 * 1. Create a text file with image URLs (one per line) for each product
 * 2. Run: node scripts/download-images-from-urls.js input.csv output.csv
 *
 * CSV Format:
 * - Must have รหัสสินค้า or productId column
 * - Can have imageUrls column with pipe-separated URLs
 * - Or add imageUrls column with format: url1|url2|url3
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const readline = require('readline');

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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

// Ask user for image URLs for a product
async function promptForUrls(productName, productId) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 สินค้า: ${productName}`);
  console.log(`🆔 ID: ${productId}`);
  console.log(`${'='.repeat(60)}`);
  console.log('\nใส่ลิงก์รูปภาพ (ทีละบรรทัด, เสร็จแล้วพิมพ์ "done" หรือกด Enter บรรทัดว่าง):');
  console.log('หรือพิมพ์ "skip" เพื่อข้าม\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    const urls = [];

    rl.on('line', (line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.toLowerCase() === 'done') {
        rl.close();
        resolve(urls);
      } else if (trimmed.toLowerCase() === 'skip') {
        rl.close();
        resolve([]);
      } else if (trimmed.startsWith('http') || trimmed.startsWith('//')) {
        urls.push(trimmed.startsWith('//') ? 'https:' + trimmed : trimmed);
        console.log(`  ✓ เพิ่มแล้ว (${urls.length})`);
      } else {
        console.log(`  ⚠️  ลิงก์ไม่ถูกต้อง: ${trimmed}`);
      }
    });
  });
}

// Process product
async function processProduct(product, index, outputDir, interactive) {
  const productId = product['รหัสสินค้า'] || product.productId || `product-${index}`;
  const productName = product['ชื่อสินค้า'] || product.title || 'Unnamed';

  console.log(`\n[${index + 1}] ${productName}`);

  // Check if already has imageUrls
  let imageUrls = product.imageUrls || product['imageUrls'] || '';

  if (imageUrls) {
    console.log(`  ℹ️  มีลิงก์รูปอยู่แล้ว: ${imageUrls.split('|').length} รูป`);
  }

  // If interactive and no URLs, prompt user
  if (interactive && !imageUrls) {
    const urls = await promptForUrls(productName, productId);
    if (urls.length === 0) {
      console.log('  ⊝ ข้าม');
      return { ...product, downloadStatus: 'skipped' };
    }
    imageUrls = urls.join('|');
  }

  if (!imageUrls) {
    console.log('  ⚠️  ไม่มีลิงก์รูป');
    return { ...product, downloadStatus: 'no-urls' };
  }

  // Download images
  const urls = imageUrls.split('|').map(u => u.trim()).filter(u => u);
  const productDir = path.join(outputDir, productId.toString());
  await fs.mkdir(productDir, { recursive: true });

  const downloadedPaths = [];

  for (let i = 0; i < urls.length; i++) {
    try {
      const url = urls[i];
      const ext = path.extname(new URL(url).pathname) || '.jpg';
      const filename = `image-${i + 1}${ext}`;
      const filepath = path.join(productDir, filename);

      console.log(`  ⬇️  [${i + 1}/${urls.length}] Downloading...`);
      await downloadFile(url, filepath);

      downloadedPaths.push(`/products/${productId}/${filename}`);
      console.log(`  ✅ Saved: ${filename}`);
    } catch (error) {
      console.log(`  ❌ Failed [${i + 1}]: ${error.message}`);
    }
  }

  if (downloadedPaths.length > 0) {
    return {
      ...product,
      imageUrls: imageUrls,
      downloadedImages: downloadedPaths.join('|'),
      imagesCount: downloadedPaths.length,
      downloadStatus: 'success'
    };
  } else {
    return {
      ...product,
      downloadStatus: 'failed'
    };
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🖼️  Shopee Image Downloader
============================

Usage:
  node scripts/download-images-from-urls.js <input.csv> [output.csv] [--interactive]

Options:
  --interactive, -i    Ask for image URLs for each product

Examples:
  # Download images from existing imageUrls in CSV
  node scripts/download-images-from-urls.js products.csv output.csv

  # Interactive mode - manually enter URLs for each product
  node scripts/download-images-from-urls.js products.csv output.csv --interactive

CSV Format:
  - Must have รหัสสินค้า or productId column
  - Can have imageUrls column with pipe-separated URLs (url1|url2|url3)
    `);
    process.exit(0);
  }

  const inputFile = args[0];
  const outputFile = args[1] || 'products-with-images.csv';
  const interactive = args.includes('--interactive') || args.includes('-i');

  console.log('🖼️  Shopee Image Downloader');
  console.log('============================\n');
  console.log(`📄 Input:  ${inputFile}`);
  console.log(`💾 Output: ${outputFile}`);
  console.log(`🎮 Mode:   ${interactive ? 'Interactive' : 'Automatic'}\n`);

  // Create output directory
  const outputDir = path.join(process.cwd(), 'public', 'products');
  await fs.mkdir(outputDir, { recursive: true });
  console.log(`📁 Images: ${outputDir}\n`);

  // Read CSV
  const csvContent = await fs.readFile(inputFile, 'utf-8');
  const products = parseCSV(csvContent);

  console.log(`📦 Products: ${products.length}\n`);
  console.log('='.repeat(60));

  // Process products
  const results = [];
  for (let i = 0; i < products.length; i++) {
    const result = await processProduct(products[i], i, outputDir, interactive);
    results.push(result);

    // Delay between products
    if (i < products.length - 1 && !interactive) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  const success = results.filter(r => r.downloadStatus === 'success').length;
  const failed = results.filter(r => r.downloadStatus === 'failed').length;
  const skipped = results.filter(r => r.downloadStatus === 'skipped').length;
  const noUrls = results.filter(r => r.downloadStatus === 'no-urls').length;
  const totalImages = results.reduce((sum, r) => sum + (r.imagesCount || 0), 0);

  console.log(`  ✅ Success:  ${success}`);
  console.log(`  ❌ Failed:   ${failed}`);
  console.log(`  ⊝ Skipped:  ${skipped}`);
  console.log(`  ⚠️  No URLs:  ${noUrls}`);
  console.log(`  🖼️  Total:    ${totalImages} images`);

  // Write CSV
  const originalHeaders = Object.keys(products[0]);
  const newHeaders = [
    ...originalHeaders,
    'downloadedImages',
    'imagesCount',
    'downloadStatus'
  ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

  const csvOutput = jsonToCSV(results, newHeaders);
  await fs.writeFile(outputFile, csvOutput, 'utf-8');

  console.log(`\n💾 Saved: ${outputFile}`);
  console.log('\n✨ Done!\n');
}

main().catch(console.error);
