import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_TEMPLATES = [
  // Opening hooks
  {
    name: 'ถามปัญหา',
    category: 'ทั่วไป',
    hookType: 'opening',
    template: 'เคยเจอปัญหา{problem}ไหม? วันนี้มีทางออกให้แล้ว!',
  },
  {
    name: 'ช็อคราคา',
    category: 'Flash Sale',
    hookType: 'opening',
    template: 'ลดราคาแรงมาก! {productName} ลดเหลือแค่นี้!',
  },
  {
    name: 'เปิดตัวสินค้า',
    category: 'สินค้าใหม่',
    hookType: 'opening',
    template: 'สินค้าใหม่ล่าสุด! {productName} ที่ทุกคนรอคอย',
  },
  {
    name: 'รีวิวจริง',
    category: 'รีวิว',
    hookType: 'opening',
    template: 'ใช้มาแล้ว! รีวิว {productName} ตรงๆ ไม่มีกั๊ก',
  },
  {
    name: 'ความลับ',
    category: 'ทั่วไป',
    hookType: 'opening',
    template: 'ความลับที่คนขายไม่บอก! {productName} ตัวนี้...',
  },

  // Middle hooks
  {
    name: 'คุณสมบัติเด่น',
    category: 'ทั่วไป',
    hookType: 'middle',
    template: 'จุดเด่นคือ {feature1} และ {feature2} ที่หาไม่ได้จากที่อื่น',
  },
  {
    name: 'เปรียบเทียบ',
    category: 'ทั่วไป',
    hookType: 'middle',
    template: 'เทียบกับแบรนด์อื่น ตัวนี้ดีกว่าตรงที่ {advantage}',
  },
  {
    name: 'วิธีใช้',
    category: 'Tutorial',
    hookType: 'middle',
    template: 'วิธีใช้ง่ายมาก แค่ {step1} แล้วก็ {step2} เสร็จ!',
  },
  {
    name: 'ประสบการณ์จริง',
    category: 'รีวิว',
    hookType: 'middle',
    template: 'ใช้มา {duration} รู้สึกว่า {feeling} มากจริงๆ',
  },

  // Closing hooks
  {
    name: 'สรุปดี',
    category: 'ทั่วไป',
    hookType: 'closing',
    template: 'สรุปคือ {productName} คุ้มค่ามากสำหรับ {targetAudience}',
  },
  {
    name: 'แนะนำคนที่ควรซื้อ',
    category: 'ทั่วไป',
    hookType: 'closing',
    template: 'เหมาะมากสำหรับคนที่ {targetNeed} ต้องลอง!',
  },
  {
    name: 'ข้อเสียน้อย',
    category: 'รีวิว',
    hookType: 'closing',
    template: 'ข้อเสียมีนิดเดียวคือ {con} แต่เทียบกับข้อดีแล้วคุ้มมาก',
  },

  // Ending (CTA)
  {
    name: 'ซื้อเลย',
    category: 'ทั่วไป',
    hookType: 'ending',
    template: 'กดตะกร้าสีเหลืองเลย! สินค้ามีจำกัด',
  },
  {
    name: 'Flash Sale',
    category: 'Flash Sale',
    hookType: 'ending',
    template: 'รีบกดซื้อก่อนหมดเวลา Flash Sale! ลิงก์อยู่ตะกร้าเหลือง',
  },
  {
    name: 'ส่งฟรี',
    category: 'โปรโมชั่น',
    hookType: 'ending',
    template: 'วันนี้ส่งฟรี! กดตะกร้าเหลืองด้านล่างได้เลย',
  },
  {
    name: 'Follow รับส่วนลด',
    category: 'โปรโมชั่น',
    hookType: 'ending',
    template: 'Follow แล้วกดตะกร้าเหลือง รับส่วนลดเพิ่มอีก!',
  },
  {
    name: 'ถามตอบ',
    category: 'ทั่วไป',
    hookType: 'ending',
    template: 'สนใจกดตะกร้าเหลือง สงสัยอะไรคอมเมนท์ถามได้เลย!',
  },
]

// POST /api/tiktok/templates/seed - Seed default templates
export async function POST(request: NextRequest) {
  try {
    // Check if templates already exist
    const existingCount = await prisma.tikTokHookTemplate.count()

    if (existingCount > 0) {
      return NextResponse.json({
        message: 'Templates already exist',
        count: existingCount,
      })
    }

    // Create all templates
    const created = await prisma.tikTokHookTemplate.createMany({
      data: DEFAULT_TEMPLATES,
    })

    return NextResponse.json({
      message: 'Templates seeded successfully',
      count: created.count,
    })
  } catch (error: any) {
    console.error('Failed to seed templates:', error)
    return NextResponse.json(
      { error: 'Failed to seed templates', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/tiktok/templates/seed - Check seed status
export async function GET(request: NextRequest) {
  try {
    const count = await prisma.tikTokHookTemplate.count()
    return NextResponse.json({
      seeded: count > 0,
      count,
      availableTemplates: DEFAULT_TEMPLATES.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to check seed status', details: error.message },
      { status: 500 }
    )
  }
}
