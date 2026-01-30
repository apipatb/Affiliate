import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tiktok/templates - List all templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hookType = searchParams.get('hookType')
    const category = searchParams.get('category')

    const where: any = { isActive: true }
    if (hookType) where.hookType = hookType
    if (category) where.category = category

    const templates = await prisma.tikTokHookTemplate.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(templates)
  } catch (error: any) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/tiktok/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, hookType, template } = body

    if (!name || !hookType || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: name, hookType, template' },
        { status: 400 }
      )
    }

    const newTemplate = await prisma.tikTokHookTemplate.create({
      data: {
        name,
        category: category || null,
        hookType,
        template,
      },
    })

    return NextResponse.json(newTemplate, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create template:', error)
    return NextResponse.json(
      { error: 'Failed to create template', details: error.message },
      { status: 500 }
    )
  }
}
