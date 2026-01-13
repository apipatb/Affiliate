import { prisma } from '@/lib/prisma'
import { Package, FolderOpen, MousePointerClick, TrendingUp } from 'lucide-react'

async function getStats() {
  const [productCount, categoryCount, totalClicks] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.product.aggregate({
      _sum: { clicks: true },
    }),
  ])

  const topProducts = await prisma.product.findMany({
    take: 5,
    orderBy: { clicks: 'desc' },
    include: { category: true },
  })

  return {
    productCount,
    categoryCount,
    totalClicks: totalClicks._sum.clicks || 0,
    topProducts,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-black">แดชบอร์ด</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-600">สินค้าทั้งหมด</p>
              <p className="text-2xl font-bold text-black">{stats.productCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-slate-600">หมวดหมู่</p>
              <p className="text-2xl font-bold text-black">{stats.categoryCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <MousePointerClick className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-slate-600">คลิกทั้งหมด</p>
              <p className="text-2xl font-bold text-black">{stats.totalClicks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-black">สินค้ายอดนิยม</h2>
          </div>
        </div>
        <div className="p-6">
          {stats.topProducts.length === 0 ? (
            <p className="text-slate-600 text-center py-8">ยังไม่มีสินค้า</p>
          ) : (
            <div className="space-y-4">
              {stats.topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-slate-50"
                >
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-black">{product.title}</p>
                    <p className="text-sm text-slate-600">{product.category.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-black">{product.clicks} คลิก</p>
                    <p className="text-sm text-slate-600">฿{product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
