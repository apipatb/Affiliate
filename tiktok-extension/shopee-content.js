// Shopee Product Image Extractor
// This content script runs on Shopee product pages

console.log('[TikTok Bot] Shopee content script loaded on:', window.location.href)

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[TikTok Bot] Received message:', request)
  if (request.action === 'extractShopeeImages') {
    const result = extractProductData()
    sendResponse(result)
  }
  return true
})

// Simple and reliable image extraction
function extractProductData() {
  console.log('[TikTok Bot] Starting extraction...')

  const data = {
    productName: '',
    productImages: [],
    price: '',
    url: window.location.href,
    productId: '',
    platform: 'SHOPEE'
  }

  // Extract Shopee Product ID from URL
  // URL format: https://shopee.co.th/product-name-i.{shop_id}.{item_id}
  const urlMatch = window.location.pathname.match(/-i\.(\d+)\.(\d+)/)
  if (urlMatch) {
    const shopId = urlMatch[1]
    const itemId = urlMatch[2]
    data.productId = itemId // ใช้แค่ Item ID (Product ID จริงของ Shopee)
    data.shopId = shopId
    console.log('[TikTok Bot] Shopee Product ID:', itemId, 'Shop ID:', shopId)
  } else {
    // Fallback: use timestamp
    data.productId = `SHOPEE-${Date.now()}`
  }

  // Get product name from page title
  data.productName = document.title.split('|')[0].split(' - Shopee')[0].trim()
  console.log('[TikTok Bot] Product name:', data.productName)

  // Find ALL images and filter
  const allImgSrcs = []

  document.querySelectorAll('img').forEach(img => {
    const src = img.src || ''
    const dataSrc = img.getAttribute('data-src') || ''
    const url = src || dataSrc

    if (url && url.startsWith('http')) {
      // Check size - only get reasonably sized images
      const rect = img.getBoundingClientRect()
      const isVisible = rect.width > 50 && rect.height > 50

      // Check if it's likely a product image (not icon/logo)
      const isLikelyProduct = !url.includes('icon') &&
                             !url.includes('logo') &&
                             !url.includes('avatar') &&
                             !url.includes('rating') &&
                             !url.includes('_16_') && // small icons
                             !url.includes('_24_') &&
                             !url.includes('_32_')

      if (isVisible && isLikelyProduct) {
        // Try to get higher resolution
        let highRes = url.replace(/_tn\./, '.').replace(/\/thumb\//, '/')
        allImgSrcs.push(highRes)
      }
    }
  })

  // Remove duplicates
  data.productImages = [...new Set(allImgSrcs)].slice(0, 15)
  console.log('[TikTok Bot] Found images:', data.productImages.length, data.productImages)

  // Get price
  const priceMatch = document.body.innerText.match(/฿[\d,\.]+/)
  if (priceMatch) {
    data.price = priceMatch[0]
  }

  return { success: true, data }
}

// Create and add the capture button
function addCaptureButton() {
  if (document.getElementById('tiktok-capture-btn')) return

  console.log('[TikTok Bot] Adding capture button...')

  const btn = document.createElement('button')
  btn.id = 'tiktok-capture-btn'
  btn.innerHTML = '📸 จับรูป Shopee'
  btn.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    z-index: 999999;
    padding: 15px 20px;
    background: #ee4d2d;
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    font-family: sans-serif;
  `

  btn.onclick = () => {
    console.log('[TikTok Bot] Button clicked!')
    btn.innerHTML = '⏳ กำลังดึงรูป...'

    setTimeout(() => {
      const result = extractProductData()

      if (result.data.productImages.length > 0) {
        showImagePicker(result.data)
      } else {
        alert('ไม่พบรูปภาพ\n\nลองเลื่อนหน้าให้รูปโหลดก่อน แล้วกดใหม่')
      }

      btn.innerHTML = '📸 จับรูป Shopee'
    }, 500)
  }

  document.body.appendChild(btn)
  console.log('[TikTok Bot] Button added!')
}

// Show image picker modal
function showImagePicker(data) {
  // Remove old modal
  const old = document.getElementById('tiktok-modal')
  if (old) old.remove()

  const modal = document.createElement('div')
  modal.id = 'tiktok-modal'
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
    <div style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
      <h2 style="margin: 0; font-size: 18px;">📸 รูปจาก Shopee (${data.productImages.length} รูป)</h2>
      <button id="close-modal" style="border: none; background: none; font-size: 24px; cursor: pointer;">&times;</button>
    </div>
    <div style="padding: 15px; background: #f5f5f5;">
      <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
        🛒 <b>Product ID:</b> ${data.productId} ${data.shopId ? `| Shop: ${data.shopId}` : ''}
      </div>
      <strong>${data.productName}</strong><br>
      <span style="color: #ee4d2d; font-weight: bold;">${data.price}</span>
    </div>
    <div style="padding: 15px; overflow-y: auto; flex: 1;">
      <div id="image-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
        ${data.productImages.map((url, i) => `
          <div class="img-select" data-url="${url}" style="
            border: 3px solid ${i === 0 ? '#ee4d2d' : '#ddd'};
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            aspect-ratio: 1;
          ">
            <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;"
                 onerror="this.parentElement.style.display='none'">
          </div>
        `).join('')}
      </div>
    </div>
    <div style="padding: 15px; border-top: 1px solid #eee; display: flex; gap: 10px;">
      <button id="copy-btn" style="flex: 1; padding: 12px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer;">📋 คัดลอก URL</button>
      <button id="send-btn" style="flex: 1; padding: 12px; border: none; background: #ee4d2d; color: white; border-radius: 8px; cursor: pointer; font-weight: bold;">📤 ส่งไป Dashboard</button>
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
      if (selected.has(url)) {
        selected.delete(url)
        div.style.borderColor = '#ddd'
      } else {
        selected.add(url)
        div.style.borderColor = '#ee4d2d'
      }
    }
  })

  // Close
  modal.querySelector('#close-modal').onclick = () => modal.remove()
  modal.onclick = (e) => { if (e.target === modal) modal.remove() }

  // Copy
  modal.querySelector('#copy-btn').onclick = () => {
    const urls = selected.size > 0 ? Array.from(selected) : data.productImages
    navigator.clipboard.writeText(urls.join('\n'))
    alert(`คัดลอก ${urls.length} URLs แล้ว!`)
  }

  // Send to dashboard
  modal.querySelector('#send-btn').onclick = () => {
    const images = selected.size > 0 ? Array.from(selected) : [data.productImages[0]]

    chrome.storage.local.set({
      shopeeData: {
        productId: data.productId,
        shopId: data.shopId,
        platform: 'SHOPEE',
        productName: data.productName,
        productImages: images,
        price: data.price,
        url: data.url
      }
    }, () => {
      alert(`✅ บันทึกแล้ว!\n\nProduct ID: ${data.productId}\nShop ID: ${data.shopId || '-'}\n${data.productName}\nรูป: ${images.length} รูป\n\nเปิด Extension popup เพื่อสร้าง Job`)
      modal.remove()
    })
  }
}

// Initialize - add button when page loads
function init() {
  console.log('[TikTok Bot] Initializing...')
  addCaptureButton()
}

// Run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

// Also try again after a delay (for SPA navigation)
setTimeout(init, 2000)
setTimeout(init, 5000)

// Watch for URL changes (Shopee is SPA)
let lastUrl = location.href
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    console.log('[TikTok Bot] URL changed, re-adding button...')
    setTimeout(init, 1000)
  }
}, 1000)
