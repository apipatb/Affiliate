import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  validateApiKey,
  tikTokLogger,
} from '@/lib/tiktok-auth'
import { TikTokJobStatus } from '@prisma/client'

// Valid status values
const VALID_STATUSES: TikTokJobStatus[] = ['PENDING', 'PROCESSING', 'DONE', 'FAILED']

/**
 * GET /api/tiktok/jobs
 * Fetch jobs list with filtering and pagination
 *
 * Query params:
 * - status: Filter by status (PENDING, PROCESSING, DONE, FAILED)
 * - limit: Max results (default 100, max 500)
 * - page: Page number for pagination
 * - search: Search by product name
 * - hasVideo: Filter by video presence (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as TikTokJobStatus | null
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '100')))
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const search = searchParams.get('search')
    const hasVideo = searchParams.get('hasVideo')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (status && VALID_STATUSES.includes(status)) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { productName: { contains: search, mode: 'insensitive' } },
        { productId: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (hasVideo === 'true') {
      where.videoUrl = { not: null }
    } else if (hasVideo === 'false') {
      where.videoUrl = null
    }

    // Fetch jobs with pagination
    const [jobs, total] = await Promise.all([
      prisma.tikTokJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.tikTokJob.count({ where }),
    ])

    // Format for Extension compatibility (backward compatible)
    const formattedJobs = jobs.map((job) => ({
      // New format
      id: job.id,
      productId: job.productId,
      internalProductId: job.internalProductId,
      affiliateUrl: job.affiliateUrl,
      productName: job.productName,
      productImage: job.productImage,
      productImages: job.productImages || [],
      hook1: job.hook1,
      hook2: job.hook2,
      hook3: job.hook3,
      ending: job.ending,
      videoUrl: job.videoUrl,
      caption: job.caption,
      hashtags: job.hashtags || [],
      status: job.status,
      error: job.error,
      progress: job.progress,
      progressStep: job.progressStep,
      scheduledAt: job.scheduledAt,
      postedAt: job.postedAt,
      tiktokPostId: job.tiktokPostId,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      // Legacy format (for Extension backward compatibility)
      productid: job.productId,
      product_id: job.productId,
      hooking: job.hook1,
      final_video: job.videoUrl,
    }))

    return successResponse({
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
      filters: {
        status: status || 'all',
        search: search || null,
        hasVideo: hasVideo || null,
      },
    })
  } catch (error: any) {
    tikTokLogger.error('Failed to fetch jobs', error)
    return errorResponse('Failed to fetch jobs', 500, error?.message)
  }
}

interface CreateJobData {
  productId?: string
  productid?: string
  product_id?: string
  id?: string
  internalProductId?: string
  affiliateUrl?: string
  productName?: string
  product_name?: string
  productImage?: string
  product_image?: string
  productImages?: string[]
  hook1?: string
  hooking?: string
  hook2?: string
  hook3?: string
  ending?: string
  videoUrl?: string
  final_video?: string
  caption?: string
  hashtags?: string[]
  scheduledAt?: string
}

/**
 * POST /api/tiktok/jobs
 * Create new job(s) - supports single and bulk creation
 *
 * Body: Single job object or array of job objects
 * - productId: Required - Platform product ID
 * - productName: Product display name
 * - productImage: Main product image URL
 * - productImages: Array of image URLs for slideshow
 * - affiliateUrl: Affiliate link to product
 * - hook1/hooking: Opening hook text
 * - hook2: Middle hook text
 * - hook3: Closing hook text
 * - ending: Call to action text
 * - caption: Video caption
 * - hashtags: Array of hashtags
 * - scheduledAt: ISO date string for scheduled posting
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API key for external calls
    const { valid, error: authError } = validateApiKey(request)
    if (!valid) {
      tikTokLogger.warn('Unauthorized access attempt to POST /jobs')
      return errorResponse(authError || 'Unauthorized', 401)
    }

    // Parse request body
    let body: CreateJobData | CreateJobData[]
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 400)
    }

    // Support both single job and array of jobs
    const jobsData = Array.isArray(body) ? body : [body]

    if (jobsData.length === 0) {
      return errorResponse('No jobs provided', 400)
    }

    if (jobsData.length > 100) {
      return errorResponse('Too many jobs', 400, 'Maximum 100 jobs per request')
    }

    tikTokLogger.info('Creating jobs', { count: jobsData.length })

    const results: { created: number; updated: number; errors: string[] } = {
      created: 0,
      updated: 0,
      errors: [],
    }

    const createdJobs = await Promise.all(
      jobsData.map(async (data, index) => {
        try {
          const productId = data.productId || data.productid || data.product_id || data.id

          if (!productId) {
            results.errors.push(`Job ${index + 1}: productId is required`)
            return null
          }

          // Check if job already exists for this product
          const existing = await prisma.tikTokJob.findFirst({
            where: {
              productId: String(productId),
              status: { in: ['PENDING', 'PROCESSING'] },
            },
          })

          if (existing) {
            // Update existing job
            const updated = await prisma.tikTokJob.update({
              where: { id: existing.id },
              data: {
                productName: data.productName || data.product_name || existing.productName,
                productImage: data.productImage || data.product_image || existing.productImage,
                productImages: data.productImages || existing.productImages,
                hook1: data.hooking || data.hook1 || existing.hook1,
                hook2: data.hook2 || existing.hook2,
                hook3: data.hook3 || existing.hook3,
                ending: data.ending || existing.ending,
                videoUrl: data.final_video || data.videoUrl || existing.videoUrl,
                caption: data.caption || existing.caption,
                hashtags: data.hashtags || existing.hashtags,
                affiliateUrl: data.affiliateUrl || existing.affiliateUrl,
              },
            })
            results.updated++
            return updated
          }

          // Create new job
          const created = await prisma.tikTokJob.create({
            data: {
              productId: String(productId),
              internalProductId: data.internalProductId || null,
              affiliateUrl: data.affiliateUrl || null,
              productName: data.productName || data.product_name || null,
              productImage: data.productImage || data.product_image || null,
              productImages: data.productImages || [],
              hook1: data.hooking || data.hook1 || null,
              hook2: data.hook2 || null,
              hook3: data.hook3 || null,
              ending: data.ending || null,
              videoUrl: data.final_video || data.videoUrl || null,
              caption: data.caption || null,
              hashtags: data.hashtags || [],
              scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
              status: 'PENDING',
              progress: 0,
            },
          })
          results.created++
          return created
        } catch (err: any) {
          results.errors.push(`Job ${index + 1}: ${err.message}`)
          return null
        }
      })
    )

    // Filter out null results
    const successfulJobs = createdJobs.filter(Boolean)

    tikTokLogger.info('Jobs creation completed', results)

    // Return appropriate response
    if (results.errors.length > 0 && successfulJobs.length === 0) {
      return errorResponse('All jobs failed', 400, results.errors.join('; '))
    }

    return successResponse(
      {
        jobs: Array.isArray(body) ? successfulJobs : successfulJobs[0],
        summary: results,
      },
      `Created ${results.created}, updated ${results.updated} job(s)`
    )
  } catch (error: any) {
    tikTokLogger.error('Failed to create jobs', error)
    return errorResponse('Failed to create job', 500, error?.message)
  }
}

/**
 * DELETE /api/tiktok/jobs
 * Bulk delete jobs by status or IDs
 *
 * Query params:
 * - status: Delete all jobs with this status
 * - ids: Comma-separated job IDs to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as TikTokJobStatus | null
    const ids = searchParams.get('ids')?.split(',').filter(Boolean)

    if (!status && !ids) {
      return errorResponse('Missing parameter', 400, 'Provide either status or ids')
    }

    let deleted: number

    if (ids && ids.length > 0) {
      const result = await prisma.tikTokJob.deleteMany({
        where: { id: { in: ids } },
      })
      deleted = result.count
    } else if (status && VALID_STATUSES.includes(status)) {
      const result = await prisma.tikTokJob.deleteMany({
        where: { status },
      })
      deleted = result.count
    } else {
      return errorResponse('Invalid status', 400, `Valid statuses: ${VALID_STATUSES.join(', ')}`)
    }

    tikTokLogger.info('Jobs deleted', { deleted, status, ids })

    return successResponse({ deleted }, `Deleted ${deleted} job(s)`)
  } catch (error: any) {
    tikTokLogger.error('Failed to delete jobs', error)
    return errorResponse('Failed to delete jobs', 500, error?.message)
  }
}
