import { prisma } from '@/lib/prisma'
import { Package, FolderOpen, MousePointerClick, TrendingUp, Star, Clock, Store, Download } from 'lucide-react'
import Link from 'next/link'
import { PLATFORMS } from '@/lib/platforms'

// Make dashboard dynamic to always show fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getStats() {
  const [
    productCount,
    categoryCount,
    totalClicks,
    featuredCount,
    recentProducts,
    categoryStats,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.product.aggregate({
      _sum: { clicks: true },
    }),
    prisma.product.count({ where: { featured: true } }),
    prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    }),
    // Get top categories by product count
    prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: {
        products: { _count: 'desc' },
      },
      take: 5,
    }),
  ])

  // Get product count by platform (with error handling for local dev)
  let platformStats: any[] = []
  try {
    platformStats = await (prisma.product.groupBy as any)({
      by: ['platform'],
      _count: { id: true },
      _sum: { clicks: true },
    })
  } catch (error) {
    console.log('Platform stats not available (Prisma client may need regeneration)')
    // Fallback: count all as SHOPEE
    platformStats = [{ platform: 'SHOPEE', _count: { id: productCount }, _sum: { clicks: totalClicks._sum.clicks || 0 } }]
  }

  const topProducts = await prisma.product.findMany({
    take: 5,
    orderBy: { clicks: 'desc' },
    include: { category: true },
  })

  return {
    productCount,
    categoryCount,
    totalClicks: totalClicks._sum.clicks || 0,
    featuredCount,
    topProducts,
    recentProducts,
    platformStats,
    categoryStats,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-black dark:text-slate-100">แดชบอร์ด</h1>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link
          href="/admin/products"
          className="p-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-center font-medium"
        >
          จัดการสินค้า
        </Link>
        <Link
          href="/admin/bulk-import"
          className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-center font-medium"
        >
          นำเข้าสินค้า
        </Link>
        <Link
          href="/admin/categories"
          className="p-4 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-center font-medium"
        >
          จัดการหมวดหมู่
        </Link>
        <Link
          href="/admin/blog"
          className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-center font-medium"
        >
          จัดการบทความ
        </Link>
        <Link
          href="/admin/tools"
          className="p-4 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-center font-medium"
        >
          เครื่องมือ
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">สินค้าทั้งหมด</p>
              <p className="text-2xl font-bold text-black dark:text-slate-100">{stats.productCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent/10 dark:bg-yellow-400/20 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-accent dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">หมวดหมู่</p>
              <p className="text-2xl font-bold text-black dark:text-slate-100">{stats.categoryCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
              <MousePointerClick className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">คลิกทั้งหมด</p>
              <p className="text-2xl font-bold text-black dark:text-slate-100">{stats.totalClicks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">สินค้าแนะนำ</p>
              <p className="text-2xl font-bold text-black dark:text-slate-100">{stats.featuredCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-8">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-black dark:text-slate-100">สินค้าตาม Platform</h2>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(PLATFORMS).map(([key, config]) => {
              const stat = stats.platformStats.find((s: any) => s.platform === key)
              const count = stat?._count?.id || 0
              const clicks = stat?._sum?.clicks || 0
              return (
                <div
                  key={key}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center"
                  style={{ borderLeftColor: config.color, borderLeftWidth: '4px' }}
                >
                  <span className="text-2xl">{config.icon}</span>
                  <p className="font-medium text-black dark:text-slate-100 mt-1">{config.name}</p>
                  <p className="text-2xl font-bold text-black dark:text-slate-100">{count}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{clicks} clicks</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-black dark:text-slate-100">สินค้ายอดนิยม</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">เรียงตามจำนวนคลิก</p>
            </div>
          </div>
          <div className="p-6">
            {stats.topProducts.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">ยังไม่มีสินค้า</p>
            ) : (
              <div className="space-y-4">
                {stats.topProducts.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    target="_blank"
                    className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-black dark:text-slate-100 truncate">{product.title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{product.category.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-black dark:text-slate-100">{product.clicks} คลิก</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">฿{product.price.toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Products */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-black dark:text-slate-100">สินค้าล่าสุด</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">เพิ่มล่าสุด 5 รายการ</p>
            </div>
          </div>
          <div className="p-6">
            {stats.recentProducts.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">ยังไม่มีสินค้า</p>
            ) : (
              <div className="space-y-4">
                {stats.recentProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    target="_blank"
                    className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    {product.featured && (
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-black dark:text-slate-100 truncate">{product.title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{product.category.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-black dark:text-slate-100">฿{product.price.toFixed(2)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(product.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Stats & Export */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Category Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-accent dark:text-yellow-400" />
              <h2 className="text-lg font-semibold text-black dark:text-slate-100">หมวดหมู่ยอดนิยม</h2>
            </div>
          </div>
          <div className="p-6">
            {stats.categoryStats.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">ยังไม่มีหมวดหมู่</p>
            ) : (
              <div className="space-y-3">
                {stats.categoryStats.map((category: any, index: number) => {
                  const percentage = stats.productCount > 0
                    ? Math.round((category._count.products / stats.productCount) * 100)
                    : 0
                  return (
                    <div key={category.id} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-accent/10 dark:bg-yellow-400/20 text-accent dark:text-yellow-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-black dark:text-slate-100">{category.name}</span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">{category._count.products} สินค้า</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-accent dark:bg-yellow-400 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Export */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-black dark:text-slate-100">Export ข้อมูล</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ส่งออกข้อมูลสินค้าทั้งหมดเป็นไฟล์ CSV สำหรับวิเคราะห์หรือสำรองข้อมูล
            </p>
            <div className="space-y-3">
              <a
                href="/api/products/export?format=csv"
                className="flex items-center justify-center gap-2 w-full p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Export เป็น CSV
              </a>
              <a
                href="/api/products/export?format=json"
                className="flex items-center justify-center gap-2 w-full p-3 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-black dark:text-slate-200 rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Export เป็น JSON
              </a>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              สินค้าทั้งหมด {stats.productCount} รายการ
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
