import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/ProductCard'
import { Metadata } from 'next'
import { Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'สินค้าแนะนำ - กอล์ฟรีวิว',
  description: 'สินค้าแนะนำที่คัดสรรมาอย่างพิถีพิถันจากทีมงาน',
}

// Make this page dynamic so it always fetches fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { featured: true },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function FeaturedPage() {
  const products = await getFeaturedProducts()

  return (
    <div className="py-12 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-8 h-8 text-accent fill-accent" />
            <h1 className="text-4xl font-bold text-black dark:text-white">สินค้าแนะนำ</h1>
          </div>
          <p className="text-slate-700 dark:text-slate-300">
            สินค้าที่ทีมงานของเราคัดสรรมาอย่างพิถีพิถัน พร้อมรับประกันคุณภาพ
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <Star className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-xl text-slate-700 dark:text-slate-200">ยังไม่มีสินค้าแนะนำ</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              ทีมงานกำลังคัดสรรสินค้าคุณภาพมาแนะนำให้คุณ
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-6">
              แสดง {products.length} สินค้า
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
