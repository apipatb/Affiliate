import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/ProductCard'
import ProductFilters from '@/components/ProductFilters'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'สินค้า - BoomBigNose รีวิว',
  description: 'เรียกดูคอลเลกชันสินค้าที่คัดสรรมาอย่างดีจากทุกหมวดหมู่',
}

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string }>
}

async function getProducts(category?: string, search?: string) {
  const where: Record<string, unknown> = {}

  if (category) {
    where.category = { slug: category }
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ]
  }

  return prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
}

async function getCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [products, categories] = await Promise.all([
    getProducts(params.category, params.search),
    getCategories(),
  ])

  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-black">สินค้าทั้งหมด</h1>
          <p className="text-slate-600">
            เรียกดูคอลเลกชันสินค้าที่คัดสรรมาอย่างดี
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <ProductFilters
              categories={categories}
              currentCategory={params.category}
              currentSearch={params.search}
            />
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-xl">
                <p className="text-xl text-slate-600">ไม่พบสินค้า</p>
                <p className="text-sm text-slate-500 mt-2">
                  ลองปรับการค้นหาหรือตัวกรองของคุณ
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-6">
                  แสดง {products.length} สินค้า
                  {params.category && ` ในหมวด ${params.category}`}
                  {params.search && ` ที่ตรงกับ "${params.search}"`}
                </p>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product as any} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
