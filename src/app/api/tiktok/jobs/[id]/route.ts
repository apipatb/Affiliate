import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  validateApiKey,
  tikTokLogger,
} from '@/lib/tiktok-auth'
import { TikTokJobStatus } from '@prisma/client'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/tiktok/jobs/[id]
 * Get a single job by ID with full details
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const job = await prisma.tikTokJob.findUnique({
      where: { id },
      include: {
        tiktokAccount: {
          select: {
            id: true,
            displayName: true,
            tiktokUsername: true,
            avatarUrl: true,
          },
        },
      },
    })

    if (!job) {
      return errorResponse('Job not found', 404, `No job found with ID: ${id}`)
    }

    return successResponse(job)
  } catch (error: any) {
    tikTokLogger.error('Failed to fetch job', error)
    return errorResponse('Failed to fetch job', 500, error?.message)
  }
}

interface UpdateJobData {
  productId?: string
  productid?: string
  product_id?: string
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
  status?: TikTokJobStatus
  error?: string | null
  scheduledAt?: string | null
  postedAt?: string | null
  tiktokAccountId?: string | null
  progress?: number
  progressStep?: string
}

/**
 * PUT /api/tiktok/jobs/[id]
 * Update a job's properties
 *
 * Supports both new and legacy field names for backward compatibility
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    // Validate API key
    const { valid, error: authError } = validateApiKey(request)
    if (!valid) {
      return errorResponse(authError || 'Unauthorized', 401)
    }

    // Parse request body
    let body: UpdateJobData
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 400)
    }

    // Check job exists
    const existing = await prisma.tikTokJob.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse('Job not found', 404, `No job found with ID: ${id}`)
    }

    // Build update data (only include fields that are provided)
    const updateData: any = {}

    // Product info
    if (body.productId || body.productid || body.product_id) {
      updateData.productId = body.productId || body.productid || body.product_id
    }
    if (body.productName || body.product_name) {
      updateData.productName = body.productName || body.product_name
    }
    if (body.productImage || body.product_image) {
      updateData.productImage = body.productImage || body.product_image
    }
    if (body.productImages !== undefined) {
      updateData.productImages = body.productImages
    }

    // Hooks
    if (body.hook1 !== undefined || body.hooking !== undefined) {
      updateData.hook1 = body.hooking || body.hook1
    }
    if (body.hook2 !== undefined) updateData.hook2 = body.hook2
    if (body.hook3 !== undefined) updateData.hook3 = body.hook3
    if (body.ending !== undefined) updateData.ending = body.ending

    // Video
    if (body.videoUrl !== undefined || body.final_video !== undefined) {
      updateData.videoUrl = body.final_video || body.videoUrl
    }

    // Caption & hashtags
    if (body.caption !== undefined) updateData.caption = body.caption
    if (body.hashtags !== undefined) updateData.hashtags = body.hashtags

    // Status
    if (body.status !== undefined) {
      const validStatuses: TikTokJobStatus[] = ['PENDING', 'PROCESSING', 'DONE', 'FAILED']
      if (!validStatuses.includes(body.status)) {
        return errorResponse('Invalid status', 400, `Valid statuses: ${validStatuses.join(', ')}`)
      }
      updateData.status = body.status
    }

    // Error message
    if (body.error !== undefined) updateData.error = body.error

    // Dates
    if (body.scheduledAt !== undefined) {
      updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
    }
    if (body.postedAt !== undefined) {
      updateData.postedAt = body.postedAt ? new Date(body.postedAt) : null
    }

    // TikTok account
    if (body.tiktokAccountId !== undefined) {
      updateData.tiktokAccountId = body.tiktokAccountId
    }

    // Progress
    if (body.progress !== undefined) {
      updateData.progress = Math.min(100, Math.max(0, body.progress))
    }
    if (body.progressStep !== undefined) {
      updateData.progressStep = body.progressStep
    }

    // Update the job
    const job = await prisma.tikTokJob.update({
      where: { id },
      data: updateData,
    })

    tikTokLogger.info('Job updated', { id, fields: Object.keys(updateData) })

    return successResponse(job, 'Job updated successfully')
  } catch (error: any) {
    tikTokLogger.error('Failed to update job', error)
    return errorResponse('Failed to update job', 500, error?.message)
  }
}

/**
 * PATCH /api/tiktok/jobs/[id]
 * Partial update (alias for PUT)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  return PUT(request, context)
}

/**
 * DELETE /api/tiktok/jobs/[id]
 * Delete a single job
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    // Check job exists
    const existing = await prisma.tikTokJob.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse('Job not found', 404, `No job found with ID: ${id}`)
    }

    // Don't allow deleting jobs that are currently processing
    if (existing.status === 'PROCESSING') {
      return errorResponse(
        'Cannot delete processing job',
        400,
        'Wait for the job to complete or fail before deleting'
      )
    }

    await prisma.tikTokJob.delete({ where: { id } })

    tikTokLogger.info('Job deleted', { id, productId: existing.productId })

    return successResponse(
      { id, productId: existing.productId },
      'Job deleted successfully'
    )
  } catch (error: any) {
    tikTokLogger.error('Failed to delete job', error)
    return errorResponse('Failed to delete job', 500, error?.message)
  }
}
