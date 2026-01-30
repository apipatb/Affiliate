import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  validateApiKey,
  tikTokLogger,
} from '@/lib/tiktok-auth'

interface MarkDoneRequest {
  jobId?: string
  job_id?: string
  productId?: string
  productid?: string
  product_id?: string
  id?: string
  tiktokPostId?: string // TikTok's post ID after successful upload
  tiktok_post_id?: string
}

/**
 * POST /api/tiktok/jobs/done
 * Mark a job as completed (called by Extension after posting to TikTok)
 *
 * @param jobId - Direct job ID (preferred)
 * @param productId - Alternative: find job by product ID
 * @param tiktokPostId - Optional: TikTok's post ID for tracking
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API key for external calls
    const { valid, error: authError } = validateApiKey(request)
    if (!valid) {
      tikTokLogger.warn('Unauthorized access attempt to /jobs/done')
      return errorResponse(authError || 'Unauthorized', 401)
    }

    // Parse request body
    let body: MarkDoneRequest
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 400)
    }

    // Extract IDs with fallbacks for different naming conventions
    const jobId = body.jobId || body.job_id
    const productId = body.productId || body.productid || body.product_id || body.id
    const tiktokPostId = body.tiktokPostId || body.tiktok_post_id

    // Validate input
    if (!productId && !jobId) {
      return errorResponse('Missing required field', 400, 'Either jobId or productId is required')
    }

    let job

    if (jobId) {
      // Update by job ID (preferred method)
      tikTokLogger.info('Marking job as done by jobId', { jobId, tiktokPostId })

      try {
        job = await prisma.tikTokJob.update({
          where: { id: jobId },
          data: {
            status: 'DONE',
            postedAt: new Date(),
            tiktokPostId: tiktokPostId || undefined,
            progress: 100,
            progressStep: 'Posted successfully!',
            error: null,
          },
        })
      } catch (dbError: any) {
        if (dbError.code === 'P2025') {
          return errorResponse('Job not found', 404, `No job found with ID: ${jobId}`)
        }
        throw dbError
      }
    } else {
      // Find and update by product ID (fallback method)
      tikTokLogger.info('Marking job as done by productId', { productId, tiktokPostId })

      const existingJob = await prisma.tikTokJob.findFirst({
        where: {
          productId: String(productId),
          status: { in: ['PENDING', 'PROCESSING'] },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!existingJob) {
        return errorResponse(
          'No pending job found',
          404,
          `No pending or processing job found for product: ${productId}`
        )
      }

      job = await prisma.tikTokJob.update({
        where: { id: existingJob.id },
        data: {
          status: 'DONE',
          postedAt: new Date(),
          tiktokPostId: tiktokPostId || undefined,
          progress: 100,
          progressStep: 'Posted successfully!',
          error: null,
        },
      })
    }

    tikTokLogger.info('Job marked as done successfully', {
      jobId: job.id,
      productId: job.productId,
      tiktokPostId: job.tiktokPostId,
    })

    return successResponse(
      {
        id: job.id,
        productId: job.productId,
        productName: job.productName,
        status: job.status,
        postedAt: job.postedAt,
        tiktokPostId: job.tiktokPostId,
      },
      'Job marked as done successfully'
    )
  } catch (error: any) {
    tikTokLogger.error('Failed to mark job as done', error)
    return errorResponse(
      'Failed to update job',
      500,
      error?.message || 'An unexpected error occurred'
    )
  }
}

/**
 * GET /api/tiktok/jobs/done
 * Get list of completed jobs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'))
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const skip = (page - 1) * limit

    const [jobs, total] = await Promise.all([
      prisma.tikTokJob.findMany({
        where: { status: 'DONE' },
        orderBy: { postedAt: 'desc' },
        take: limit,
        skip,
        select: {
          id: true,
          productId: true,
          productName: true,
          productImage: true,
          videoUrl: true,
          tiktokPostId: true,
          postedAt: true,
          createdAt: true,
        },
      }),
      prisma.tikTokJob.count({ where: { status: 'DONE' } }),
    ])

    return successResponse({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    tikTokLogger.error('Failed to fetch completed jobs', error)
    return errorResponse('Failed to fetch jobs', 500, error?.message)
  }
}
