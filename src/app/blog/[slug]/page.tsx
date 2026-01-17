import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Eye, Tag, ArrowLeft, Share2 } from 'lucide-react'
import { Metadata } from 'next'
import AdBanner from '@/components/AdBanner'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getBlogPost(slug: string) {
  try {
    const post = await (prisma as any).blogPost.findUnique({
      where: { slug, published: true },
    })
    return post
  } catch (error) {
    return null
  }
}

async function getRelatedPosts(tags: string[], currentSlug: string) {
  try {
    if (!tags || tags.length === 0) return []
    const posts = await (prisma as any).blogPost.findMany({
      where: {
        published: true,
        slug: { not: currentSlug },
        tags: { hasSome: tags },
      },
      take: 3,
      orderBy: { views: 'desc' },
    })
    return posts
  } catch (error) {
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    return { title: 'ไม่พบบทความ' }
  }

  return {
    title: post.metaTitle || `${post.title} - กอล์ฟรีวิว`,
    description: post.metaDesc || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    notFound()
  }

  // Increment view count
  try {
    await (prisma as any).blogPost.update({
      where: { slug },
      data: { views: { increment: 1 } },
    })
  } catch (error) {
    // Ignore view count errors
  }

  const relatedPosts = await getRelatedPosts(post.tags || [], slug)

  return (
    <div className="py-12 bg-white dark:bg-slate-900">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไปหน้าบทความ
        </Link>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-white">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-6">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(post.publishedAt || post.createdAt).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {post.views} views
            </span>
            <span>โดย {post.author}</span>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
                >
                  <Tag className="w-3 h-3 inline mr-1" />
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="relative aspect-video mb-8 rounded-2xl overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Ad */}
        <div className="mb-8">
          <AdBanner slot="blog-content-top" format="horizontal" />
        </div>

        {/* Content */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none mb-12
            prose-headings:text-black dark:prose-headings:text-white
            prose-p:text-slate-700 dark:prose-p:text-slate-300
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Share */}
        <div className="flex items-center gap-4 py-6 border-t border-b border-slate-200 dark:border-slate-700 mb-12">
          <span className="font-medium text-black dark:text-white">แชร์บทความ:</span>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Facebook
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(post.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
          >
            Twitter
          </a>
          <a
            href={`https://line.me/R/msg/text/?${encodeURIComponent(post.title + ' ' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            LINE
          </a>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-black dark:text-white">บทความที่เกี่ยวข้อง</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((related: any) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="group bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                >
                  {related.coverImage && (
                    <div className="aspect-video relative">
                      <Image
                        src={related.coverImage}
                        alt={related.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-black dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Ad */}
        <AdBanner slot="blog-content-bottom" format="horizontal" />
      </article>
    </div>
  )
}
