// Background Service Worker for TikTok Auto Sales

// Default API URL
let apiUrl = 'http://localhost:3000'

// Load settings on startup
chrome.storage.local.get(['apiUrl'], (result) => {
  if (result.apiUrl) {
    apiUrl = result.apiUrl
  }
})

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.apiUrl) {
    apiUrl = changes.apiUrl.newValue
  }
})

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getApiUrl':
      sendResponse({ apiUrl })
      break

    case 'fetchJobs':
      fetchPendingJobs()
        .then(jobs => sendResponse({ success: true, jobs }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true // Keep the message channel open for async response

    case 'markJobDone':
      markJobAsDone(request.jobId)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true

    case 'getCurrentJob':
      getCurrentJob()
        .then(job => sendResponse({ success: true, job }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true

    // Shopee data handling
    case 'storeShopeeData':
      chrome.storage.local.set({ shopeeData: request.data })
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true

    case 'getShopeeData':
      chrome.storage.local.get(['shopeeData'])
        .then(result => sendResponse({ success: true, data: result.shopeeData || null }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true

    case 'clearShopeeData':
      chrome.storage.local.remove('shopeeData')
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true
  }
})

// Fetch pending jobs from API
async function fetchPendingJobs() {
  const response = await fetch(`${apiUrl}/api/tiktok/jobs?status=PENDING`)
  if (!response.ok) {
    throw new Error('Failed to fetch jobs')
  }
  return response.json()
}

// Mark job as done
async function markJobAsDone(jobId) {
  const response = await fetch(`${apiUrl}/api/tiktok/jobs/done`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: jobId })
  })
  if (!response.ok) {
    throw new Error('Failed to mark job as done')
  }
  return response.json()
}

// Get current job from storage
async function getCurrentJob() {
  const { jobs, currentJobIndex } = await chrome.storage.local.get(['jobs', 'currentJobIndex'])
  if (jobs && jobs.length > 0) {
    return jobs[currentJobIndex || 0]
  }
  return null
}

// Context menu for quick actions
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'tiktok-auto-sales',
    title: 'TikTok Auto Sales',
    contexts: ['page']
  })

  chrome.contextMenus.create({
    id: 'copy-current-hooks',
    parentId: 'tiktok-auto-sales',
    title: 'คัดลอก Hooks ปัจจุบัน',
    contexts: ['page']
  })

  chrome.contextMenus.create({
    id: 'mark-current-done',
    parentId: 'tiktok-auto-sales',
    title: 'Mark ว่าเสร็จแล้ว',
    contexts: ['page']
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { jobs, currentJobIndex } = await chrome.storage.local.get(['jobs', 'currentJobIndex'])
  const currentJob = jobs?.[currentJobIndex || 0]

  if (!currentJob) {
    return
  }

  switch (info.menuItemId) {
    case 'copy-current-hooks':
      const hooksText = `${currentJob.hooking || ''}\n\n${currentJob.hook2 || ''}\n\n${currentJob.hook3 || ''}\n\n${currentJob.ending || ''}`
      // Send to content script to copy
      chrome.tabs.sendMessage(tab.id, { action: 'copyToClipboard', text: hooksText })
      break

    case 'mark-current-done':
      try {
        await markJobAsDone(currentJob.id)
        // Remove from local list
        jobs.splice(currentJobIndex || 0, 1)
        await chrome.storage.local.set({
          jobs,
          currentJobIndex: Math.max(0, (currentJobIndex || 0) - 1)
        })
        // Notify
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'TikTok Auto Sales',
          message: 'งานถูก mark ว่าเสร็จแล้ว!'
        })
      } catch (error) {
        console.error('Failed to mark as done:', error)
      }
      break
  }
})

console.log('TikTok Auto Sales background script loaded')
