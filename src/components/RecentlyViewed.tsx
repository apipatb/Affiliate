'use client'

import { useRecentlyViewed, RecentProduct } from '@/hooks/useRecentlyViewed'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, X } from 'lucide-react'

interface RecentlyViewedProps {
  excludeId?: string
  title?: string
  maxItems?: number
}

export default function RecentlyViewed({
  excludeId,
  title = 'สินค้าที่ดูล่าสุด',
  maxItems = 6,
}: RecentlyViewedProps) {
  const { recentProducts, getExcluding, clearAll, isLoaded } = useRecentlyViewed()

  if (!isLoaded) return null

  const products = excludeId
    ? getExcluding(excludeId).slice(0, maxItems)
    : recentProducts.slice(0, maxItems)

  if (products.length === 0) return null

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          {title}
        </h3>
        <button
          onClick={clearAll}
          className="text-xs text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          ล้าง
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-primary/50 transition-all"
          >
            <div className="aspect-square relative">
              <Image
                src={product.imageUrl || '/placeholder.svg'}
                alt={product.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-2">
              <p className="text-xs font-medium text-black dark:text-white line-clamp-2 mb-1">
                {product.title}
              </p>
              <p className="text-sm font-bold text-primary">
                ฿{product.price.toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
