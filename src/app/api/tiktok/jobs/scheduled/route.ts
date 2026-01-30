import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tiktok/jobs/scheduled - Get all scheduled jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const upcoming = searchParams.get('upcoming') === 'true'

    const now = new Date()

    const jobs = await prisma.tikTokJob.findMany({
      where: {
        scheduledAt: upcoming
          ? { gte: now } // Only future scheduled jobs
          : { not: null }, // All scheduled jobs
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      orderBy: { scheduledAt: 'asc' },
      select: {
        id: true,
        productName: true,
        productImage: true,
        videoUrl: true,
        scheduledAt: true,
        status: true,
        caption: true,
        hashtags: true,
        createdAt: true,
      },
    })

    // Group by date for calendar view
    const grouped: Record<string, any[]> = {}
    jobs.forEach((job: any) => {
      if (job.scheduledAt) {
        const dateKey = new Date(job.scheduledAt).toISOString().split('T')[0]
        if (!grouped[dateKey]) grouped[dateKey] = []
        grouped[dateKey].push(job)
      }
    })

    return NextResponse.json({
      jobs,
      grouped,
      total: jobs.length,
      upcomingToday: jobs.filter((j: any) => {
        const scheduled = new Date(j.scheduledAt)
        return scheduled.toDateString() === now.toDateString()
      }).length,
    })
  } catch (error: any) {
    console.error('Failed to fetch scheduled jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled jobs', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/tiktok/jobs/scheduled - Schedule a job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, scheduledAt } = body

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      )
    }

    // Validate scheduled time is in the future
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt)
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        )
      }
    }

    const job = await prisma.tikTokJob.update({
      where: { id: jobId },
      data: {
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    })

    return NextResponse.json({
      success: true,
      message: scheduledAt ? 'Job scheduled successfully' : 'Schedule removed',
      job: {
        id: job.id,
        scheduledAt: job.scheduledAt,
      },
    })
  } catch (error: any) {
    console.error('Failed to schedule job:', error)
    return NextResponse.json(
      { error: 'Failed to schedule job', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/tiktok/jobs/scheduled - Remove schedule from job
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      )
    }

    const job = await prisma.tikTokJob.update({
      where: { id: jobId },
      data: { scheduledAt: null },
    })

    return NextResponse.json({
      success: true,
      message: 'Schedule removed',
      job: { id: job.id },
    })
  } catch (error: any) {
    console.error('Failed to remove schedule:', error)
    return NextResponse.json(
      { error: 'Failed to remove schedule', details: error.message },
      { status: 500 }
    )
  }
}
