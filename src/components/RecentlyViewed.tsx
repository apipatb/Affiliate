'use client'

import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import Link from 'next/link'
import { Clock, X } from 'lucide-react'

export default function RecentlyViewed() {
  const { recentProducts, clearAll } = useRecentlyViewed()

  if (recentProducts.length === 0) {
    return null
  }

  return (
    <div className="py-12 bg-slate-50 dark:bg-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary dark:text-blue-400" />
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              สินค้าที่เพิ่งดู
            </h2>
          </div>
          <button
            onClick={clearAll}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-semibold transition-colors flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            ล้างทั้งหมด
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recentProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-blue-500"
            >
              <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 relative overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <p className="text-xs text-primary dark:text-blue-400 font-bold mb-1">
                  {product.categoryName}
                </p>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mb-2 leading-tight">
                  {product.title}
                </h3>
                <p className="text-lg font-extrabold text-primary dark:text-blue-400">
                  ฿{product.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
