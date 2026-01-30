import { NextRequest, NextResponse } from 'next/server'
import { getSchedulerStats, cancelScheduledJob, rescheduleFailedJob } from '@/lib/tiktok-scheduler'

/**
 * GET /api/tiktok/scheduler
 * Get scheduler statistics
 */
export async function GET() {
  try {
    const stats = await getSchedulerStats()

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Failed to get scheduler stats:', error)
    return NextResponse.json(
      { error: 'Failed to get scheduler stats', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tiktok/scheduler
 * Scheduler actions (cancel, reschedule)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, jobId, scheduledAt } = body

    if (!action || !jobId) {
      return NextResponse.json(
        { error: 'action and jobId are required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'cancel':
        await cancelScheduledJob(jobId)
        return NextResponse.json({
          success: true,
          message: 'Schedule cancelled',
          jobId,
        })

      case 'reschedule':
        if (!scheduledAt) {
          return NextResponse.json(
            { error: 'scheduledAt is required for reschedule action' },
            { status: 400 }
          )
        }
        await rescheduleFailedJob(jobId, new Date(scheduledAt))
        return NextResponse.json({
          success: true,
          message: 'Job rescheduled',
          jobId,
          scheduledAt,
        })

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Scheduler action failed:', error)
    return NextResponse.json(
      { error: 'Action failed', details: error.message },
      { status: 500 }
    )
  }
}
