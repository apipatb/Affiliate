import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tiktok/analytics - Get TikTok jobs analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d' // 7d, 30d, all

    // Calculate date range
    let startDate: Date | undefined
    const now = new Date()

    if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const dateFilter = startDate ? { createdAt: { gte: startDate } } : {}

    // Get total counts by status
    const [totalJobs, statusCounts, recentJobs, dailyStats] = await Promise.all([
      // Total jobs
      prisma.tikTokJob.count({
        where: dateFilter,
      }),

      // Group by status
      prisma.tikTokJob.groupBy({
        by: ['status'],
        _count: { status: true },
        where: dateFilter,
      }),

      // Recent jobs (last 10)
      prisma.tikTokJob.findMany({
        where: dateFilter,
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          productName: true,
          status: true,
          videoUrl: true,
          createdAt: true,
          updatedAt: true,
          postedAt: true,
        },
      }),

      // Daily job creation stats (last 7 days for chart)
      getDailyStats(),
    ])

    // Process status counts
    const statusMap: Record<string, number> = {
      PENDING: 0,
      PROCESSING: 0,
      DONE: 0,
      FAILED: 0,
    }
    statusCounts.forEach((item: any) => {
      statusMap[item.status] = item._count.status
    })

    // Calculate success rate
    const completedJobs = statusMap.DONE + statusMap.FAILED
    const successRate = completedJobs > 0
      ? Math.round((statusMap.DONE / completedJobs) * 100)
      : 0

    // Get platform distribution
    const platformStats = await getPlatformStats(dateFilter)

    // Get average processing time for completed jobs
    const avgProcessingTime = await getAverageProcessingTime(dateFilter)

    // Get hook usage stats
    const hookStats = await getHookStats(dateFilter)

    return NextResponse.json({
      period,
      overview: {
        totalJobs,
        pending: statusMap.PENDING,
        processing: statusMap.PROCESSING,
        done: statusMap.DONE,
        failed: statusMap.FAILED,
        successRate,
        withVideo: statusMap.DONE, // Jobs with generated video
      },
      platformStats,
      dailyStats,
      avgProcessingTime,
      hookStats,
      recentJobs,
    })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    )
  }
}

// Get daily stats for chart
async function getDailyStats() {
  const days = 7
  const now = new Date()
  const stats = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    const [created, completed, failed] = await Promise.all([
      prisma.tikTokJob.count({
        where: {
          createdAt: { gte: startOfDay, lt: endOfDay },
        },
      }),
      prisma.tikTokJob.count({
        where: {
          updatedAt: { gte: startOfDay, lt: endOfDay },
          status: 'DONE',
        },
      }),
      prisma.tikTokJob.count({
        where: {
          updatedAt: { gte: startOfDay, lt: endOfDay },
          status: 'FAILED',
        },
      }),
    ])

    stats.push({
      date: startOfDay.toISOString().split('T')[0],
      dayLabel: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][startOfDay.getDay()],
      created,
      completed,
      failed,
    })
  }

  return stats
}

// Get platform distribution
async function getPlatformStats(dateFilter: any) {
  const jobs = await prisma.tikTokJob.findMany({
    where: dateFilter,
    select: { productId: true, affiliateUrl: true },
  })

  const platforms: Record<string, number> = {
    SHOPEE: 0,
    LAZADA: 0,
    TIKTOK: 0,
    AMAZON: 0,
    OTHER: 0,
  }

  jobs.forEach((job: any) => {
    const url = job.affiliateUrl || ''
    const pid = job.productId || ''

    if (url.includes('shopee') || pid.includes('SHOPEE')) platforms.SHOPEE++
    else if (url.includes('lazada') || pid.includes('LAZADA')) platforms.LAZADA++
    else if (url.includes('tiktok') || pid.includes('TIKTOK')) platforms.TIKTOK++
    else if (url.includes('amazon') || pid.includes('AMAZON')) platforms.AMAZON++
    else platforms.OTHER++
  })

  return Object.entries(platforms).map(([platform, count]) => ({
    platform,
    count,
    percentage: jobs.length > 0 ? Math.round((count / jobs.length) * 100) : 0,
  }))
}

// Get average processing time
async function getAverageProcessingTime(dateFilter: any) {
  const completedJobs = await prisma.tikTokJob.findMany({
    where: {
      ...dateFilter,
      status: 'DONE',
      videoUrl: { not: null },
    },
    select: {
      createdAt: true,
      updatedAt: true,
    },
  })

  if (completedJobs.length === 0) return null

  let totalSeconds = 0
  completedJobs.forEach((job: any) => {
    const created = new Date(job.createdAt).getTime()
    const updated = new Date(job.updatedAt).getTime()
    totalSeconds += (updated - created) / 1000
  })

  const avgSeconds = Math.round(totalSeconds / completedJobs.length)

  return {
    avgSeconds,
    avgMinutes: Math.round(avgSeconds / 60 * 10) / 10,
    formatted: avgSeconds < 60
      ? `${avgSeconds} วินาที`
      : `${Math.floor(avgSeconds / 60)} นาที ${avgSeconds % 60} วินาที`,
    sampleSize: completedJobs.length,
  }
}

// Get hook usage stats
async function getHookStats(dateFilter: any) {
  const jobs = await prisma.tikTokJob.findMany({
    where: dateFilter,
    select: {
      hook1: true,
      hook2: true,
      hook3: true,
      ending: true,
    },
  })

  const stats = {
    withHook1: 0,
    withHook2: 0,
    withHook3: 0,
    withEnding: 0,
    withAllHooks: 0,
    total: jobs.length,
  }

  jobs.forEach((job: any) => {
    const h1 = job.hook1 && job.hook1.trim()
    const h2 = job.hook2 && job.hook2.trim()
    const h3 = job.hook3 && job.hook3.trim()
    const ending = job.ending && job.ending.trim()

    if (h1) stats.withHook1++
    if (h2) stats.withHook2++
    if (h3) stats.withHook3++
    if (ending) stats.withEnding++
    if (h1 && h2 && h3 && ending) stats.withAllHooks++
  })

  return stats
}
