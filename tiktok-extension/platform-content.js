// Multi-Platform Product Extractor
// Supports: Shopee, Lazada, Amazon, TikTok Shop

console.log('[Affiliate Bot] Content script loaded on:', window.location.href)

// Detect current platform
function detectPlatform() {
  const host = window.location.hostname
  if (host.includes('shopee')) return 'SHOPEE'
  if (host.includes('lazada')) return 'LAZADA'
  if (host.includes('amazon')) return 'AMAZON'
  if (host.includes('tiktok')) return 'TIKTOK'
  return 'OTHER'
}

const PLATFORM = detectPlatform()
console.log('[Affiliate Bot] Platform:', PLATFORM)

// Platform-specific colors
const PLATFORM_COLORS = {
  SHOPEE: { primary: '#ee4d2d', secondary: '#ff6b6b' },
  LAZADA: { primary: '#0f146d', secondary: '#f57224' },
  AMAZON: { primary: '#ff9900', secondary: '#232f3e' },
  TIKTOK: { primary: '#000000', secondary: '#fe2c55' },
  OTHER: { primary: '#6366f1', secondary: '#8b5cf6' }
}

// Extract product data based on platform
function extractProductData() {
  console.log(`[Affiliate Bot] Extracting data from ${PLATFORM}...`)

  const data = {
    productId: '',
    shopId: '',
    platform: PLATFORM,
    productName: '',
    productImages: [],
    price: '',
    url: window.location.href
  }

  switch (PLATFORM) {
    case 'SHOPEE':
      extractShopeeData(data)
      break
    case 'LAZADA':
      extractLazadaData(data)
      break
    case 'AMAZON':
      extractAmazonData(data)
      break
    case 'TIKTOK':
      extractTikTokData(data)
      break
    default:
      extractGenericData(data)
  }

  // Fallback for images - get all visible large images
  if (data.productImages.length === 0) {
    document.querySelectorAll('img').forEach(img => {
      const src = img.src
      if (src && src.startsWith('http')) {
        const rect = img.getBoundingClientRect()
        if (rect.width > 80 && rect.height > 80) {
          data.productImages.push(src)
        }
      }
    })
    data.productImages = [...new Set(data.productImages)].slice(0, 10)
  }

  console.log('[Affiliate Bot] Extracted:', data)
  return { success: true, data }
}

// ============ SHOPEE ============
function extractShopeeData(data) {
  // Product ID from URL: xxx-i.{shop_id}.{item_id}
  const urlMatch = window.location.pathname.match(/-i\.(\d+)\.(\d+)/)
  if (urlMatch) {
    data.shopId = urlMatch[1]
    data.productId = urlMatch[2]
  }

  // Product name from title
  data.productName = document.title.split('|')[0].split(' - Shopee')[0].trim()

  // Price
  const priceMatch = document.body.innerText.match(/฿[\d,\.]+/)
  if (priceMatch) data.price = priceMatch[0]

  // Images
  document.querySelectorAll('img').forEach(img => {
    const src = img.src || ''
    if (src.includes('susercontent.com') || src.includes('shopee')) {
      const rect = img.getBoundingClientRect()
      if (rect.width > 50 && rect.height > 50) {
        const highRes = src.replace(/_tn\./, '.').replace(/\/thumb\//, '/')
        if (!highRes.includes('icon') && !highRes.includes('logo') && !highRes.includes('avatar')) {
          data.productImages.push(highRes)
        }
      }
    }
  })
  data.productImages = [...new Set(data.productImages)].slice(0, 15)
}

// ============ LAZADA ============
function extractLazadaData(data) {
  // Product ID from URL: /products/xxx-i{item_id}-s{sku_id}.html
  const urlMatch = window.location.pathname.match(/-i(\d+)(-s\d+)?\.html/)
  if (urlMatch) {
    data.productId = urlMatch[1]
  }

  // Also try from URL params
  if (!data.productId) {
    const urlParams = new URLSearchParams(window.location.search)
    data.productId = urlParams.get('itemId') || urlParams.get('id') || ''
  }

  // Product name
  const titleEl = document.querySelector('h1') || document.querySelector('[class*="title"]')
  data.productName = titleEl?.textContent?.trim() || document.title.split('|')[0].split('-')[0].trim()

  // Price
  const priceEl = document.querySelector('[class*="price"]')
  if (priceEl) {
    const priceMatch = priceEl.textContent.match(/฿?[\d,\.]+/)
    if (priceMatch) data.price = '฿' + priceMatch[0].replace('฿', '')
  }

  // Images from Lazada CDN
  document.querySelectorAll('img').forEach(img => {
    const src = img.src || img.getAttribute('data-src') || ''
    if (src.includes('lazcdn') || src.includes('lzd') || src.includes('lazada')) {
      const rect = img.getBoundingClientRect()
      if (rect.width > 50 && rect.height > 50) {
        // Get higher resolution
        let highRes = src.replace(/_\d+x\d+/, '').replace(/\/thumb\//, '/')
        if (!highRes.includes('icon') && !highRes.includes('logo')) {
          data.productImages.push(highRes)
        }
      }
    }
  })
  data.productImages = [...new Set(data.productImages)].slice(0, 15)
}

// ============ AMAZON ============
function extractAmazonData(data) {
  // Product ID (ASIN) from URL: /dp/{ASIN}/ or /gp/product/{ASIN}/
  const asinMatch = window.location.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/)
  if (asinMatch) {
    data.productId = asinMatch[1]
  }

  // Product name
  const titleEl = document.querySelector('#productTitle') || document.querySelector('h1')
  data.productName = titleEl?.textContent?.trim() || ''

  // Price
  const priceEl = document.querySelector('.a-price .a-offscreen') || document.querySelector('#priceblock_ourprice')
  if (priceEl) {
    data.price = priceEl.textContent.trim()
  }

  // Images
  document.querySelectorAll('img').forEach(img => {
    const src = img.src || ''
    if (src.includes('images-amazon') || src.includes('m.media-amazon')) {
      // Get high resolution version
      let highRes = src.replace(/\._.*_\./, '.')
      if (highRes.includes('/I/')) {
        data.productImages.push(highRes)
      }
    }
  })

  // Also check for image gallery data
  const imageData = document.querySelector('#imageBlock script')
  if (imageData) {
    const matches = imageData.textContent.matchAll(/"hiRes":"([^"]+)"/g)
    for (const match of matches) {
      data.productImages.push(match[1])
    }
  }

  data.productImages = [...new Set(data.productImages)].slice(0, 15)
}

// ============ TIKTOK SHOP ============
function extractTikTokData(data) {
  // Product ID from URL
  const urlMatch = window.location.pathname.match(/\/product\/(\d+)/)
  if (urlMatch) {
    data.productId = urlMatch[1]
  }

  // Product name
  const titleEl = document.querySelector('h1') || document.querySelector('[class*="title"]')
  data.productName = titleEl?.textContent?.trim() || document.title.split('|')[0].trim()

  // Price
  const priceEl = document.querySelector('[class*="price"]')
  if (priceEl) {
    data.price = priceEl.textContent.trim()
  }

  // Images
  document.querySelectorAll('img').forEach(img => {
    const src = img.src || ''
    if (src.includes('tiktok') || src.includes('bytedance')) {
      const rect = img.getBoundingClientRect()
      if (rect.width > 50 && rect.height > 50) {
        data.productImages.push(src)
      }
    }
  })
  data.productImages = [...new Set(data.productImages)].slice(0, 15)
}

// ============ GENERIC ============
function extractGenericData(data) {
  // Try meta tags
  const ogTitle = document.querySelector('meta[property="og:title"]')
  const ogImage = document.querySelector('meta[property="og:image"]')

  data.productName = ogTitle?.content || document.title
  if (ogImage?.content) {
    data.productImages.push(ogImage.content)
  }

  // Product ID from URL
  const idMatch = window.location.pathname.match(/\/(\d+)/)
  if (idMatch) {
    data.productId = idMatch[1]
  }
}

// ============ UI ============
function addCaptureButton() {
  if (document.getElementById('affiliate-capture-btn')) return

  const colors = PLATFORM_COLORS[PLATFORM]
  const btn = document.createElement('button')
  btn.id = 'affiliate-capture-btn'
  btn.innerHTML = `📸 จับรูป ${PLATFORM}`
  btn.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    z-index: 999999;
    padding: 15px 20px;
    background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    font-family: sans-serif;
    transition: transform 0.2s, box-shadow 0.2s;
  `

  btn.onmouseover = () => {
    btn.style.transform = 'scale(1.05)'
    btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)'
  }
  btn.onmouseout = () => {
    btn.style.transform = 'scale(1)'
    btn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)'
  }

  btn.onclick = () => {
    btn.innerHTML = '⏳ กำลังดึงรูป...'
    setTimeout(() => {
      const result = extractProductData()
      if (result.data.productImages.length > 0) {
        showImagePicker(result.data)
      } else {
        alert('ไม่พบรูปภาพ\n\nลองเลื่อนหน้าให้รูปโหลดก่อน แล้วกดใหม่')
      }
      btn.innerHTML = `📸 จับรูป ${PLATFORM}`
    }, 500)
  }

  document.body.appendChild(btn)
  console.log('[Affiliate Bot] Button added!')
}

function showImagePicker(data) {
  const old = document.getElementById('affiliate-modal')
  if (old) old.remove()

  const colors = PLATFORM_COLORS[PLATFORM]

  const modal = document.createElement('div')
  modal.id = 'affiliate-modal'
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.8);
    z-index: 9999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: sans-serif;
  `

  const content = document.createElement('div')
  content.style.cssText = `
    background: white;
    border-radius: 15px;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `

  content.innerHTML = `
    <div style="padding: 20px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); color: white;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2 style="margin: 0; font-size: 18px;">📸 รูปจาก ${PLATFORM} (${data.productImages.length} รูป)</h2>
        <button id="close-modal" style="border: none; background: rgba(255,255,255,0.2); color: white; width: 30px; height: 30px; border-radius: 50%; font-size: 18px; cursor: pointer;">&times;</button>
      </div>
    </div>
    <div style="padding: 15px; background: #f5f5f5; border-bottom: 1px solid #eee;">
      <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
        🏷️ <b>Product ID:</b> ${data.productId || 'N/A'} ${data.shopId ? `| Shop: ${data.shopId}` : ''}
      </div>
      <strong style="font-size: 14px;">${data.productName || 'ไม่มีชื่อ'}</strong><br>
      <span style="color: ${colors.primary}; font-weight: bold; font-size: 16px;">${data.price || ''}</span>
    </div>
    <div style="padding: 15px; overflow-y: auto; flex: 1;">
      <p style="font-size: 12px; color: #666; margin-bottom: 10px;">คลิกเลือกรูปที่ต้องการ (เลือกได้หลายรูป)</p>
      <div id="image-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
        ${data.productImages.map((url, i) => `
          <div class="img-select" data-url="${url}" style="
            border: 3px solid ${i === 0 ? colors.primary : '#ddd'};
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            aspect-ratio: 1;
            position: relative;
          ">
            <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.style.display='none'">
            <div class="check-mark" style="
              position: absolute;
              top: 5px;
              right: 5px;
              width: 24px;
              height: 24px;
              background: ${i === 0 ? colors.primary : 'rgba(255,255,255,0.8)'};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
            ">${i === 0 ? '✓' : ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div style="padding: 15px; border-top: 1px solid #eee; display: flex; flex-direction: column; gap: 10px;">
      <div style="display: flex; gap: 10px;">
        <button id="copy-link-btn" style="flex: 1; padding: 12px; border: 2px solid ${colors.primary}; background: white; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; color: ${colors.primary};">🔗 Copy Link</button>
        <button id="copy-btn" style="flex: 1; padding: 12px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer; font-size: 14px;">📋 Copy รูป</button>
      </div>
      <button id="send-btn" style="width: 100%; padding: 12px; border: none; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); color: white; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px;">📤 ส่งไป Dashboard</button>
    </div>
  `

  modal.appendChild(content)
  document.body.appendChild(modal)

  // Track selected images
  let selected = new Set([data.productImages[0]])

  // Image click handler
  content.querySelectorAll('.img-select').forEach(div => {
    div.onclick = () => {
      const url = div.dataset.url
      const checkMark = div.querySelector('.check-mark')
      if (selected.has(url)) {
        selected.delete(url)
        div.style.borderColor = '#ddd'
        checkMark.style.background = 'rgba(255,255,255,0.8)'
        checkMark.textContent = ''
      } else {
        selected.add(url)
        div.style.borderColor = colors.primary
        checkMark.style.background = colors.primary
        checkMark.textContent = '✓'
      }
    }
  })

  // Close
  modal.querySelector('#close-modal').onclick = () => modal.remove()
  modal.onclick = (e) => { if (e.target === modal) modal.remove() }

  // Copy Affiliate Link
  modal.querySelector('#copy-link-btn').onclick = () => {
    let affiliateLink = data.url

    // Generate proper affiliate links based on platform
    if (PLATFORM === 'SHOPEE' && data.productId) {
      // Shopee affiliate link format
      affiliateLink = `https://shopee.co.th/product/${data.shopId || ''}/${data.productId}`
    } else if (PLATFORM === 'LAZADA' && data.productId) {
      // Lazada affiliate link format
      affiliateLink = `https://www.lazada.co.th/products/-i${data.productId}.html`
    } else if (PLATFORM === 'AMAZON' && data.productId) {
      // Amazon affiliate link format
      affiliateLink = `https://www.amazon.com/dp/${data.productId}`
    } else if (PLATFORM === 'TIKTOK' && data.productId) {
      // TikTok Shop link format
      affiliateLink = `https://shop.tiktok.com/product/${data.productId}`
    }

    navigator.clipboard.writeText(affiliateLink)

    // Show copied feedback
    const btn = modal.querySelector('#copy-link-btn')
    const originalText = btn.innerHTML
    btn.innerHTML = '✅ Copied!'
    btn.style.background = colors.primary
    btn.style.color = 'white'
    setTimeout(() => {
      btn.innerHTML = originalText
      btn.style.background = 'white'
      btn.style.color = colors.primary
    }, 2000)
  }

  // Copy Image URLs
  modal.querySelector('#copy-btn').onclick = () => {
    const urls = selected.size > 0 ? Array.from(selected) : data.productImages
    navigator.clipboard.writeText(urls.join('\n'))

    // Show copied feedback
    const btn = modal.querySelector('#copy-btn')
    const originalText = btn.innerHTML
    btn.innerHTML = '✅ Copied!'
    setTimeout(() => {
      btn.innerHTML = originalText
    }, 2000)
  }

  // Send to dashboard
  modal.querySelector('#send-btn').onclick = () => {
    const images = selected.size > 0 ? Array.from(selected) : [data.productImages[0]]

    chrome.storage.local.set({
      shopeeData: {
        productId: data.productId,
        shopId: data.shopId,
        platform: PLATFORM,
        productName: data.productName,
        productImages: images,
        price: data.price,
        url: data.url
      }
    }, () => {
      alert(`✅ บันทึกแล้ว!\n\n🛒 Platform: ${PLATFORM}\n🏷️ Product ID: ${data.productId || 'N/A'}\n📦 ${data.productName}\n🖼️ รูป: ${images.length} รูป\n\nเปิด Extension popup เพื่อสร้าง Job`)
      modal.remove()
    })
  }
}

// Initialize
function init() {
  addCaptureButton()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

setTimeout(init, 2000)
setTimeout(init, 5000)

// Watch for URL changes (SPA)
let lastUrl = location.href
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    setTimeout(init, 1000)
  }
}, 1000)

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractProductData') {
    sendResponse(extractProductData())
  }
  return true
})
