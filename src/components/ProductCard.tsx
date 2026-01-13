'use client'

import { ArrowRight, Star } from 'lucide-react'
import Link from 'next/link'
import type { Product as PrismaProduct, Category as PrismaCategory } from '@prisma/client'

type MediaType = 'IMAGE' | 'VIDEO'

type Product = PrismaProduct & {
  category: PrismaCategory
  mediaType: MediaType
}

export default function ProductCard({ product }: { product: Product }) {
  // Use redirect route that tracks clicks and redirects to affiliate URL
  const buyUrl = `/products/${product.id}/go`

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-square bg-slate-100 relative overflow-hidden">
          {product.mediaType === 'VIDEO' ? (
            <div className="relative w-full h-full">
              <video
                src={product.imageUrl}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                muted
                playsInline
                preload="metadata"
              />
              {/* Play icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          {product.featured && (
            <div className="absolute top-3 right-3 bg-accent text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Star className="w-3 h-3 fill-white" />
              แนะนำ
            </div>
          )}
        </div>
      </Link>
      <div className="p-6">
        <Link
          href={`/products?category=${product.category.slug}`}
          className="text-xs font-bold text-primary dark:text-blue-400 mb-2 uppercase tracking-wider hover:underline inline-block"
        >
          {product.category.name}
        </Link>
        <Link href={`/products/${product.id}`}>
          <h3 className="text-lg font-bold mb-2 text-black dark:text-slate-100 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {product.title}
          </h3>
        </Link>
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-black dark:text-slate-100">฿{product.price.toFixed(2)}</span>
          <a
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primary dark:text-blue-400 inline-flex items-center gap-1 hover:gap-2 transition-all"
          >
            ซื้อเลย <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
