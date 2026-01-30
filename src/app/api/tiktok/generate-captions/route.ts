import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

interface CaptionVersion {
  style: string
  caption: string
  hashtags: string[]
  tone: string
}

/**
 * POST /api/tiktok/generate-captions
 * Generate multiple caption versions for a product
 */
export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { productName, productDescription, hooks, category, count = 3 } = body

    if (!productName) {
      return NextResponse.json(
        { success: false, error: 'productName is required' },
        { status: 400 }
      )
    }

    const styles = [
      { name: 'viral', description: 'ไวรัล ตื่นเต้น ชวนคลิก', emoji: '🔥' },
      { name: 'professional', description: 'มืออาชีพ น่าเชื่อถือ', emoji: '💼' },
      { name: 'friendly', description: 'เป็นกันเอง น่ารัก', emoji: '💕' },
      { name: 'urgent', description: 'เร่งด่วน ต้องรีบ', emoji: '⏰' },
    ]

    const selectedStyles = styles.slice(0, Math.min(count, 4))

    const prompt = `คุณเป็น TikTok Content Creator มืออาชีพ สร้าง Caption สำหรับวิดีโอรีวิวสินค้า

สินค้า: ${productName}
${productDescription ? `รายละเอียด: ${productDescription}` : ''}
${category ? `หมวดหมู่: ${category}` : ''}
${hooks ? `Hooks ที่ใช้: ${hooks}` : ''}

สร้าง ${selectedStyles.length} เวอร์ชันของ Caption ในสไตล์ต่อไปนี้:
${selectedStyles.map((s, i) => `${i + 1}. ${s.name} - ${s.description}`).join('\n')}

สำหรับแต่ละเวอร์ชัน ให้:
1. Caption (ภาษาไทย, 100-150 ตัวอักษร, ใช้ emoji, ชวนให้คลิกดู)
2. 5-8 Hashtags ที่เกี่ยวข้องและกำลังเป็นที่นิยม (mix ไทย+อังกฤษ)

ตอบในรูปแบบ JSON เท่านั้น ไม่ต้องมี markdown:
{
  "versions": [
    {
      "style": "viral",
      "caption": "...",
      "hashtags": ["#...", "#..."],
      "tone": "ตื่นเต้น เร้าใจ"
    }
  ]
}`

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Claude API error:', errorData)
      return NextResponse.json(
        { success: false, error: 'Failed to generate captions', details: errorData },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.content?.[0]?.text

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'No content in response' },
        { status: 500 }
      )
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: 'Could not parse JSON response', raw: content },
        { status: 500 }
      )
    }

    const result = JSON.parse(jsonMatch[0])

    // Add style metadata
    const versions: CaptionVersion[] = result.versions.map((v: any, i: number) => ({
      ...v,
      emoji: selectedStyles[i]?.emoji || '📝',
      styleDescription: selectedStyles[i]?.description || '',
    }))

    return NextResponse.json({
      success: true,
      versions,
      productName,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Generate captions error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate captions',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/tiktok/generate-captions
 * Get trending hashtags suggestions
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'general'

  // Predefined trending hashtags by category
  const trendingByCategory: Record<string, string[]> = {
    general: [
      '#tiktokshop', '#รีวิว', '#ของดี', '#แนะนำ', '#ดีจริง',
      '#ซื้อเลย', '#ลดราคา', '#โปรโมชั่น', '#shopee', '#lazada',
    ],
    beauty: [
      '#beauty', '#skincare', '#makeup', '#รีวิวสกินแคร์', '#เครื่องสำอาง',
      '#ผิวสวย', '#tiktokbeauty', '#ของมันต้องมี', '#แนะนำเครื่องสำอาง',
    ],
    fashion: [
      '#fashion', '#ootd', '#แฟชั่น', '#เสื้อผ้า', '#รีวิวเสื้อผ้า',
      '#style', '#outfit', '#เดรส', '#กางเกง', '#รองเท้า',
    ],
    tech: [
      '#tech', '#gadget', '#รีวิวเทค', '#ของดีบอกต่อ', '#มือถือ',
      '#หูฟัง', '#smartwatch', '#อุปกรณ์เสริม', '#techreview',
    ],
    food: [
      '#food', '#อาหาร', '#รีวิวอาหาร', '#อร่อย', '#กินอะไรดี',
      '#foodtiktok', '#ของกิน', '#ขนม', '#เครื่องดื่ม',
    ],
    home: [
      '#homedecor', '#ของแต่งบ้าน', '#รีวิวของใช้', '#บ้าน', '#ห้องนอน',
      '#ห้องครัว', '#จัดบ้าน', '#minimalist', '#ikea',
    ],
  }

  const trending = trendingByCategory[category] || trendingByCategory.general

  // Mix with time-based trending tags
  const timeBased = [
    '#viral2024', '#trending', '#fyp', '#foryou', '#foryoupage',
    '#tiktokthailand', '#ติ๊กต๊อก', '#วิดีโอสั้น',
  ]

  return NextResponse.json({
    success: true,
    category,
    trending: [...trending, ...timeBased.slice(0, 5)].slice(0, 15),
    suggestions: {
      hooks: ['รู้หรือเปล่า?', 'อย่าพลาด!', 'ลองแล้วจะติดใจ', 'ของดีต้องบอกต่อ'],
      cta: ['กดลิงก์ในโปรไฟล์เลย', 'Comment ถามได้นะ', 'Follow เพื่อดูรีวิวอื่นๆ'],
    },
  })
}
