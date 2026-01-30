import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  validateApiKey,
  tikTokLogger,
} from '@/lib/tiktok-auth'
import {
  runAutoPipeline,
  createJobFromProduct,
  processPendingPipelines,
  getNextPostingSlot,
  AUTO_PIPELINE_CONFIG,
} from '@/lib/tiktok-auto-pipeline'

/**
 * GET /api/tiktok/auto-pipeline
 * Get pipeline status and configuration
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'next-slot') {
      // Get next available posting slot
      const nextSlot = await getNextPostingSlot()
      return successResponse({
        nextSlot: nextSlot.toISOString(),
        nextSlotLocal: nextSlot.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
      })
    }

    if (action === 'queue') {
      // Get pipeline queue status
      const [pending, processing, scheduled, completed, failed] = await Promise.all([
        prisma.tikTokJob.count({
          where: { status: 'PENDING', videoUrl: null },
        }),
        prisma.tikTokJob.count({
          where: { status: 'PROCESSING' },
        }),
        prisma.tikTokJob.count({
          where: { status: 'PENDING', scheduledAt: { not: null } },
        }),
        prisma.tikTokJob.count({
          where: { status: 'DONE' },
        }),
        prisma.tikTokJob.count({
          where: { status: 'FAILED' },
        }),
      ])

      return successResponse({
        queue: {
          needsProcessing: pending,
          processing,
          scheduledToPost: scheduled,
          completed,
          failed,
        },
      })
    }

    // Default: return config and stats
    const [totalJobs, activeAccounts] = await Promise.all([
      prisma.tikTokJob.count(),
      prisma.tikTokAccount.count({ where: { isActive: true } }),
    ])

    return successResponse({
      config: {
        bestPostingHours: AUTO_PIPELINE_CONFIG.bestPostingHours,
        maxPostsPerDay: AUTO_PIPELINE_CONFIG.maxPostsPerDay,
        minPostInterval: AUTO_PIPELINE_CONFIG.minPostInterval,
        autoGenerateHooks: AUTO_PIPELINE_CONFIG.autoGenerateHooks,
        autoGenerateVideo: AUTO_PIPELINE_CONFIG.autoGenerateVideo,
        autoSchedule: AUTO_PIPELINE_CONFIG.autoSchedule,
        notificationsEnabled: !!(AUTO_PIPELINE_CONFIG.lineNotifyToken || AUTO_PIPELINE_CONFIG.discordWebhookUrl),
      },
      stats: {
        totalJobs,
        activeAccounts,
      },
    })
  } catch (error: any) {
    tikTokLogger.error('Failed to get pipeline status', error)
    return errorResponse('Failed to get status', 500, error?.message)
  }
}

interface PipelineRequest {
  action: 'run' | 'create-from-product' | 'process-pending' | 'schedule-all' | 'import-all-products'
  jobId?: string
  productId?: string
  productIds?: string[]
  limit?: number
  runPipeline?: boolean
  options?: {
    generateHooks?: boolean
    generateVideo?: boolean
    autoSchedule?: boolean
    backgroundMusic?: string
    showTextOverlay?: boolean
    textStyle?: string
  }
}

/**
 * POST /api/tiktok/auto-pipeline
 * Trigger pipeline actions
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const { valid, error: authError } = validateApiKey(request)
    if (!valid) {
      return errorResponse(authError || 'Unauthorized', 401)
    }

    let body: PipelineRequest
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 400)
    }

    const { action, jobId, productId, productIds, limit = 5, runPipeline = false, options } = body

    tikTokLogger.info('Pipeline action requested', { action, jobId, productId })

    switch (action) {
      case 'run': {
        // Run pipeline for a specific job
        if (!jobId) {
          return errorResponse('jobId is required', 400)
        }

        const result = await runAutoPipeline(jobId, options)

        if (result.success) {
          return successResponse(result, result.message)
        } else {
          return errorResponse(result.message, 400, result.error)
        }
      }

      case 'create-from-product': {
        // Create job(s) from product(s) and run pipeline
        const ids = productIds || (productId ? [productId] : [])

        if (ids.length === 0) {
          return errorResponse('productId or productIds is required', 400)
        }

        const results = await Promise.all(
          ids.map(id => createJobFromProduct(id, { runPipeline: true, videoOptions: options as any }))
        )

        const success = results.filter(r => r.success).length
        const failed = results.filter(r => !r.success).length

        return successResponse(
          {
            results,
            summary: { total: ids.length, success, failed },
          },
          `Created ${success} job(s), ${failed} failed`
        )
      }

      case 'process-pending': {
        // Process all pending jobs in queue
        const result = await processPendingPipelines(limit)
        return successResponse(result, `Processed ${result.processed} job(s)`)
      }

      case 'schedule-all': {
        // Auto-schedule all unscheduled jobs with videos
        const unscheduled = await prisma.tikTokJob.findMany({
          where: {
            status: 'PENDING',
            videoUrl: { not: null },
            scheduledAt: null,
          },
          take: limit,
          orderBy: { createdAt: 'asc' },
        })

        const activeAccount = await prisma.tikTokAccount.findFirst({
          where: { isActive: true },
        })

        if (!activeAccount) {
          return errorResponse('No active TikTok account', 400)
        }

        let scheduled = 0
        for (const job of unscheduled) {
          const nextSlot = await getNextPostingSlot(activeAccount.id)
          await prisma.tikTokJob.update({
            where: { id: job.id },
            data: {
              scheduledAt: nextSlot,
              tiktokAccountId: activeAccount.id,
            },
          })
          scheduled++
        }

        return successResponse(
          { scheduled, total: unscheduled.length },
          `Scheduled ${scheduled} job(s)`
        )
      }

      case 'import-all-products': {
        // Get all products that don't have TikTok jobs yet
        const existingJobProductIds = await prisma.tikTokJob.findMany({
          where: { internalProductId: { not: null } },
          select: { internalProductId: true },
        })
        const existingIds = new Set(existingJobProductIds.map(j => j.internalProductId))

        const productsWithoutJobs = await prisma.product.findMany({
          where: {
            id: { notIn: Array.from(existingIds).filter(Boolean) as string[] },
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            imageUrl: true,
            affiliateUrl: true,
          },
        })

        if (productsWithoutJobs.length === 0) {
          return successResponse(
            { imported: 0, total: 0 },
            'All products already have TikTok jobs'
          )
        }

        const results = await Promise.all(
          productsWithoutJobs.map(product =>
            createJobFromProduct(product.id, { runPipeline, videoOptions: options as any })
          )
        )

        const success = results.filter(r => r.success).length
        const failed = results.filter(r => !r.success).length

        return successResponse(
          {
            results: results.map((r, i) => ({
              productId: productsWithoutJobs[i].id,
              productTitle: productsWithoutJobs[i].title,
              success: r.success,
              jobId: r.jobId,
              error: r.error,
            })),
            summary: {
              total: productsWithoutJobs.length,
              success,
              failed,
              remainingProducts: await prisma.product.count() - existingIds.size - success,
            },
          },
          `Imported ${success} product(s) as TikTok jobs`
        )
      }

      default:
        return errorResponse('Invalid action', 400, `Valid actions: run, create-from-product, process-pending, schedule-all, import-all-products`)
    }
  } catch (error: any) {
    tikTokLogger.error('Pipeline action failed', error)
    return errorResponse('Pipeline action failed', 500, error?.message)
  }
}
