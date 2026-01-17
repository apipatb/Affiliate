'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ProductCard from './ProductCard'
import { Loader2 } from 'lucide-react'

interface Product {
  id: string
  title: string
  description: string
  price: number
  imageUrl: string
  mediaType: 'IMAGE' | 'VIDEO'
  clicks: number
  featured: boolean
  rating?: number
  reviewCount?: number
  originalPrice?: number | null
  soldCount?: number
  stock?: number | null
  saleEndDate?: Date | null
  isBestSeller?: boolean
  isLimited?: boolean
  launchedAt?: Date | null
  category: {
    id: string
    name: string
    slug: string
  }
}

interface InfiniteScrollProductsProps {
  initialProducts: Product[]
  initialPage: number
  totalPages: number
  category?: string
  search?: string
  sort?: string
  minRating?: string
  minPrice?: string
  maxPrice?: string
  platform?: string
}

export default function InfiniteScrollProducts({
  initialProducts,
  initialPage,
  totalPages,
  category,
  search,
  sort,
  minRating,
  minPrice,
  maxPrice,
  platform,
}: InfiniteScrollProductsProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [page, setPage] = useState(initialPage)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(page < totalPages)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', (page + 1).toString())
      if (category) params.append('category', category)
      if (search) params.append('search', search)
      if (sort) params.append('sort', sort)
      if (minRating) params.append('minRating', minRating)
      if (minPrice) params.append('minPrice', minPrice)
      if (maxPrice) params.append('maxPrice', maxPrice)
      if (platform) params.append('platform', platform)

      const response = await fetch(`/api/products?${params.toString()}`)
      const data = await response.json()

      if (data.products && data.products.length > 0) {
        setProducts((prev) => [...prev, ...data.products])
        setPage((prev) => prev + 1)
        setHasMore(page + 1 < data.totalPages)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load more products:', error)
    } finally {
      setLoading(false)
    }
  }, [page, loading, hasMore, category, search, sort, minRating, minPrice, maxPrice, platform])

  useEffect(() => {
    // Reset when filters change
    setProducts(initialProducts)
    setPage(initialPage)
    setHasMore(initialPage < totalPages)
  }, [initialProducts, initialPage, totalPages])

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMore, hasMore, loading])

  return (
    <>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product as any} />
        ))}
      </div>

      {/* Loading indicator */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-12 flex justify-center">
          {loading && (
            <div className="flex items-center gap-3 text-primary dark:text-blue-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="font-semibold">กำลังโหลดเพิ่มเติม...</span>
            </div>
          )}
        </div>
      )}

      {/* End of results */}
      {!hasMore && products.length > 0 && (
        <div className="py-12 text-center">
          <p className="text-slate-600 dark:text-slate-400 font-semibold">
            แสดงสินค้าครบทั้งหมดแล้ว ({products.length} สินค้า)
          </p>
        </div>
      )}
    </>
  )
}
