import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface CSVRow {
  productId?: string
  productName?: string
  productImage?: string
  affiliateUrl?: string
  hook1?: string
  hook2?: string
  hook3?: string
  ending?: string
  caption?: string
  hashtags?: string
}

// POST /api/tiktok/jobs/import-csv - Import jobs from CSV data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rows, autoGenerateHooks } = body as { rows: CSVRow[], autoGenerateHooks?: boolean }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows provided' },
        { status: 400 }
      )
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const row of rows) {
      try {
        // Validate required fields
        if (!row.productId && !row.productName) {
          results.failed++
          results.errors.push(`Row missing productId or productName`)
          continue
        }

        // Generate hooks if requested and not provided
        let hooks: any = {}
        if (autoGenerateHooks && row.productName && (!row.hook1 || row.hook1.trim() === '')) {
          try {
            const hooksRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tiktok/generate-hooks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productName: row.productName }),
            })
            if (hooksRes.ok) {
              hooks = await hooksRes.json()
            }
          } catch (e) {
            console.log('Could not generate hooks for:', row.productName)
          }
        }

        // Parse hashtags
        let hashtags: string[] = []
        if (row.hashtags) {
          hashtags = row.hashtags
            .split(/[,\s]+/)
            .filter(Boolean)
            .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
        }

        // Detect platform from URL or productId
        let platform = 'OTHER'
        const url = row.affiliateUrl || ''
        const pid = row.productId || ''
        if (url.includes('shopee') || pid.includes('SHOPEE')) platform = 'SHOPEE'
        else if (url.includes('lazada') || pid.includes('LAZADA')) platform = 'LAZADA'
        else if (url.includes('tiktok') || pid.includes('TIKTOK')) platform = 'TIKTOK'
        else if (url.includes('amazon') || pid.includes('AMAZON')) platform = 'AMAZON'

        // Create job
        await prisma.tikTokJob.create({
          data: {
            productId: row.productId || `${platform}-${Date.now()}-${results.success}`,
            productName: row.productName || null,
            productImage: row.productImage || null,
            affiliateUrl: row.affiliateUrl || null,
            hook1: row.hook1 || hooks.hook1 || null,
            hook2: row.hook2 || hooks.hook2 || null,
            hook3: row.hook3 || hooks.hook3 || null,
            ending: row.ending || hooks.ending || null,
            caption: row.caption || hooks.caption || null,
            hashtags: hashtags.length > 0 ? hashtags : (hooks.hashtags || []),
            status: 'PENDING',
          },
        })

        results.success++
      } catch (e: any) {
        results.failed++
        results.errors.push(`${row.productName || row.productId}: ${e.message}`)
      }
    }

    return NextResponse.json({
      message: `Imported ${results.success} jobs successfully`,
      ...results,
    })
  } catch (error: any) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      { error: 'Failed to import CSV', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/tiktok/jobs/import-csv - Get CSV template
export async function GET() {
  const template = `productId,productName,productImage,affiliateUrl,hook1,hook2,hook3,ending,caption,hashtags
SHOPEE-123456,สินค้าตัวอย่าง,https://example.com/image.jpg,https://shopee.co.th/xxx,Hook เปิด,Hook กลาง,Hook ปิด,CTA,Caption สำหรับโพสต์,"#สินค้าดี #ราคาถูก"
,สินค้าที่ 2 (ไม่มี ID),https://example.com/image2.jpg,,,,,,,`

  return new NextResponse(template, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="tiktok-jobs-template.csv"',
    },
  })
}
