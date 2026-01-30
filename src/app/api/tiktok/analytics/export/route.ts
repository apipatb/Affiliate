import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tiktok/analytics/export - Export analytics as CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'
    const format = searchParams.get('format') || 'csv'

    // Calculate date range
    let startDate: Date | undefined
    const now = new Date()

    if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const dateFilter = startDate ? { createdAt: { gte: startDate } } : {}

    // Fetch all jobs for the period
    const jobs = await prisma.tikTokJob.findMany({
      where: dateFilter,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        productId: true,
        productName: true,
        status: true,
        videoUrl: true,
        hook1: true,
        hook2: true,
        hook3: true,
        ending: true,
        caption: true,
        hashtags: true,
        scheduledAt: true,
        postedAt: true,
        error: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Get summary stats
    const summary = {
      totalJobs: jobs.length,
      pending: jobs.filter((j: any) => j.status === 'PENDING').length,
      processing: jobs.filter((j: any) => j.status === 'PROCESSING').length,
      done: jobs.filter((j: any) => j.status === 'DONE').length,
      failed: jobs.filter((j: any) => j.status === 'FAILED').length,
      withVideo: jobs.filter((j: any) => j.videoUrl).length,
      scheduled: jobs.filter((j: any) => j.scheduledAt).length,
      posted: jobs.filter((j: any) => j.postedAt).length,
    }

    // Platform distribution
    const platforms: Record<string, number> = { SHOPEE: 0, LAZADA: 0, TIKTOK: 0, AMAZON: 0, OTHER: 0 }
    jobs.forEach((job: any) => {
      const pid = job.productId || ''
      if (pid.includes('SHOPEE')) platforms.SHOPEE++
      else if (pid.includes('LAZADA')) platforms.LAZADA++
      else if (pid.includes('TIKTOK')) platforms.TIKTOK++
      else if (pid.includes('AMAZON')) platforms.AMAZON++
      else platforms.OTHER++
    })

    if (format === 'json') {
      return NextResponse.json({
        exportDate: now.toISOString(),
        period,
        summary,
        platforms,
        jobs,
      })
    }

    // Generate CSV
    const csvLines: string[] = []

    // Add header with BOM for Excel Thai support
    const BOM = '\uFEFF'

    // Summary section
    csvLines.push('=== สรุปภาพรวม ===')
    csvLines.push(`วันที่ Export,${now.toLocaleString('th-TH')}`)
    csvLines.push(`ช่วงเวลา,${period === '7d' ? '7 วันล่าสุด' : period === '30d' ? '30 วันล่าสุด' : 'ทั้งหมด'}`)
    csvLines.push('')
    csvLines.push('สถานะ,จำนวน')
    csvLines.push(`ทั้งหมด,${summary.totalJobs}`)
    csvLines.push(`รอดำเนินการ,${summary.pending}`)
    csvLines.push(`กำลังประมวลผล,${summary.processing}`)
    csvLines.push(`สำเร็จ,${summary.done}`)
    csvLines.push(`ล้มเหลว,${summary.failed}`)
    csvLines.push(`มีวิดีโอ,${summary.withVideo}`)
    csvLines.push(`ตั้งเวลาโพสต์,${summary.scheduled}`)
    csvLines.push(`โพสต์แล้ว,${summary.posted}`)
    csvLines.push('')

    // Platform section
    csvLines.push('=== แหล่งที่มา ===')
    csvLines.push('แพลตฟอร์ม,จำนวน')
    Object.entries(platforms).forEach(([platform, count]) => {
      csvLines.push(`${platform},${count}`)
    })
    csvLines.push('')

    // Jobs detail section
    csvLines.push('=== รายละเอียดงาน ===')
    const headers = [
      'ID', 'Product ID', 'ชื่อสินค้า', 'สถานะ',
      'Hook 1', 'Hook 2', 'Hook 3', 'Ending',
      'Caption', 'Hashtags', 'มีวิดีโอ',
      'ตั้งเวลาโพสต์', 'โพสต์แล้ว', 'Error',
      'วันที่สร้าง', 'วันที่อัพเดท'
    ]
    csvLines.push(headers.join(','))

    jobs.forEach((job: any) => {
      const row = [
        escapeCSV(job.id),
        escapeCSV(job.productId || ''),
        escapeCSV(job.productName || ''),
        escapeCSV(job.status),
        escapeCSV(job.hook1 || ''),
        escapeCSV(job.hook2 || ''),
        escapeCSV(job.hook3 || ''),
        escapeCSV(job.ending || ''),
        escapeCSV(job.caption || ''),
        escapeCSV(job.hashtags?.join(' ') || ''),
        job.videoUrl ? 'ใช่' : 'ไม่',
        job.scheduledAt ? new Date(job.scheduledAt).toLocaleString('th-TH') : '-',
        job.postedAt ? new Date(job.postedAt).toLocaleString('th-TH') : '-',
        escapeCSV(job.error || ''),
        new Date(job.createdAt).toLocaleString('th-TH'),
        new Date(job.updatedAt).toLocaleString('th-TH'),
      ]
      csvLines.push(row.join(','))
    })

    const csvContent = BOM + csvLines.join('\n')
    const filename = `tiktok-analytics-${period}-${now.toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export analytics', details: error.message },
      { status: 500 }
    )
  }
}

// Helper to escape CSV values
function escapeCSV(value: string): string {
  if (!value) return ''
  // If contains comma, newline, or quotes, wrap in quotes and escape existing quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
