import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/ProductCard'
import ProductFilters from '@/components/ProductFilters'
import Pagination from '@/components/Pagination'
import BackToTop from '@/components/BackToTop'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'สินค้า - กอล์ฟรีวิว',
  description: 'เรียกดูคอลเลกชันสินค้าที่คัดสรรมาอย่างดีจากทุกหมวดหมู่',
}

// Make page dynamic to avoid caching issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  searchParams: Promise<{
    category?: string
    search?: string
    page?: string
    sort?: string
    minRating?: string
    minPrice?: string
    maxPrice?: string
  }>
}

const ITEMS_PER_PAGE = 12

async function getProducts(
  category?: string,
  search?: string,
  page: number = 1,
  sort?: string,
  minRating?: string,
  minPrice?: string,
  maxPrice?: string
) {
  const where: Record<string, unknown> = {}

  if (category) {
    where.category = { is: { slug: category } }
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ]
  }

  if (minRating) {
    where.rating = { gte: parseFloat(minRating) }
  }

  // Price range filter
  if (minPrice || maxPrice) {
    where.price = {}
    if (minPrice) {
      where.price.gte = parseFloat(minPrice)
    }
    if (maxPrice) {
      where.price.lte = parseFloat(maxPrice)
    }
  }

  // Determine orderBy based on sort parameter
  let orderBy: any = { createdAt: 'desc' } // default

  switch (sort) {
    case 'popular':
      orderBy = { clicks: 'desc' }
      break
    case 'rating':
      orderBy = { rating: 'desc' }
      break
    case 'price-low':
      orderBy = { price: 'asc' }
      break
    case 'price-high':
      orderBy = { price: 'desc' }
      break
    default:
      orderBy = { createdAt: 'desc' }
  }

  const skip = (page - 1) * ITEMS_PER_PAGE

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        imageUrl: true,
        mediaType: true,
        clicks: true,
        featured: true,
        rating: true,
        reviewCount: true,
        originalPrice: true,
        soldCount: true,
        stock: true,
        saleEndDate: true,
        isBestSeller: true,
        isLimited: true,
        launchedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy,
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
    getProducts(
      params.category,
      params.search,
      currentPage,
      params.sort,
      params.minRating,
      params.minPrice,
      params.maxPrice
    ),
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
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="max-w-sm mx-auto">
                  <div className="w-20 h-20 mx-auto mb-6 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">ไม่พบสินค้า</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    ลองเลือกหมวดหมู่อื่นหรือค้นหาด้วยคำค้นที่ต่างกัน
                  </p>
                  <button
                    onClick={() => window.location.href = '/products'}
                    className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    ดูสินค้าทั้งหมด
                  </button>
                </div>
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
      <BackToTop />
    </div>
  )
}
