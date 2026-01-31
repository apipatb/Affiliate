/**
 * TikTok Content Posting API Client
 * Handles OAuth, video upload, and publishing
 *
 * API Documentation: https://developers.tiktok.com/doc/content-posting-api-get-started
 */

import { prisma } from './prisma'

// TikTok API endpoints
const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/'
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/'
const TIKTOK_API_URL = 'https://open.tiktokapis.com/v2'

// Environment variables
const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || ''
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || ''
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/tiktok/oauth/callback`

// Rate limits
const MAX_DAILY_POSTS = 15 // TikTok's daily limit per account
const CHUNK_SIZE = 10 * 1024 * 1024 // 10MB chunks for video upload

// Retry configuration
const DEFAULT_RETRIES = 3
const RETRY_DELAY_MS = 1000

/**
 * Helper function for API calls with retry and exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = DEFAULT_RETRIES
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options)

      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response
      }

      // Retry on server errors (5xx) or rate limit
      if (response.ok || (response.status !== 429 && response.status < 500)) {
        return response
      }

      // Rate limit - wait longer
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
        await new Promise(r => setTimeout(r, retryAfter * 1000))
        continue
      }

      throw new Error(`HTTP ${response.status}`)
    } catch (error: any) {
      lastError = error
      console.warn(`API call attempt ${attempt + 1}/${retries} failed:`, error.message)

      if (attempt < retries - 1) {
        // Exponential backoff
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }

  throw lastError || new Error('All retry attempts failed')
}

// Types
export interface TikTokTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  open_id: string
  scope: string
  token_type: string
}

export interface TikTokUserInfo {
  open_id: string
  union_id?: string
  avatar_url?: string
  display_name?: string
  username?: string
}

export interface TikTokVideoInitResponse {
  data: {
    publish_id: string
    upload_url: string
  }
  error: {
    code: string
    message: string
    log_id: string
  }
}

export interface TikTokPublishStatusResponse {
  data: {
    status: 'PROCESSING_UPLOAD' | 'PROCESSING_DOWNLOAD' | 'SEND_TO_USER_INBOX' | 'PUBLISH_COMPLETE' | 'FAILED'
    fail_reason?: string
    publicaly_available_post_id?: string[]
    uploaded_bytes?: number
    video_id?: string
  }
  error: {
    code: string
    message: string
    log_id: string
  }
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: CLIENT_KEY,
    response_type: 'code',
    scope: 'user.info.basic,video.publish,video.upload',
    redirect_uri: REDIRECT_URI,
    state,
  })

  return `${TIKTOK_AUTH_URL}?${params.toString()}`
}

/**
 * Exchange authorization code for tokens (with retry)
 */
export async function exchangeCodeForTokens(code: string): Promise<TikTokTokenResponse> {
  const response = await fetchWithRetry(TIKTOK_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code: ${error}`)
  }

  return response.json()
}

/**
 * Refresh access token (with retry)
 */
export async function refreshAccessToken(refreshToken: string): Promise<TikTokTokenResponse> {
  const response = await fetchWithRetry(TIKTOK_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh token: ${error}`)
  }

  return response.json()
}

/**
 * Get valid access token (auto-refresh if expired)
 */
export async function getValidAccessToken(accountId: string): Promise<string> {
  const account = await prisma.tikTokAccount.findUnique({
    where: { id: accountId },
  })

  if (!account) {
    throw new Error('TikTok account not found')
  }

  // Check if token is expired or about to expire (5 min buffer)
  const now = new Date()
  const expiresAt = new Date(account.tokenExpiresAt)
  const bufferTime = 5 * 60 * 1000 // 5 minutes

  if (now.getTime() + bufferTime >= expiresAt.getTime()) {
    // Refresh the token
    const tokens = await refreshAccessToken(account.refreshToken)

    // Update the account with new tokens
    await prisma.tikTokAccount.update({
      where: { id: accountId },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        tokenScope: tokens.scope,
      },
    })

    return tokens.access_token
  }

  return account.accessToken
}

/**
 * Get user info from TikTok
 */
export async function getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
  const response = await fetch(`${TIKTOK_API_URL}/user/info/?fields=open_id,union_id,avatar_url,display_name,username`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get user info: ${error}`)
  }

  const data = await response.json()
  return data.data.user
}

/**
 * Check if account has reached daily post limit
 */
export async function checkDailyLimit(accountId: string): Promise<{ canPost: boolean; remainingPosts: number }> {
  const account = await prisma.tikTokAccount.findUnique({
    where: { id: accountId },
  })

  if (!account) {
    throw new Error('TikTok account not found')
  }

  const now = new Date()
  let dailyCount = account.dailyPostCount

  // Reset count if it's a new day
  if (account.dailyPostResetAt && now >= account.dailyPostResetAt) {
    await prisma.tikTokAccount.update({
      where: { id: accountId },
      data: {
        dailyPostCount: 0,
        dailyPostResetAt: getNextResetTime(),
      },
    })
    dailyCount = 0
  }

  return {
    canPost: dailyCount < MAX_DAILY_POSTS,
    remainingPosts: MAX_DAILY_POSTS - dailyCount,
  }
}

/**
 * Get next daily reset time (midnight UTC)
 */
function getNextResetTime(): Date {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCHours(0, 0, 0, 0)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  return tomorrow
}

/**
 * Initialize video upload (Direct Post method)
 * For videos hosted at a URL
 */
export async function initVideoUploadFromUrl(
  accessToken: string,
  videoUrl: string,
  options: {
    caption?: string
    privacyLevel?: 'SELF_ONLY' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'PUBLIC_TO_EVERYONE'
    disableComment?: boolean
    disableDuet?: boolean
    disableStitch?: boolean
    publishType?: 'DIRECT_POST' | 'INBOX_DRAFT'
  } = {}
): Promise<TikTokVideoInitResponse> {
  const {
    caption = '',
    privacyLevel = 'PUBLIC_TO_EVERYONE',
    disableComment = false,
    disableDuet = false,
    disableStitch = false,
    publishType = 'DIRECT_POST',
  } = options

  const endpoint = publishType === 'INBOX_DRAFT'
    ? `${TIKTOK_API_URL}/post/publish/inbox/video/init/`
    : `${TIKTOK_API_URL}/post/publish/video/init/`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title: caption.slice(0, 150), // TikTok limit
        privacy_level: privacyLevel,
        disable_comment: disableComment,
        disable_duet: disableDuet,
        disable_stitch: disableStitch,
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: videoUrl,
      },
    }),
  })

  const data = await response.json()

  if (data.error?.code !== 'ok') {
    throw new Error(`Failed to init video upload: ${data.error?.message || 'Unknown error'}`)
  }

  return data
}

/**
 * Initialize video upload (File Upload method)
 * For uploading video file directly
 */
export async function initVideoUploadFromFile(
  accessToken: string,
  fileSize: number,
  options: {
    caption?: string
    privacyLevel?: 'SELF_ONLY' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'PUBLIC_TO_EVERYONE'
    disableComment?: boolean
    disableDuet?: boolean
    disableStitch?: boolean
    publishType?: 'DIRECT_POST' | 'INBOX_DRAFT'
  } = {}
): Promise<TikTokVideoInitResponse & { data: { chunk_size: number; total_chunk_count: number } }> {
  const {
    caption = '',
    privacyLevel = 'PUBLIC_TO_EVERYONE',
    disableComment = false,
    disableDuet = false,
    disableStitch = false,
    publishType = 'DIRECT_POST',
  } = options

  const endpoint = publishType === 'INBOX_DRAFT'
    ? `${TIKTOK_API_URL}/post/publish/inbox/video/init/`
    : `${TIKTOK_API_URL}/post/publish/video/init/`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title: caption.slice(0, 150),
        privacy_level: privacyLevel,
        disable_comment: disableComment,
        disable_duet: disableDuet,
        disable_stitch: disableStitch,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: fileSize,
        chunk_size: CHUNK_SIZE,
        total_chunk_count: Math.ceil(fileSize / CHUNK_SIZE),
      },
    }),
  })

  const data = await response.json()

  if (data.error?.code !== 'ok') {
    throw new Error(`Failed to init video upload: ${data.error?.message || 'Unknown error'}`)
  }

  return data
}

/**
 * Upload video chunk
 */
export async function uploadVideoChunk(
  uploadUrl: string,
  chunk: Uint8Array,
  chunkIndex: number,
  totalChunks: number,
  totalSize: number
): Promise<void> {
  const start = chunkIndex * CHUNK_SIZE
  const end = Math.min(start + chunk.byteLength - 1, totalSize - 1)

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': chunk.byteLength.toString(),
      'Content-Range': `bytes ${start}-${end}/${totalSize}`,
    },
    body: chunk as unknown as BodyInit,
  })

  if (!response.ok && response.status !== 201 && response.status !== 206) {
    const error = await response.text()
    throw new Error(`Failed to upload chunk ${chunkIndex + 1}/${totalChunks}: ${error}`)
  }
}

/**
 * Check publish status
 */
export async function checkPublishStatus(accessToken: string, publishId: string): Promise<TikTokPublishStatusResponse> {
  const response = await fetch(`${TIKTOK_API_URL}/post/publish/status/fetch/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({ publish_id: publishId }),
  })

  return response.json()
}

/**
 * Poll for publish completion
 */
export async function waitForPublishComplete(
  accessToken: string,
  publishId: string,
  maxAttempts: number = 30,
  intervalMs: number = 5000
): Promise<TikTokPublishStatusResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await checkPublishStatus(accessToken, publishId)

    if (status.data.status === 'PUBLISH_COMPLETE') {
      return status
    }

    if (status.data.status === 'FAILED') {
      throw new Error(`Publish failed: ${status.data.fail_reason || 'Unknown reason'}`)
    }

    // Wait before next check
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error('Publish timed out')
}

/**
 * Post a video to TikTok (full flow)
 */
export async function postVideoToTikTok(
  accountId: string,
  jobId: string,
  videoUrl: string,
  caption: string,
  publishType: 'DIRECT_POST' | 'INBOX_DRAFT' = 'DIRECT_POST'
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // Check daily limit
    const { canPost, remainingPosts } = await checkDailyLimit(accountId)
    if (!canPost) {
      return { success: false, error: `Daily post limit reached. Remaining: ${remainingPosts}` }
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(accountId)

    // Initialize video upload
    const initResponse = await initVideoUploadFromUrl(accessToken, videoUrl, {
      caption,
      publishType,
    })

    const publishId = initResponse.data.publish_id

    // Update job with publish ID
    await prisma.tikTokJob.update({
      where: { id: jobId },
      data: {
        progressStep: 'Uploading video to TikTok...',
        progress: 50,
      },
    })

    // Wait for publish to complete
    const finalStatus = await waitForPublishComplete(accessToken, publishId)

    // Get the post ID
    const postId = finalStatus.data.publicaly_available_post_id?.[0] || finalStatus.data.video_id

    // Update account's daily post count
    const account = await prisma.tikTokAccount.findUnique({
      where: { id: accountId },
    })

    if (account) {
      await prisma.tikTokAccount.update({
        where: { id: accountId },
        data: {
          dailyPostCount: account.dailyPostCount + 1,
          dailyPostResetAt: account.dailyPostResetAt || getNextResetTime(),
          lastPostAt: new Date(),
        },
      })
    }

    // Update job as complete
    await prisma.tikTokJob.update({
      where: { id: jobId },
      data: {
        status: 'DONE',
        tiktokPostId: postId,
        postedAt: new Date(),
        progress: 100,
        progressStep: 'Posted successfully!',
        error: null,
      },
    })

    return { success: true, postId }
  } catch (error: any) {
    console.error('Failed to post video to TikTok:', error)

    // Update job with error
    await prisma.tikTokJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: error.message,
        progressStep: `Failed: ${error.message}`,
      },
    })

    return { success: false, error: error.message }
  }
}

/**
 * Increment retry count for a job
 */
export async function incrementRetryCount(jobId: string): Promise<number> {
  const job = await prisma.tikTokJob.update({
    where: { id: jobId },
    data: {
      retryCount: { increment: 1 },
    },
  })
  return job.retryCount
}

/**
 * Calculate exponential backoff delay
 * 1min → 2min → 4min
 */
export function getRetryDelay(retryCount: number): number {
  return Math.pow(2, retryCount) * 60 * 1000 // milliseconds
}

/**
 * Get scheduled jobs that are due for posting
 */
export async function getDueJobs(): Promise<any[]> {
  const now = new Date()

  return prisma.tikTokJob.findMany({
    where: {
      scheduledAt: { lte: now },
      status: 'PENDING',
      videoUrl: { not: null }, // Must have a video
      tiktokAccountId: { not: null }, // Must have an account assigned
    },
    include: {
      tiktokAccount: true,
    },
    orderBy: { scheduledAt: 'asc' },
    take: 10, // Process max 10 jobs per run
  })
}

/**
 * Get active TikTok account (first active account)
 */
export async function getActiveAccount(): Promise<any | null> {
  return prisma.tikTokAccount.findFirst({
    where: { isActive: true },
    orderBy: { lastPostAt: 'asc' }, // Use account that hasn't posted recently
  })
}
