// State
let apiUrl = 'http://localhost:3000'
let jobs = []
let currentJobIndex = 0
let shopeeData = null

// Elements
const elements = {
  apiUrl: document.getElementById('apiUrl'),
  saveSettings: document.getElementById('saveSettings'),
  connectionStatus: document.getElementById('connectionStatus'),
  pendingCount: document.getElementById('pendingCount'),
  fetchJobs: document.getElementById('fetchJobs'),
  testConnection: document.getElementById('testConnection'),
  currentJobSection: document.getElementById('currentJobSection'),
  jobImage: document.getElementById('jobImage'),
  jobName: document.getElementById('jobName'),
  jobId: document.getElementById('jobId'),
  hook1: document.getElementById('hook1'),
  hook2: document.getElementById('hook2'),
  hook3: document.getElementById('hook3'),
  ending: document.getElementById('ending'),
  caption: document.getElementById('caption'),
  hashtags: document.getElementById('hashtags'),
  copyHooks: document.getElementById('copyHooks'),
  markDone: document.getElementById('markDone'),
  skipJob: document.getElementById('skipJob'),
  jobsList: document.getElementById('jobsList'),
  jobsCount: document.getElementById('jobsCount'),
  openDashboard: document.getElementById('openDashboard'),
  // Shopee elements
  shopeeDataSection: document.getElementById('shopeeDataSection'),
  shopeeImages: document.getElementById('shopeeImages'),
  shopeeProductName: document.getElementById('shopeeProductName'),
  shopeePrice: document.getElementById('shopeePrice'),
  createJobFromShopee: document.getElementById('createJobFromShopee'),
  clearShopeeData: document.getElementById('clearShopeeData'),
}

// Initialize
async function init() {
  // Load saved settings
  const saved = await chrome.storage.local.get(['apiUrl'])
  if (saved.apiUrl) {
    apiUrl = saved.apiUrl
    elements.apiUrl.value = apiUrl
  } else {
    elements.apiUrl.value = apiUrl
  }

  // Load cached jobs
  const cached = await chrome.storage.local.get(['jobs', 'currentJobIndex'])
  if (cached.jobs) {
    jobs = cached.jobs
    currentJobIndex = cached.currentJobIndex || 0
    updateUI()
  }

  // Load Shopee data
  const shopeeStored = await chrome.storage.local.get(['shopeeData'])
  if (shopeeStored.shopeeData) {
    shopeeData = shopeeStored.shopeeData
    updateShopeeUI()
  }

  // Test connection on load
  testConnection()
}

// Update Shopee UI (now supports all platforms)
function updateShopeeUI() {
  if (!shopeeData || !shopeeData.productImages || shopeeData.productImages.length === 0) {
    elements.shopeeDataSection.style.display = 'none'
    return
  }

  elements.shopeeDataSection.style.display = 'block'

  // Show images
  elements.shopeeImages.innerHTML = shopeeData.productImages.map(url => `
    <div class="shopee-image-item">
      <img src="${url}" alt="Product" onerror="this.parentElement.style.display='none'">
    </div>
  `).join('')

  // Show info with Platform and Product ID
  const platform = shopeeData.platform || 'SHOPEE'
  const idText = shopeeData.productId ? `ID: ${shopeeData.productId}` : ''
  elements.shopeeProductName.textContent = `[${platform}] ${shopeeData.productName || 'ไม่มีชื่อสินค้า'}`
  elements.shopeePrice.textContent = `${shopeeData.price || ''} ${idText}`
}

// Save settings
elements.saveSettings.addEventListener('click', async () => {
  apiUrl = elements.apiUrl.value.trim().replace(/\/$/, '')
  await chrome.storage.local.set({ apiUrl })
  alert('บันทึกการตั้งค่าแล้ว!')
  testConnection()
})

// Test connection
elements.testConnection.addEventListener('click', testConnection)

async function testConnection() {
  try {
    elements.testConnection.classList.add('loading')
    const res = await fetch(`${apiUrl}/api/tiktok/jobs?status=PENDING&limit=1`)

    if (res.ok) {
      elements.connectionStatus.textContent = 'เชื่อมต่อแล้ว'
      elements.connectionStatus.className = 'status-badge connected'
    } else {
      throw new Error('Connection failed')
    }
  } catch (error) {
    elements.connectionStatus.textContent = 'ไม่เชื่อมต่อ'
    elements.connectionStatus.className = 'status-badge disconnected'
  } finally {
    elements.testConnection.classList.remove('loading')
  }
}

// Fetch jobs
elements.fetchJobs.addEventListener('click', fetchJobs)

async function fetchJobs() {
  try {
    elements.fetchJobs.classList.add('loading')
    elements.fetchJobs.innerHTML = '<span class="btn-icon">⏳</span> กำลังดึง...'

    const res = await fetch(`${apiUrl}/api/tiktok/jobs?status=PENDING`)

    if (res.ok) {
      jobs = await res.json()
      currentJobIndex = 0

      // Save to storage
      await chrome.storage.local.set({ jobs, currentJobIndex })

      updateUI()

      if (jobs.length > 0) {
        alert(`ดึงงานมาแล้ว ${jobs.length} รายการ`)
      } else {
        alert('ไม่มีงานที่รอดำเนินการ')
      }
    } else {
      throw new Error('Failed to fetch jobs')
    }
  } catch (error) {
    console.error('Fetch error:', error)
    alert('ไม่สามารถดึงงานได้ กรุณาตรวจสอบการเชื่อมต่อ')
  } finally {
    elements.fetchJobs.classList.remove('loading')
    elements.fetchJobs.innerHTML = '<span class="btn-icon">🔄</span> ดึงงานใหม่'
  }
}

// Update UI
function updateUI() {
  // Update pending count
  elements.pendingCount.textContent = jobs.length

  // Update jobs list
  if (jobs.length === 0) {
    elements.jobsList.innerHTML = '<p class="empty-state">ยังไม่มีงาน</p>'
    elements.currentJobSection.style.display = 'none'
    elements.jobsCount.textContent = '(0)'
    return
  }

  elements.jobsCount.textContent = `(${jobs.length})`

  // Render jobs list
  elements.jobsList.innerHTML = jobs.map((job, index) => `
    <div class="jobs-list-item ${index === currentJobIndex ? 'active' : ''}" data-index="${index}">
      <div class="jobs-list-item-image">
        ${job.productImage ? `<img src="${job.productImage}" alt="">` : ''}
      </div>
      <div class="jobs-list-item-info">
        <p class="jobs-list-item-name">${job.productName || job.productid}</p>
      </div>
      <span class="jobs-list-item-status">${job.status}</span>
    </div>
  `).join('')

  // Add click handlers to list items
  document.querySelectorAll('.jobs-list-item').forEach(item => {
    item.addEventListener('click', () => {
      currentJobIndex = parseInt(item.dataset.index)
      chrome.storage.local.set({ currentJobIndex })
      updateUI()
    })
  })

  // Update current job
  const currentJob = jobs[currentJobIndex]
  if (currentJob) {
    elements.currentJobSection.style.display = 'block'
    elements.jobImage.src = currentJob.productImage || ''
    elements.jobName.textContent = currentJob.productName || 'ไม่มีชื่อ'
    elements.jobId.textContent = `ID: ${currentJob.productid || currentJob.id}`
    elements.hook1.textContent = currentJob.hooking || '-'
    elements.hook2.textContent = currentJob.hook2 || '-'
    elements.hook3.textContent = currentJob.hook3 || '-'
    elements.ending.textContent = currentJob.ending || '-'
    elements.caption.textContent = currentJob.caption || '-'
    // Display hashtags
    if (currentJob.hashtags && currentJob.hashtags.length > 0) {
      elements.hashtags.textContent = currentJob.hashtags.join(' ')
    } else {
      elements.hashtags.textContent = '-'
    }
  }
}

// Copy hooks to clipboard
elements.copyHooks.addEventListener('click', () => {
  const currentJob = jobs[currentJobIndex]
  if (!currentJob) return

  const hashtagsText = currentJob.hashtags && currentJob.hashtags.length > 0
    ? currentJob.hashtags.join(' ')
    : '-'

  const hooksText = `Hook 1: ${currentJob.hooking || '-'}

Hook 2: ${currentJob.hook2 || '-'}

Hook 3: ${currentJob.hook3 || '-'}

Ending: ${currentJob.ending || '-'}

Caption: ${currentJob.caption || '-'}

Hashtags: ${hashtagsText}`

  navigator.clipboard.writeText(hooksText)
  alert('คัดลอก Hooks + Hashtags แล้ว!')
})

// Mark job as done
elements.markDone.addEventListener('click', async () => {
  const currentJob = jobs[currentJobIndex]
  if (!currentJob) return

  try {
    elements.markDone.classList.add('loading')

    const res = await fetch(`${apiUrl}/api/tiktok/jobs/done`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: currentJob.id })
    })

    if (res.ok) {
      // Remove from local list
      jobs.splice(currentJobIndex, 1)
      if (currentJobIndex >= jobs.length) {
        currentJobIndex = Math.max(0, jobs.length - 1)
      }

      await chrome.storage.local.set({ jobs, currentJobIndex })
      updateUI()

      alert('เสร็จสิ้น! งานถูกย้ายไปยัง DONE แล้ว')
    } else {
      throw new Error('Failed to mark as done')
    }
  } catch (error) {
    console.error('Mark done error:', error)
    alert('ไม่สามารถอัพเดทสถานะได้')
  } finally {
    elements.markDone.classList.remove('loading')
  }
})

// Skip job
elements.skipJob.addEventListener('click', async () => {
  if (jobs.length <= 1) {
    alert('ไม่มีงานอื่นแล้ว')
    return
  }

  currentJobIndex = (currentJobIndex + 1) % jobs.length
  await chrome.storage.local.set({ currentJobIndex })
  updateUI()
})

// Open dashboard
elements.openDashboard.addEventListener('click', (e) => {
  e.preventDefault()
  chrome.tabs.create({ url: `${apiUrl}/admin/tiktok` })
})

// Create job from Shopee data
elements.createJobFromShopee.addEventListener('click', async () => {
  if (!shopeeData) return

  try {
    elements.createJobFromShopee.classList.add('loading')
    elements.createJobFromShopee.innerHTML = '<span class="btn-icon">⏳</span> กำลังสร้าง...'

    // First generate hooks using AI
    let hooks = {}
    try {
      const hooksRes = await fetch(`${apiUrl}/api/tiktok/generate-hooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: shopeeData.productName }),
      })
      if (hooksRes.ok) {
        hooks = await hooksRes.json()
      }
    } catch (e) {
      console.log('Could not generate hooks:', e)
    }

    // Create job with Shopee data - use real Product ID and ALL images
    const jobData = {
      productId: shopeeData.productId || `SHOPEE-${Date.now()}`,
      productName: shopeeData.productName,
      productImage: shopeeData.productImages[0], // Main image
      productImages: shopeeData.productImages, // ALL images for slideshow
      hooking: hooks.hook1 || '',
      hook2: hooks.hook2 || '',
      hook3: hooks.hook3 || '',
      ending: hooks.ending || '',
      caption: hooks.caption || '',
      hashtags: hooks.hashtags || [],
    }

    const res = await fetch(`${apiUrl}/api/tiktok/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData),
    })

    if (res.ok) {
      alert(`สร้าง Job สำเร็จ!\n\nชื่อสินค้า: ${shopeeData.productName}\nรูปภาพ: ${shopeeData.productImages.length} รูป`)

      // Clear Shopee data
      await chrome.storage.local.remove('shopeeData')
      shopeeData = null
      updateShopeeUI()

      // Refresh jobs
      fetchJobs()
    } else {
      const error = await res.json()
      alert(`ไม่สามารถสร้าง Job ได้: ${error.error || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('Create job error:', error)
    alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
  } finally {
    elements.createJobFromShopee.classList.remove('loading')
    elements.createJobFromShopee.innerHTML = '<span class="btn-icon">➕</span> สร้าง Job จากรูปนี้'
  }
})

// Clear Shopee data
elements.clearShopeeData.addEventListener('click', async () => {
  await chrome.storage.local.remove('shopeeData')
  shopeeData = null
  updateShopeeUI()
})

// Initialize
init()
