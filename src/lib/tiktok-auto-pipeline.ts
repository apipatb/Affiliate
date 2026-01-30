/**
 * TikTok Auto Pipeline Service
 * Handles fully automated video creation and posting flow
 *
 * Flow: Product → Job → Hooks → Video → Schedule → Post → Notify
 */

import { prisma } from './prisma'
import { tikTokLogger } from './tiktok-auth'

// Configuration
const AUTO_PIPELINE_CONFIG = {
  // Best times to post on TikTok (Thailand timezone, UTC+7)
  bestPostingHours: [12, 18, 20, 21], // 12:00, 18:00, 20:00, 21:00

  // Time between posts (minutes)
  minPostInterval: 30,

  // Max posts per day per account
  maxPostsPerDay: 10,

  // Auto-generate settings
  autoGenerateHooks: true,
  autoGenerateVideo: true,
  autoSchedule: true,

  // Default video settings
  defaultVideoOptions: {
    backgroundMusic: 'upbeat',
    musicVolume: 0.3,
    showTextOverlay: true,
    textStyle: 'bold' as const,
  },

  // Webhook URLs (set via env)
  lineNotifyToken: process.env.LINE_NOTIFY_TOKEN,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
}

export interface PipelineResult {
  success: boolean
  jobId?: string
  stage: 'created' | 'hooks' | 'video' | 'scheduled' | 'posted' | 'failed'
  message: string
  error?: string
}

/**
 * Get next available posting slot
 */
export async function getNextPostingSlot(accountId?: string): Promise<Date> {
  const now = new Date()
  const thailandOffset = 7 * 60 // UTC+7

  // Get today's scheduled posts count
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const scheduledToday = await prisma.tikTokJob.count({
    where: {
      scheduledAt: { gte: todayStart },
      status: { in: ['PENDING', 'PROCESSING'] },
      ...(accountId && { tiktokAccountId: accountId }),
    },
  })

  // Find next available slot
  const { bestPostingHours, minPostInterval, maxPostsPerDay } = AUTO_PIPELINE_CONFIG

  // If max posts reached today, schedule for tomorrow
  if (scheduledToday >= maxPostsPerDay) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(bestPostingHours[0], 0, 0, 0)
    return tomorrow
  }

  // Get last scheduled job
  const lastScheduled = await prisma.tikTokJob.findFirst({
    where: {
      scheduledAt: { not: null },
      status: { in: ['PENDING', 'PROCESSING'] },
    },
    orderBy: { scheduledAt: 'desc' },
  })

  // Calculate next slot
  let nextSlot = new Date(now)

  if (lastScheduled?.scheduledAt) {
    // Add interval after last scheduled
    nextSlot = new Date(lastScheduled.scheduledAt.getTime() + minPostInterval * 60 * 1000)
  }

  // Ensure it's a good posting hour
  const currentHour = nextSlot.getHours()
  const nextGoodHour = bestPostingHours.find(h => h > currentHour) || bestPostingHours[0]

  if (nextGoodHour <= currentHour) {
    // Move to next day
    nextSlot.setDate(nextSlot.getDate() + 1)
  }
  nextSlot.setHours(nextGoodHour, Math.floor(Math.random() * 30), 0, 0) // Random minute 0-29

  return nextSlot
}

/**
 * Run full auto pipeline for a job
 */
export async function runAutoPipeline(
  jobId: string,
  options: {
    generateHooks?: boolean
    generateVideo?: boolean
    autoSchedule?: boolean
    videoOptions?: typeof AUTO_PIPELINE_CONFIG.defaultVideoOptions
  } = {}
): Promise<PipelineResult> {
  const {
    generateHooks = AUTO_PIPELINE_CONFIG.autoGenerateHooks,
    generateVideo = AUTO_PIPELINE_CONFIG.autoGenerateVideo,
    autoSchedule = AUTO_PIPELINE_CONFIG.autoSchedule,
    videoOptions = AUTO_PIPELINE_CONFIG.defaultVideoOptions,
  } = options

  tikTokLogger.info('Starting auto pipeline', { jobId, options })

  try {
    // Get the job
    const job = await prisma.tikTokJob.findUnique({ where: { id: jobId } })
    if (!job) {
      return { success: false, stage: 'failed', message: 'Job not found', error: `Job ${jobId} not found` }
    }

    // Stage 1: Generate Hooks (if needed)
    if (generateHooks && !job.hook1) {
      tikTokLogger.info('Generating hooks', { jobId })

      await prisma.tikTokJob.update({
        where: { id: jobId },
        data: { progress: 10, progressStep: 'กำลังสร้าง Hooks...' },
      })

      try {
        const hooksResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tiktok/generate-hooks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName: job.productName || job.productId }),
        })

        if (hooksResponse.ok) {
          const hooks = await hooksResponse.json()
          await prisma.tikTokJob.update({
            where: { id: jobId },
            data: {
              hook1: hooks.hook1,
              hook2: hooks.hook2,
              hook3: hooks.hook3,
              ending: hooks.ending,
              caption: hooks.caption || job.caption,
              hashtags: hooks.hashtags || job.hashtags,
              progress: 25,
              progressStep: 'สร้าง Hooks เสร็จแล้ว',
            },
          })
        } else {
          throw new Error('Failed to generate hooks')
        }
      } catch (hookError: any) {
        tikTokLogger.error('Hook generation failed', hookError)
        await prisma.tikTokJob.update({
          where: { id: jobId },
          data: { error: `Hook generation failed: ${hookError.message}` },
        })
        // Continue without hooks
      }
    }

    // Refresh job data
    const updatedJob = await prisma.tikTokJob.findUnique({ where: { id: jobId } })
    if (!updatedJob) {
      return { success: false, stage: 'failed', message: 'Job not found after hooks' }
    }

    // Stage 2: Generate Video (if needed)
    if (generateVideo && !updatedJob.videoUrl && (updatedJob.productImage || updatedJob.productImages?.length)) {
      tikTokLogger.info('Generating video', { jobId })

      await prisma.tikTokJob.update({
        where: { id: jobId },
        data: { progress: 30, progressStep: 'กำลังสร้างวิดีโอ...', status: 'PROCESSING' },
      })

      try {
        const videoResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tiktok/generate-video`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            ...videoOptions,
          }),
        })

        if (!videoResponse.ok) {
          const error = await videoResponse.json()
          throw new Error(error.error || 'Video generation failed')
        }

        await prisma.tikTokJob.update({
          where: { id: jobId },
          data: { progress: 70, progressStep: 'สร้างวิดีโอเสร็จแล้ว' },
        })
      } catch (videoError: any) {
        tikTokLogger.error('Video generation failed', videoError)
        await prisma.tikTokJob.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            error: `Video generation failed: ${videoError.message}`,
            progressStep: 'สร้างวิดีโอล้มเหลว',
          },
        })
        return {
          success: false,
          jobId,
          stage: 'video',
          message: 'Video generation failed',
          error: videoError.message,
        }
      }
    }

    // Stage 3: Auto Schedule (if video ready)
    const finalJob = await prisma.tikTokJob.findUnique({ where: { id: jobId } })

    if (autoSchedule && finalJob?.videoUrl && !finalJob.scheduledAt) {
      tikTokLogger.info('Auto scheduling', { jobId })

      // Get active TikTok account
      const activeAccount = await prisma.tikTokAccount.findFirst({
        where: { isActive: true },
        orderBy: { lastPostAt: 'asc' },
      })

      if (activeAccount) {
        const nextSlot = await getNextPostingSlot(activeAccount.id)

        await prisma.tikTokJob.update({
          where: { id: jobId },
          data: {
            scheduledAt: nextSlot,
            tiktokAccountId: activeAccount.id,
            status: 'PENDING',
            progress: 90,
            progressStep: `ตั้งเวลาโพสต์: ${nextSlot.toLocaleString('th-TH')}`,
          },
        })

        tikTokLogger.info('Job scheduled', { jobId, scheduledAt: nextSlot })
      } else {
        tikTokLogger.warn('No active TikTok account for scheduling', { jobId })
      }
    }

    // Update final status
    await prisma.tikTokJob.update({
      where: { id: jobId },
      data: {
        progress: 100,
        progressStep: finalJob?.scheduledAt ? 'พร้อมโพสต์ตามเวลา' : 'พร้อมโพสต์',
        status: 'PENDING',
      },
    })

    return {
      success: true,
      jobId,
      stage: finalJob?.scheduledAt ? 'scheduled' : 'video',
      message: 'Pipeline completed successfully',
    }
  } catch (error: any) {
    tikTokLogger.error('Pipeline failed', error)

    await prisma.tikTokJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: error.message,
        progressStep: 'Pipeline ล้มเหลว',
      },
    }).catch(() => {})

    return {
      success: false,
      jobId,
      stage: 'failed',
      message: 'Pipeline failed',
      error: error.message,
    }
  }
}

/**
 * Create job from Product and run auto pipeline
 */
export async function createJobFromProduct(
  productId: string,
  options: {
    runPipeline?: boolean
    videoOptions?: typeof AUTO_PIPELINE_CONFIG.defaultVideoOptions
  } = {}
): Promise<PipelineResult> {
  const { runPipeline = true, videoOptions } = options

  tikTokLogger.info('Creating job from product', { productId })

  try {
    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        media: {
          where: { type: 'IMAGE' },
          orderBy: { order: 'asc' },
          take: 5,
        },
        category: true,
      },
    })

    if (!product) {
      return { success: false, stage: 'failed', message: 'Product not found' }
    }

    // Check if job already exists
    const existingJob = await prisma.tikTokJob.findFirst({
      where: {
        internalProductId: productId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    })

    if (existingJob) {
      tikTokLogger.info('Job already exists', { productId, jobId: existingJob.id })
      return {
        success: true,
        jobId: existingJob.id,
        stage: 'created',
        message: 'Job already exists',
      }
    }

    // Collect all product images
    const productImages: string[] = []
    if (product.imageUrl) productImages.push(product.imageUrl)
    if (product.media) {
      productImages.push(...product.media.map(m => m.url))
    }

    // Generate platform product ID
    const platformProductId = `${product.platform}-${product.id.slice(-8)}`

    // Create job
    const job = await prisma.tikTokJob.create({
      data: {
        productId: platformProductId,
        internalProductId: product.id,
        affiliateUrl: product.affiliateUrl,
        productName: product.title,
        productImage: product.imageUrl,
        productImages: [...new Set(productImages)], // Remove duplicates
        status: 'PENDING',
        progress: 0,
        progressStep: 'Job created',
      },
    })

    tikTokLogger.info('Job created from product', { productId, jobId: job.id })

    // Run pipeline if requested
    if (runPipeline) {
      return runAutoPipeline(job.id, { videoOptions })
    }

    return {
      success: true,
      jobId: job.id,
      stage: 'created',
      message: 'Job created successfully',
    }
  } catch (error: any) {
    tikTokLogger.error('Failed to create job from product', error)
    return {
      success: false,
      stage: 'failed',
      message: 'Failed to create job',
      error: error.message,
    }
  }
}

/**
 * Process all pending jobs that need pipeline
 */
export async function processPendingPipelines(limit: number = 5): Promise<{
  processed: number
  success: number
  failed: number
  results: PipelineResult[]
}> {
  tikTokLogger.info('Processing pending pipelines', { limit })

  // Find jobs that need processing
  const pendingJobs = await prisma.tikTokJob.findMany({
    where: {
      status: 'PENDING',
      OR: [
        { hook1: null }, // Needs hooks
        { videoUrl: null, productImage: { not: null } }, // Needs video
        { videoUrl: { not: null }, scheduledAt: null }, // Needs scheduling
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  const results: PipelineResult[] = []
  let success = 0
  let failed = 0

  for (const job of pendingJobs) {
    const result = await runAutoPipeline(job.id)
    results.push(result)

    if (result.success) {
      success++
    } else {
      failed++
    }

    // Small delay between jobs
    await new Promise(r => setTimeout(r, 1000))
  }

  tikTokLogger.info('Pending pipelines processed', { processed: pendingJobs.length, success, failed })

  return {
    processed: pendingJobs.length,
    success,
    failed,
    results,
  }
}

/**
 * Send notification via LINE Notify
 */
export async function sendLineNotification(message: string): Promise<boolean> {
  const token = AUTO_PIPELINE_CONFIG.lineNotifyToken
  if (!token) return false

  try {
    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
      body: `message=${encodeURIComponent(message)}`,
    })

    return response.ok
  } catch (error) {
    tikTokLogger.error('LINE notification failed', error)
    return false
  }
}

/**
 * Send notification via Discord Webhook
 */
export async function sendDiscordNotification(
  message: string,
  options: { title?: string; color?: number; url?: string } = {}
): Promise<boolean> {
  const webhookUrl = AUTO_PIPELINE_CONFIG.discordWebhookUrl
  if (!webhookUrl) return false

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: options.title || 'TikTok Bot',
          description: message,
          color: options.color || 0x00ff00,
          url: options.url,
          timestamp: new Date().toISOString(),
        }],
      }),
    })

    return response.ok
  } catch (error) {
    tikTokLogger.error('Discord notification failed', error)
    return false
  }
}

/**
 * Send notification for job status change
 */
export async function notifyJobStatus(
  job: { id: string; productName: string | null; status: string; error?: string | null; tiktokPostId?: string | null }
): Promise<void> {
  const statusEmoji = {
    DONE: '✅',
    FAILED: '❌',
    PROCESSING: '⏳',
    PENDING: '📝',
  }

  const emoji = statusEmoji[job.status as keyof typeof statusEmoji] || '📌'
  const productName = job.productName || 'Unknown Product'

  let message = `${emoji} TikTok Job: ${productName}\nStatus: ${job.status}`

  if (job.status === 'DONE' && job.tiktokPostId) {
    message += `\nPost ID: ${job.tiktokPostId}`
  }

  if (job.status === 'FAILED' && job.error) {
    message += `\nError: ${job.error}`
  }

  // Send to both platforms
  await Promise.all([
    sendLineNotification(message),
    sendDiscordNotification(message, {
      title: `TikTok: ${productName}`,
      color: job.status === 'DONE' ? 0x00ff00 : job.status === 'FAILED' ? 0xff0000 : 0xffff00,
    }),
  ])
}

export { AUTO_PIPELINE_CONFIG }
