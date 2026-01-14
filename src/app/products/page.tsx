import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/ProductCard'
import ProductFilters from '@/components/ProductFilters'
import Pagination from '@/components/Pagination'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'สินค้า - กอล์ฟรีวิว',
  description: 'เรียกดูคอลเลกชันสินค้าที่คัดสรรมาอย่างดีจากทุกหมวดหมู่',
}

// Make page dynamic to avoid caching issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>
}

const ITEMS_PER_PAGE = 12

async function getProducts(category?: string, search?: string, page: number = 1) {
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

  const skip = (page - 1) * ITEMS_PER_PAGE

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.product.count({ where }),
  ])

  return {
    products,
    total,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
  }
}

async function getCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1'))

  const [{ products, total, totalPages }, categories] = await Promise.all([
    getProducts(params.category, params.search, currentPage),
    getCategories(),
  ])

  return (
    <div className="py-12 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-black dark:text-white">สินค้าทั้งหมด</h1>
          <p className="text-slate-700 dark:text-slate-300">
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
              <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <p className="text-xl text-slate-700 dark:text-slate-200">ไม่พบสินค้า</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                  ลองปรับการค้นหาหรือตัวกรองของคุณ
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-6">
                  แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, total)} จาก {total} สินค้า
                  {params.category && ` ในหมวด ${params.category}`}
                  {params.search && ` ที่ตรงกับ "${params.search}"`}
                </p>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product as any} />
                  ))}
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl="/products"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
