import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Eye, Tag } from 'lucide-react'
import { Metadata } from 'next'
import AdBanner from '@/components/AdBanner'

export const metadata: Metadata = {
  title: 'บทความ - กอล์ฟรีวิว',
  description: 'อ่านบทความรีวิวสินค้า เคล็ดลับการช้อปปิ้ง และ Top 10 สินค้าแนะนำ',
}

export const dynamic = 'force-dynamic'

async function getBlogPosts() {
  try {
    const posts = await (prisma as any).blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    })
    return posts
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }
}

async function getFeaturedPosts() {
  try {
    const posts = await (prisma as any).blogPost.findMany({
      where: { published: true, featured: true },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    })
    return posts
  } catch (error) {
    return []
  }
}

export default async function BlogPage() {
  const [posts, featuredPosts] = await Promise.all([
    getBlogPosts(),
    getFeaturedPosts(),
  ])

  return (
    <div className="py-12 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 text-black dark:text-white">บทความและรีวิว</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            เคล็ดลับการช้อปปิ้ง รีวิวสินค้ายอดนิยม และ Top 10 สินค้าแนะนำจากทีมงาน
          </p>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-black dark:text-white">บทความแนะนำ</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredPosts.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-gradient-to-br from-primary/10 to-blue-500/10 dark:from-primary/20 dark:to-blue-500/20 rounded-2xl overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-all"
                >
                  {post.coverImage && (
                    <div className="aspect-video relative overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2 text-black dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.publishedAt).toLocaleDateString('th-TH')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.views}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Ad Banner */}
        <div className="mb-12">
          <AdBanner slot="blog-top" format="horizontal" />
        </div>

        {/* All Posts */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 text-black dark:text-white">บทความทั้งหมด</h2>

            {posts.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <p className="text-slate-600 dark:text-slate-400">ยังไม่มีบทความ</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post: any) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group flex gap-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all"
                  >
                    {post.coverImage && (
                      <div className="w-48 flex-shrink-0 relative">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4 flex-1">
                      <h3 className="font-bold text-lg mb-2 text-black dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.publishedAt || post.createdAt).toLocaleDateString('th-TH')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.views} views
                        </span>
                      </div>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {post.tags.slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <AdBanner slot="blog-sidebar" format="rectangle" />

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4 text-black dark:text-white">หมวดหมู่บทความ</h3>
              <div className="space-y-2">
                {['รีวิวสินค้า', 'Top 10', 'เคล็ดลับ', 'โปรโมชั่น', 'เปรียบเทียบ'].map((cat) => (
                  <Link
                    key={cat}
                    href={`/blog?tag=${encodeURIComponent(cat)}`}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                  >
                    <Tag className="w-4 h-4" />
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
