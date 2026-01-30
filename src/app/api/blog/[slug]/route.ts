import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// GET - Get single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const post = await prisma.blogPost.findUnique({
    where: { slug },
  })

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Increment view count
  await prisma.blogPost.update({
    where: { slug },
    data: { views: { increment: 1 } },
  })

  return NextResponse.json(post)
}

// PUT - Update blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  const { slug } = await params

  try {
    const body = await request.json()
    const { title, excerpt, content, coverImage, published, featured, tags, metaTitle, metaDesc } = body

    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const post = await prisma.blogPost.update({
      where: { slug },
      data: {
        title,
        excerpt,
        content,
        coverImage,
        published,
        featured,
        tags: tags || [],
        metaTitle,
        metaDesc,
        publishedAt: published && !existingPost.publishedAt ? new Date() : existingPost.publishedAt,
      },
    })

    revalidatePath('/blog')
    revalidatePath(`/blog/${slug}`)

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

// DELETE - Delete blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  const { slug } = await params

  try {
    await prisma.blogPost.delete({
      where: { slug },
    })

    revalidatePath('/blog')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}
