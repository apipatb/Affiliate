import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

interface GenerateHooksRequest {
  productName: string
  productDescription?: string
  category?: string
}

interface HooksResponse {
  hook1: string // Opening hook
  hook2: string // Middle hook
  hook3: string // Closing hook
  ending: string // CTA ending
  caption: string // Video caption
  hashtags: string[]
}

export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      )
    }

    const body: GenerateHooksRequest = await request.json()
    const { productName, productDescription, category } = body

    if (!productName) {
      return NextResponse.json(
        { error: 'productName is required' },
        { status: 400 }
      )
    }

    const prompt = `สร้าง TikTok video hooks สำหรับขายสินค้า ภาษาไทย ให้ดึงดูดและกระตุ้นให้คนอยากซื้อ

สินค้า: ${productName}
${productDescription ? `รายละเอียด: ${productDescription}` : ''}
${category ? `หมวดหมู่: ${category}` : ''}

กรุณาสร้าง:
1. hook1 (เปิด): ประโยคเปิดที่ดึงดูดความสนใจ ทำให้คนหยุดดู (10-15 คำ)
2. hook2 (กลาง): อธิบายจุดเด่น/ประโยชน์ของสินค้า (15-20 คำ)
3. hook3 (ปิด): สร้าง FOMO หรือความเร่งด่วน (10-15 คำ)
4. ending (CTA): Call to action ให้กดซื้อ (5-10 คำ)
5. caption: คำอธิบายวิดีโอสั้นๆ (20-30 คำ)
6. hashtags: 5-8 hashtags ที่เกี่ยวข้อง

ตอบเป็น JSON format เท่านั้น ไม่ต้องมี markdown:
{"hook1": "...", "hook2": "...", "hook3": "...", "ending": "...", "caption": "...", "hashtags": ["...", "..."]}`

    // Call Claude API directly using fetch
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
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
        { error: 'Failed to generate hooks', details: errorData },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.content?.[0]?.text

    if (!content) {
      return NextResponse.json(
        { error: 'No content in response' },
        { status: 500 }
      )
    }

    // Parse JSON from response
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const hooks: HooksResponse = JSON.parse(jsonMatch[0])

      return NextResponse.json(hooks)
    } catch (parseError) {
      console.error('Failed to parse hooks JSON:', parseError, content)
      return NextResponse.json(
        { error: 'Failed to parse hooks', raw: content },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Generate hooks error:', error)
    return NextResponse.json(
      { error: 'Failed to generate hooks', details: error?.message },
      { status: 500 }
    )
  }
}
