import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const period = searchParams.get('period') || 'daily' // daily or weekly

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Try to get click logs
    let clickLogs: any[] = []
    try {
      clickLogs = await prisma.clickLog.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        select: {
          createdAt: true,
          platform: true
        },
        orderBy: { createdAt: 'asc' }
      })
    } catch (error) {
      // ClickLog table might not exist yet - return empty data
      console.log('ClickLog table not available yet')
    }

    // Group by date
    const groupedData = new Map<string, { total: number; byPlatform: Record<string, number> }>()

    // Initialize all dates with 0
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateKey = formatDateKey(date, period)
      if (!groupedData.has(dateKey)) {
        groupedData.set(dateKey, { total: 0, byPlatform: {} })
      }
    }

    // Aggregate clicks
    for (const log of clickLogs) {
      const dateKey = formatDateKey(new Date(log.createdAt), period)
      const existing = groupedData.get(dateKey) || { total: 0, byPlatform: {} }
      existing.total++
      existing.byPlatform[log.platform] = (existing.byPlatform[log.platform] || 0) + 1
      groupedData.set(dateKey, existing)
    }

    // Convert to array
    const history = Array.from(groupedData.entries())
      .map(([date, data]) => ({
        date,
        clicks: data.total,
        byPlatform: data.byPlatform
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate totals and trends
    const totalClicks = history.reduce((sum, h) => sum + h.clicks, 0)
    const avgPerDay = days > 0 ? totalClicks / days : 0

    // Compare with previous period
    const midpoint = Math.floor(history.length / 2)
    const firstHalf = history.slice(0, midpoint).reduce((sum, h) => sum + h.clicks, 0)
    const secondHalf = history.slice(midpoint).reduce((sum, h) => sum + h.clicks, 0)
    const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0

    // Get peak day
    const peakDay = history.reduce((max, h) => h.clicks > max.clicks ? h : max, { date: '', clicks: 0 })

    return NextResponse.json({
      history,
      summary: {
        totalClicks,
        avgPerDay: avgPerDay.toFixed(1),
        trend: trend.toFixed(1),
        peakDay: peakDay.date,
        peakClicks: peakDay.clicks,
        period,
        days
      }
    })
  } catch (error) {
    console.error('Error fetching click history:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}

function formatDateKey(date: Date, period: string): string {
  if (period === 'weekly') {
    // Get Monday of the week
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(date)
    monday.setDate(diff)
    return monday.toISOString().split('T')[0]
  }
  return date.toISOString().split('T')[0]
}
