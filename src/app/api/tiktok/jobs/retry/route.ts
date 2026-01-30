import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runAutoPipeline } from '@/lib/tiktok-auto-pipeline'

/**
 * POST /api/tiktok/jobs/retry
 * Retry failed jobs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, jobIds, runPipeline = false, maxRetries = 3 } = body

    // Single job retry
    if (jobId) {
      const job = await prisma.tikTokJob.findUnique({
        where: { id: jobId },
      })

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }

      if (job.status !== 'FAILED') {
        return NextResponse.json({ error: 'Job is not in FAILED status' }, { status: 400 })
      }

      if (job.retryCount >= maxRetries) {
        return NextResponse.json(
          { error: `Max retries (${maxRetries}) reached` },
          { status: 400 }
        )
      }

      // Reset job to PENDING status and increment retry count
      const updatedJob = await prisma.tikTokJob.update({
        where: { id: jobId },
        data: {
          status: 'PENDING',
          error: null,
          retryCount: { increment: 1 },
        },
      })

      // Optionally run pipeline immediately
      let pipelineResult = null
      if (runPipeline) {
        pipelineResult = await runAutoPipeline(jobId, {
          generateHooks: !job.hook1,
          generateVideo: !job.videoUrl,
          autoSchedule: true,
        })
      }

      return NextResponse.json({
        success: true,
        message: `Job reset for retry (attempt ${updatedJob.retryCount + 1})`,
        job: updatedJob,
        pipelineResult,
      })
    }

    // Bulk retry
    if (jobIds && Array.isArray(jobIds)) {
      const failedJobs = await prisma.tikTokJob.findMany({
        where: {
          id: { in: jobIds },
          status: 'FAILED',
          retryCount: { lt: maxRetries },
        },
      })

      if (failedJobs.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No eligible jobs to retry',
          retried: 0,
        })
      }

      // Reset all failed jobs
      await prisma.tikTokJob.updateMany({
        where: { id: { in: failedJobs.map(j => j.id) } },
        data: {
          status: 'PENDING',
          error: null,
        },
      })

      // Increment retry count for each
      for (const job of failedJobs) {
        await prisma.tikTokJob.update({
          where: { id: job.id },
          data: { retryCount: { increment: 1 } },
        })
      }

      // Run pipelines if requested
      const pipelineResults = []
      if (runPipeline) {
        for (const job of failedJobs) {
          try {
            const result = await runAutoPipeline(job.id, {
              generateHooks: !job.hook1,
              generateVideo: !job.videoUrl,
              autoSchedule: true,
            })
            pipelineResults.push({ jobId: job.id, ...result })
          } catch (error: any) {
            pipelineResults.push({
              jobId: job.id,
              success: false,
              error: error.message,
            })
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Retried ${failedJobs.length} jobs`,
        retried: failedJobs.length,
        pipelineResults: runPipeline ? pipelineResults : undefined,
      })
    }

    // Retry all failed jobs
    if (body.all === true) {
      const failedJobs = await prisma.tikTokJob.findMany({
        where: {
          status: 'FAILED',
          retryCount: { lt: maxRetries },
        },
        take: body.limit || 10,
      })

      if (failedJobs.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No failed jobs to retry',
          retried: 0,
        })
      }

      // Reset jobs
      for (const job of failedJobs) {
        await prisma.tikTokJob.update({
          where: { id: job.id },
          data: {
            status: 'PENDING',
            error: null,
            retryCount: { increment: 1 },
          },
        })
      }

      return NextResponse.json({
        success: true,
        message: `Queued ${failedJobs.length} jobs for retry`,
        retried: failedJobs.length,
        jobs: failedJobs.map(j => ({
          id: j.id,
          productName: j.productName,
          retryCount: j.retryCount + 1,
        })),
      })
    }

    return NextResponse.json(
      { error: 'Provide jobId, jobIds array, or all: true' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Retry error:', error)
    return NextResponse.json(
      { error: 'Failed to retry', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/tiktok/jobs/retry
 * Get retry statistics
 */
export async function GET() {
  try {
    const [totalFailed, retriable, maxedOut] = await Promise.all([
      prisma.tikTokJob.count({ where: { status: 'FAILED' } }),
      prisma.tikTokJob.count({
        where: { status: 'FAILED', retryCount: { lt: 3 } },
      }),
      prisma.tikTokJob.count({
        where: { status: 'FAILED', retryCount: { gte: 3 } },
      }),
    ])

    const recentFailed = await prisma.tikTokJob.findMany({
      where: { status: 'FAILED' },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        productName: true,
        error: true,
        retryCount: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalFailed,
        retriable,
        maxedOut,
      },
      recentFailed,
    })
  } catch (error: any) {
    console.error('Retry stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get stats', details: error.message },
      { status: 500 }
    )
  }
}
