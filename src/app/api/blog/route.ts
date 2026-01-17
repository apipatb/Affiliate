import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// GET - List blog posts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const published = searchParams.get('published')
  const featured = searchParams.get('featured')
  const tag = searchParams.get('tag')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'))
  const skip = (page - 1) * limit

  const where: any = {}

  // Only show published posts for public requests
  if (published === 'true') {
    where.published = true
  } else if (published === 'false') {
    where.published = false
  }

  if (featured === 'true') {
    where.featured = true
  }

  if (tag) {
    where.tags = { has: tag }
  }

  const [posts, total] = await Promise.all([
    (prisma as any).blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    (prisma as any).blogPost.count({ where }),
  ])

  return NextResponse.json({
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

// POST - Create blog post (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  try {
    const body = await request.json()
    const { title, excerpt, content, coverImage, published, featured, tags, metaTitle, metaDesc } = body

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() + '-' + Date.now().toString(36)

    const post = await (prisma as any).blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        published: published || false,
        featured: featured || false,
        tags: tags || [],
        metaTitle,
        metaDesc,
        publishedAt: published ? new Date() : null,
      },
    })

    revalidatePath('/blog')
    revalidatePath('/')

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}
