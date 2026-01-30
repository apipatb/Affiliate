/**
 * TikTok Scheduler Logic
 * Handles scheduled posts and retry logic
 */

import { prisma } from './prisma'
import {
  postVideoToTikTok,
  getDueJobs,
  checkDailyLimit,
  incrementRetryCount,
  getRetryDelay,
  getActiveAccount,
} from './tiktok-api'

const MAX_RETRIES = 3

export interface SchedulerResult {
  processed: number
  successCount: number
  failedCount: number
  skippedCount: number
  results: {
    jobId: string
    productName: string | null
    status: 'success' | 'failed' | 'skipped'
    error?: string
    postId?: string
  }[]
}

/**
 * Process all due scheduled jobs
 * Called by cron job every 5 minutes
 */
export async function processScheduledJobs(): Promise<SchedulerResult> {
  const result: SchedulerResult = {
    processed: 0,
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    results: [],
  }

  try {
    // Get all due jobs
    const dueJobs = await getDueJobs()
    result.processed = dueJobs.length

    if (dueJobs.length === 0) {
      console.log('[Scheduler] No jobs due for posting')
      return result
    }

    console.log(`[Scheduler] Found ${dueJobs.length} jobs due for posting`)

    // Process each job
    for (const job of dueJobs) {
      const jobResult = await processJob(job)
      result.results.push(jobResult)

      if (jobResult.status === 'success') {
        result.successCount++
      } else if (jobResult.status === 'failed') {
        result.failedCount++
      } else {
        result.skippedCount++
      }

      // Small delay between posts to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    return result
  } catch (error: any) {
    console.error('[Scheduler] Fatal error:', error)
    throw error
  }
}

/**
 * Process a single job
 */
async function processJob(job: any): Promise<{
  jobId: string
  productName: string | null
  status: 'success' | 'failed' | 'skipped'
  error?: string
  postId?: string
}> {
  const { id: jobId, productName, tiktokAccountId, videoUrl, caption, publishType } = job

  console.log(`[Scheduler] Processing job ${jobId}: ${productName}`)

  try {
    // Validate job has required fields
    if (!videoUrl) {
      return {
        jobId,
        productName,
        status: 'skipped',
        error: 'No video URL',
      }
    }

    // Get account (from job or default active account)
    let accountId = tiktokAccountId
    if (!accountId) {
      const activeAccount = await getActiveAccount()
      if (!activeAccount) {
        return {
          jobId,
          productName,
          status: 'skipped',
          error: 'No TikTok account available',
        }
      }
      accountId = activeAccount.id

      // Assign account to job
      await prisma.tikTokJob.update({
        where: { id: jobId },
        data: { tiktokAccountId: accountId },
      })
    }

    // Check daily limit
    const { canPost, remainingPosts } = await checkDailyLimit(accountId)
    if (!canPost) {
      console.log(`[Scheduler] Account ${accountId} reached daily limit`)
      return {
        jobId,
        productName,
        status: 'skipped',
        error: `Daily limit reached (${remainingPosts} remaining)`,
      }
    }

    // Mark as processing
    await prisma.tikTokJob.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        progress: 10,
        progressStep: 'Starting upload...',
      },
    })

    // Post to TikTok
    const postResult = await postVideoToTikTok(
      accountId,
      jobId,
      videoUrl,
      caption || productName || '',
      publishType || 'DIRECT_POST'
    )

    if (postResult.success) {
      console.log(`[Scheduler] Job ${jobId} posted successfully: ${postResult.postId}`)
      return {
        jobId,
        productName,
        status: 'success',
        postId: postResult.postId,
      }
    } else {
      // Handle failure with retry
      return await handleJobFailure(job, postResult.error || 'Unknown error')
    }
  } catch (error: any) {
    console.error(`[Scheduler] Error processing job ${jobId}:`, error)
    return await handleJobFailure(job, error.message)
  }
}

/**
 * Handle job failure with retry logic
 */
async function handleJobFailure(
  job: any,
  errorMessage: string
): Promise<{
  jobId: string
  productName: string | null
  status: 'success' | 'failed' | 'skipped'
  error?: string
}> {
  const { id: jobId, productName, retryCount } = job

  // Increment retry count
  const newRetryCount = await incrementRetryCount(jobId)

  if (newRetryCount >= MAX_RETRIES) {
    // Max retries reached, mark as failed
    console.log(`[Scheduler] Job ${jobId} failed after ${MAX_RETRIES} retries`)
    await prisma.tikTokJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: `Max retries (${MAX_RETRIES}) exceeded. Last error: ${errorMessage}`,
        progressStep: 'Failed after maximum retries',
      },
    })

    return {
      jobId,
      productName,
      status: 'failed',
      error: `Max retries exceeded: ${errorMessage}`,
    }
  }

  // Schedule retry with exponential backoff
  const retryDelay = getRetryDelay(newRetryCount)
  const nextRetryAt = new Date(Date.now() + retryDelay)

  console.log(`[Scheduler] Job ${jobId} will retry at ${nextRetryAt.toISOString()} (attempt ${newRetryCount + 1}/${MAX_RETRIES})`)

  await prisma.tikTokJob.update({
    where: { id: jobId },
    data: {
      status: 'PENDING',
      scheduledAt: nextRetryAt,
      error: `Retry ${newRetryCount}/${MAX_RETRIES}: ${errorMessage}`,
      progressStep: `Retry scheduled for ${nextRetryAt.toLocaleTimeString()}`,
    },
  })

  return {
    jobId,
    productName,
    status: 'skipped',
    error: `Scheduled retry ${newRetryCount}/${MAX_RETRIES} at ${nextRetryAt.toISOString()}`,
  }
}

/**
 * Get scheduler stats
 */
export async function getSchedulerStats(): Promise<{
  pendingJobs: number
  processingJobs: number
  todayPosted: number
  failedJobs: number
  upcomingJobs: { id: string; scheduledAt: Date | null; productName: string | null }[]
}> {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const [pendingJobs, processingJobs, todayPosted, failedJobs, upcomingJobs] = await Promise.all([
    prisma.tikTokJob.count({
      where: {
        status: 'PENDING',
        scheduledAt: { not: null },
      },
    }),
    prisma.tikTokJob.count({
      where: { status: 'PROCESSING' },
    }),
    prisma.tikTokJob.count({
      where: {
        status: 'DONE',
        postedAt: { gte: todayStart },
      },
    }),
    prisma.tikTokJob.count({
      where: { status: 'FAILED' },
    }),
    prisma.tikTokJob.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { gte: now },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      select: {
        id: true,
        scheduledAt: true,
        productName: true,
      },
    }),
  ])

  return {
    pendingJobs,
    processingJobs,
    todayPosted,
    failedJobs,
    upcomingJobs,
  }
}

/**
 * Cancel a scheduled job
 */
export async function cancelScheduledJob(jobId: string): Promise<void> {
  await prisma.tikTokJob.update({
    where: { id: jobId },
    data: {
      scheduledAt: null,
      progressStep: 'Schedule cancelled',
    },
  })
}

/**
 * Reschedule a failed job
 */
export async function rescheduleFailedJob(jobId: string, newScheduledAt: Date): Promise<void> {
  await prisma.tikTokJob.update({
    where: { id: jobId },
    data: {
      status: 'PENDING',
      scheduledAt: newScheduledAt,
      retryCount: 0,
      error: null,
      progressStep: 'Rescheduled',
    },
  })
}
