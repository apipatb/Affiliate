import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Curated list of trending TikTok hashtags for Thailand affiliate marketing
const TRENDING_HASHTAGS = {
  general: [
    '#fyp', '#foryou', '#foryoupage', '#viral', '#trending',
    '#tiktokthailand', '#ไทยแลนด์', '#tiktokrecommendation',
  ],
  shopping: [
    '#shopee', '#lazada', '#ช้อปปิ้ง', '#ลดราคา', '#โปรโมชั่น',
    '#ของดี', '#ของถูก', '#รีวิวสินค้า', '#แนะนำสินค้า',
    '#ซื้อดี', '#ของดีบอกต่อ', '#สินค้าดี', '#ราคาถูก',
  ],
  beauty: [
    '#สกินแคร์', '#เครื่องสำอาง', '#บิวตี้', '#makeup',
    '#skincare', '#beauty', '#รีวิวเครื่องสำอาง', '#แต่งหน้า',
    '#ผิวสวย', '#หน้าใส', '#รีวิวสกินแคร์',
  ],
  fashion: [
    '#แฟชั่น', '#เสื้อผ้า', '#ootd', '#outfit', '#style',
    '#fashiontiktok', '#เสื้อผ้าแฟชั่น', '#แฟชั่นเกาหลี',
    '#ลุคนี้ดี', '#ไอเทมเด็ด',
  ],
  food: [
    '#อาหาร', '#กินอะไรดี', '#foodtiktok', '#อร่อย',
    '#รีวิวอาหาร', '#ของกิน', '#อาหารอร่อย', '#กินเที่ยว',
  ],
  tech: [
    '#เทคโนโลยี', '#gadget', '#tech', '#รีวิวมือถือ',
    '#อุปกรณ์ไอที', '#techtok', '#ของเล่นไอที',
  ],
  lifestyle: [
    '#ไลฟ์สไตล์', '#บ้าน', '#homedecor', '#ของใช้ในบ้าน',
    '#จัดบ้าน', '#ไอเดียแต่งบ้าน', '#ของใช้ดี',
  ],
  health: [
    '#สุขภาพ', '#ออกกำลังกาย', '#fitness', '#healthy',
    '#ลดน้ำหนัก', '#อาหารเสริม', '#วิตามิน',
  ],
}

// Categories with Thai labels
const CATEGORIES = [
  { id: 'general', label: 'ทั่วไป', icon: '🔥' },
  { id: 'shopping', label: 'ช้อปปิ้ง', icon: '🛒' },
  { id: 'beauty', label: 'บิวตี้', icon: '💄' },
  { id: 'fashion', label: 'แฟชั่น', icon: '👗' },
  { id: 'food', label: 'อาหาร', icon: '🍜' },
  { id: 'tech', label: 'เทคโนโลยี', icon: '📱' },
  { id: 'lifestyle', label: 'ไลฟ์สไตล์', icon: '🏠' },
  { id: 'health', label: 'สุขภาพ', icon: '💪' },
]

// GET /api/tiktok/trending-hashtags - Get trending hashtags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const limit = parseInt(searchParams.get('limit') || '20')

    let hashtags: string[] = []

    if (category === 'all') {
      // Get random mix from all categories
      const allTags = Object.values(TRENDING_HASHTAGS).flat()
      hashtags = shuffleArray(allTags).slice(0, limit)
    } else if (TRENDING_HASHTAGS[category as keyof typeof TRENDING_HASHTAGS]) {
      hashtags = TRENDING_HASHTAGS[category as keyof typeof TRENDING_HASHTAGS]
      // Always include some general tags
      const generalTags = TRENDING_HASHTAGS.general.slice(0, 3)
      hashtags = [...generalTags, ...hashtags].slice(0, limit)
    } else {
      hashtags = TRENDING_HASHTAGS.general
    }

    // Get most used hashtags from existing jobs
    const jobHashtags = await getMostUsedHashtags(10)

    return NextResponse.json({
      categories: CATEGORIES,
      trending: hashtags.map(tag => ({
        tag,
        category: findCategory(tag),
      })),
      popular: jobHashtags, // Most used in our platform
      suggested: generateSuggestedTags(category),
    })
  } catch (error: any) {
    console.error('Failed to fetch trending hashtags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hashtags', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/tiktok/trending-hashtags - Generate hashtags for product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, category, count = 10 } = body

    if (!productName) {
      return NextResponse.json(
        { error: 'productName is required' },
        { status: 400 }
      )
    }

    // Generate relevant hashtags based on product name and category
    const hashtags: string[] = []

    // Always add general trending tags
    hashtags.push(...TRENDING_HASHTAGS.general.slice(0, 3))

    // Add category-specific tags
    if (category && TRENDING_HASHTAGS[category as keyof typeof TRENDING_HASHTAGS]) {
      hashtags.push(...TRENDING_HASHTAGS[category as keyof typeof TRENDING_HASHTAGS].slice(0, 4))
    }

    // Add shopping tags
    hashtags.push(...TRENDING_HASHTAGS.shopping.slice(0, 3))

    // Generate product-specific tags
    const productTags = generateProductTags(productName)
    hashtags.push(...productTags)

    // Remove duplicates and limit
    const uniqueTags = [...new Set(hashtags)].slice(0, count)

    return NextResponse.json({
      hashtags: uniqueTags,
      productName,
      category,
    })
  } catch (error: any) {
    console.error('Failed to generate hashtags:', error)
    return NextResponse.json(
      { error: 'Failed to generate hashtags', details: error.message },
      { status: 500 }
    )
  }
}

// Helper functions
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function findCategory(tag: string): string {
  for (const [cat, tags] of Object.entries(TRENDING_HASHTAGS)) {
    if (tags.includes(tag)) return cat
  }
  return 'general'
}

async function getMostUsedHashtags(limit: number): Promise<{ tag: string; count: number }[]> {
  try {
    const jobs = await prisma.tikTokJob.findMany({
      where: {
        hashtags: { isEmpty: false },
      },
      select: { hashtags: true },
      take: 100,
    })

    const tagCounts: Record<string, number> = {}
    jobs.forEach((job: any) => {
      if (job.hashtags && Array.isArray(job.hashtags)) {
        job.hashtags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })

    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }))
  } catch (e) {
    return []
  }
}

function generateSuggestedTags(category: string): string[] {
  const suggestions = [
    '#รีวิว', '#ของดีต้องบอกต่อ', '#ลองแล้วชอบ',
    '#แนะนำเลย', '#ต้องมี', '#ถูกและดี',
  ]
  return shuffleArray(suggestions).slice(0, 5)
}

function generateProductTags(productName: string): string[] {
  const tags: string[] = []

  // Convert product name to potential hashtags
  const words = productName.toLowerCase().split(/\s+/)

  // Check for common keywords and map to hashtags
  const keywordMappings: Record<string, string[]> = {
    'เครื่องสำอาง': ['#makeup', '#บิวตี้'],
    'สกินแคร์': ['#skincare', '#ผิวสวย'],
    'ครีม': ['#สกินแคร์', '#ผิวใส'],
    'เสื้อ': ['#แฟชั่น', '#เสื้อผ้า'],
    'กระเป๋า': ['#กระเป๋า', '#แฟชั่น'],
    'รองเท้า': ['#รองเท้า', '#shoes'],
    'มือถือ': ['#smartphone', '#เทคโนโลยี'],
    'หูฟัง': ['#หูฟัง', '#gadget'],
    'อาหาร': ['#อาหาร', '#foodtiktok'],
    'ขนม': ['#ขนม', '#ของกิน'],
  }

  for (const [keyword, mappedTags] of Object.entries(keywordMappings)) {
    if (productName.includes(keyword)) {
      tags.push(...mappedTags)
    }
  }

  return [...new Set(tags)]
}
