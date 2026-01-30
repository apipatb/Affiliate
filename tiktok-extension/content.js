// Content script for TikTok pages

// Listen for messages from background/popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'copyToClipboard':
      navigator.clipboard.writeText(request.text)
        .then(() => {
          showNotification('คัดลอกแล้ว!')
          sendResponse({ success: true })
        })
        .catch(err => {
          console.error('Copy failed:', err)
          sendResponse({ success: false })
        })
      return true

    case 'getCurrentJob':
      chrome.runtime.sendMessage({ action: 'getCurrentJob' }, sendResponse)
      return true

    case 'insertHooks':
      insertHooksIntoPage(request.hooks)
      sendResponse({ success: true })
      break

    case 'showFloatingPanel':
      showFloatingPanel()
      sendResponse({ success: true })
      break
  }
})

// Show notification toast
function showNotification(message) {
  const toast = document.createElement('div')
  toast.className = 'tiktok-auto-sales-toast'
  toast.textContent = message

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.classList.add('show')
  }, 10)

  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 300)
  }, 2000)
}

// Create and show floating panel
let floatingPanel = null

function showFloatingPanel() {
  if (floatingPanel) {
    floatingPanel.classList.toggle('hidden')
    return
  }

  floatingPanel = document.createElement('div')
  floatingPanel.className = 'tiktok-auto-sales-panel'
  floatingPanel.innerHTML = `
    <div class="panel-header">
      <span>TikTok Auto Sales</span>
      <button class="panel-close">&times;</button>
    </div>
    <div class="panel-content">
      <div class="panel-loading">กำลังโหลด...</div>
    </div>
    <div class="panel-actions">
      <button class="panel-btn panel-btn-copy">📋 คัดลอก Hooks</button>
      <button class="panel-btn panel-btn-done">✅ เสร็จสิ้น</button>
      <button class="panel-btn panel-btn-skip">⏭️ ข้าม</button>
    </div>
  `

  document.body.appendChild(floatingPanel)

  // Make draggable
  makeDraggable(floatingPanel)

  // Event handlers
  floatingPanel.querySelector('.panel-close').addEventListener('click', () => {
    floatingPanel.classList.add('hidden')
  })

  floatingPanel.querySelector('.panel-btn-copy').addEventListener('click', copyCurrentHooks)
  floatingPanel.querySelector('.panel-btn-done').addEventListener('click', markCurrentDone)
  floatingPanel.querySelector('.panel-btn-skip').addEventListener('click', skipToNextJob)

  // Load current job
  loadCurrentJob()
}

async function loadCurrentJob() {
  const content = floatingPanel.querySelector('.panel-content')

  try {
    const { jobs, currentJobIndex } = await chrome.storage.local.get(['jobs', 'currentJobIndex'])
    const job = jobs?.[currentJobIndex || 0]

    if (!job) {
      content.innerHTML = '<div class="panel-empty">ไม่มีงาน กดดึงงานใหม่จาก Popup</div>'
      return
    }

    content.innerHTML = `
      <div class="panel-job">
        <div class="panel-job-header">
          ${job.productImage ? `<img src="${job.productImage}" class="panel-job-image">` : ''}
          <div class="panel-job-info">
            <p class="panel-job-name">${job.productName || 'ไม่มีชื่อ'}</p>
            <p class="panel-job-id">${job.productid || job.id}</p>
          </div>
        </div>
        <div class="panel-hooks">
          <div class="panel-hook">
            <label>Hook 1:</label>
            <p>${job.hooking || '-'}</p>
          </div>
          <div class="panel-hook">
            <label>Hook 2:</label>
            <p>${job.hook2 || '-'}</p>
          </div>
          <div class="panel-hook">
            <label>Hook 3:</label>
            <p>${job.hook3 || '-'}</p>
          </div>
          <div class="panel-hook">
            <label>Ending:</label>
            <p>${job.ending || '-'}</p>
          </div>
          <div class="panel-hook">
            <label>Caption:</label>
            <p>${job.caption || '-'}</p>
          </div>
        </div>
      </div>
    `
  } catch (error) {
    content.innerHTML = '<div class="panel-error">เกิดข้อผิดพลาด</div>'
  }
}

async function copyCurrentHooks() {
  const { jobs, currentJobIndex } = await chrome.storage.local.get(['jobs', 'currentJobIndex'])
  const job = jobs?.[currentJobIndex || 0]

  if (!job) {
    showNotification('ไม่มีงานให้คัดลอก')
    return
  }

  const text = `${job.hooking || ''}\n\n${job.hook2 || ''}\n\n${job.hook3 || ''}\n\n${job.ending || ''}\n\n${job.caption || ''}`
  await navigator.clipboard.writeText(text)
  showNotification('คัดลอก Hooks แล้ว!')
}

async function markCurrentDone() {
  const { jobs, currentJobIndex } = await chrome.storage.local.get(['jobs', 'currentJobIndex'])
  const job = jobs?.[currentJobIndex || 0]

  if (!job) {
    showNotification('ไม่มีงาน')
    return
  }

  try {
    chrome.runtime.sendMessage({
      action: 'markJobDone',
      jobId: job.id
    }, async (response) => {
      if (response.success) {
        jobs.splice(currentJobIndex || 0, 1)
        await chrome.storage.local.set({
          jobs,
          currentJobIndex: Math.max(0, (currentJobIndex || 0))
        })
        showNotification('งานเสร็จสิ้น!')
        loadCurrentJob()
      } else {
        showNotification('เกิดข้อผิดพลาด')
      }
    })
  } catch (error) {
    showNotification('เกิดข้อผิดพลาด')
  }
}

async function skipToNextJob() {
  const { jobs, currentJobIndex } = await chrome.storage.local.get(['jobs', 'currentJobIndex'])

  if (!jobs || jobs.length <= 1) {
    showNotification('ไม่มีงานอื่น')
    return
  }

  const newIndex = ((currentJobIndex || 0) + 1) % jobs.length
  await chrome.storage.local.set({ currentJobIndex: newIndex })
  loadCurrentJob()
  showNotification(`ข้ามไปงานที่ ${newIndex + 1}`)
}

// Insert hooks into TikTok upload page
function insertHooksIntoPage(hooks) {
  // Find caption/description textarea
  const captionTextarea = document.querySelector('textarea[placeholder*="caption"], textarea[placeholder*="description"], div[contenteditable="true"]')

  if (captionTextarea) {
    const fullCaption = `${hooks.caption || ''}\n\n${hooks.hashtags?.join(' ') || ''}`

    if (captionTextarea.tagName === 'TEXTAREA') {
      captionTextarea.value = fullCaption
      captionTextarea.dispatchEvent(new Event('input', { bubbles: true }))
    } else {
      captionTextarea.textContent = fullCaption
      captionTextarea.dispatchEvent(new Event('input', { bubbles: true }))
    }

    showNotification('ใส่ Caption แล้ว!')
  } else {
    showNotification('ไม่พบช่อง Caption')
  }
}

// Make element draggable
function makeDraggable(element) {
  const header = element.querySelector('.panel-header')
  let isDragging = false
  let offsetX, offsetY

  header.addEventListener('mousedown', (e) => {
    isDragging = true
    offsetX = e.clientX - element.getBoundingClientRect().left
    offsetY = e.clientY - element.getBoundingClientRect().top
    element.style.cursor = 'grabbing'
  })

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return
    element.style.left = (e.clientX - offsetX) + 'px'
    element.style.top = (e.clientY - offsetY) + 'px'
    element.style.right = 'auto'
    element.style.bottom = 'auto'
  })

  document.addEventListener('mouseup', () => {
    isDragging = false
    element.style.cursor = 'default'
  })
}

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
  // Alt + T to toggle panel
  if (e.altKey && e.key === 't') {
    showFloatingPanel()
  }

  // Alt + C to copy hooks
  if (e.altKey && e.key === 'c') {
    copyCurrentHooks()
  }

  // Alt + D to mark done
  if (e.altKey && e.key === 'd') {
    markCurrentDone()
  }
})

// Auto-show panel on TikTok upload pages
if (window.location.href.includes('tiktok.com/upload') ||
    window.location.href.includes('seller.tiktok.com')) {
  setTimeout(showFloatingPanel, 2000)
}

console.log('TikTok Auto Sales content script loaded')
