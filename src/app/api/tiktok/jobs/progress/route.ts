import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, tikTokLogger } from '@/lib/tiktok-auth'

/**
 * GET /api/tiktok/jobs/progress
 * Get real-time progress of processing jobs
 *
 * Query params:
 * - ids: Comma-separated job IDs to check (optional)
 *
 * Returns progress info for all processing jobs or specific jobs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobIds = searchParams.get('ids')?.split(',').filter(Boolean) || []

    // Build where clause
    const where: any = jobIds.length > 0
      ? { id: { in: jobIds } }
      : { status: 'PROCESSING' }

    const jobs = await prisma.tikTokJob.findMany({
      where,
      select: {
        id: true,
        productId: true,
        productName: true,
        status: true,
        progress: true,
        progressStep: true,
        error: true,
        videoUrl: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Group by status for summary
    const summary = {
      total: jobs.length,
      processing: jobs.filter(j => j.status === 'PROCESSING').length,
      pending: jobs.filter(j => j.status === 'PENDING').length,
      done: jobs.filter(j => j.status === 'DONE').length,
      failed: jobs.filter(j => j.status === 'FAILED').length,
    }

    return successResponse({
      jobs: jobs.map(job => ({
        ...job,
        // Calculate estimated time remaining based on progress
        estimatedRemaining: job.status === 'PROCESSING' && job.progress > 0
          ? Math.round((100 - job.progress) * 0.5) // ~0.5 seconds per percent
          : null,
      })),
      summary,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    tikTokLogger.error('Failed to fetch progress', error)
    return errorResponse('Failed to fetch progress', 500, error?.message)
  }
}

/**
 * POST /api/tiktok/jobs/progress
 * Update progress for a job (used by video generator)
 *
 * Body:
 * - jobId: Job ID to update
 * - progress: Progress percentage (0-100)
 * - progressStep: Current step description
 */
export async function POST(request: NextRequest) {
  try {
    let body: { jobId?: string; progress?: number; progressStep?: string }
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 400)
    }

    const { jobId, progress, progressStep } = body

    if (!jobId) {
      return errorResponse('Missing jobId', 400)
    }

    // Validate progress range
    const validProgress = progress !== undefined
      ? Math.min(100, Math.max(0, progress))
      : undefined

    const job = await prisma.tikTokJob.update({
      where: { id: jobId },
      data: {
        ...(validProgress !== undefined && { progress: validProgress }),
        ...(progressStep && { progressStep }),
      },
      select: {
        id: true,
        progress: true,
        progressStep: true,
        status: true,
      },
    })

    return successResponse(job)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return errorResponse('Job not found', 404)
    }
    tikTokLogger.error('Failed to update progress', error)
    return errorResponse('Failed to update progress', 500, error?.message)
  }
}
