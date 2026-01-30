import { NextRequest, NextResponse } from 'next/server'
import { processScheduledJobs, getSchedulerStats } from '@/lib/tiktok-scheduler'
import {
  processPendingPipelines,
  notifyJobStatus,
  sendDiscordNotification,
} from '@/lib/tiktok-auto-pipeline'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/cron/tiktok-post
 * Cron job handler for TikTok automation
 * Called every 5 minutes by Vercel Cron
 *
 * Tasks:
 * 1. Process pending pipelines (generate hooks, videos)
 * 2. Post scheduled jobs to TikTok
 * 3. Send notifications for completed/failed jobs
 *
 * Vercel Cron Job Header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret in production
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization')
      const cronSecret = process.env.CRON_SECRET

      if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        console.error('[Cron] Unauthorized request')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('[Cron] Starting TikTok automation cycle...')
    const startTime = Date.now()
    const results: any = {
      pipelines: null,
      posts: null,
      notifications: { sent: 0 },
    }

    // Step 1: Process pending pipelines (generate hooks, videos, schedule)
    console.log('[Cron] Step 1: Processing pending pipelines...')
    try {
      results.pipelines = await processPendingPipelines(3) // Process 3 at a time
      console.log(`[Cron] Pipelines: ${results.pipelines.processed} processed, ${results.pipelines.success} success`)
    } catch (pipelineError: any) {
      console.error('[Cron] Pipeline processing error:', pipelineError)
      results.pipelines = { error: pipelineError.message }
    }

    // Step 2: Process scheduled posts
    console.log('[Cron] Step 2: Processing scheduled posts...')
    try {
      results.posts = await processScheduledJobs()
      console.log(`[Cron] Posts: ${results.posts.processed} processed, ${results.posts.successCount} success`)

      // Send notifications for posted jobs
      for (const jobResult of results.posts.results || []) {
        if (jobResult.status === 'success' || jobResult.status === 'failed') {
          try {
            const job = await prisma.tikTokJob.findUnique({
              where: { id: jobResult.jobId },
              select: {
                id: true,
                productName: true,
                status: true,
                error: true,
                tiktokPostId: true,
              },
            })
            if (job) {
              await notifyJobStatus(job)
              results.notifications.sent++
            }
          } catch (notifyError) {
            console.error('[Cron] Notification error:', notifyError)
          }
        }
      }
    } catch (postError: any) {
      console.error('[Cron] Post processing error:', postError)
      results.posts = { error: postError.message }
    }

    // Step 3: Get stats
    const stats = await getSchedulerStats()

    const duration = Date.now() - startTime
    console.log(`[Cron] Completed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      results,
      stats,
    })
  } catch (error: any) {
    console.error('[Cron] Fatal error:', error)

    // Try to send error notification
    try {
      await sendDiscordNotification(`🚨 Cron job failed: ${error.message}`, {
        title: 'TikTok Cron Error',
        color: 0xff0000,
      })
    } catch {}

    return NextResponse.json(
      {
        success: false,
        error: 'Scheduler failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cron/tiktok-post
 * Manual trigger for testing
 */
export async function POST(request: NextRequest) {
  try {
    // Verify auth
    if (process.env.NODE_ENV === 'production') {
      const body = await request.json().catch(() => ({}))
      const cronSecret = process.env.CRON_SECRET

      if (cronSecret && body.secret !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json().catch(() => ({}))
    const { action = 'all' } = body

    console.log('[Cron] Manual trigger:', action)

    const results: any = {}

    if (action === 'all' || action === 'pipelines') {
      results.pipelines = await processPendingPipelines(5)
    }

    if (action === 'all' || action === 'posts') {
      results.posts = await processScheduledJobs()
    }

    if (action === 'stats') {
      results.stats = await getSchedulerStats()
    }

    return NextResponse.json({
      success: true,
      message: 'Manual trigger completed',
      action,
      results,
    })
  } catch (error: any) {
    console.error('[Cron] Manual trigger error:', error)
    return NextResponse.json(
      { error: 'Trigger failed', details: error.message },
      { status: 500 }
    )
  }
}
