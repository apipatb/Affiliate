'use client'

import { ArrowRight, Star, TrendingUp, Zap, Eye, AlertCircle, Package, Flame, Award, Sparkles, Crown } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Product as PrismaProduct, Category as PrismaCategory } from '@prisma/client'

type MediaType = 'IMAGE' | 'VIDEO'

type Product = PrismaProduct & {
  category: PrismaCategory
  mediaType: MediaType
  rating?: number
  reviewCount?: number
  originalPrice?: number | null
  soldCount?: number
  stock?: number | null
  saleEndDate?: Date | null
  isBestSeller?: boolean
  isLimited?: boolean
  launchedAt?: Date | null
}

export default function ProductCard({ product }: { product: Product }) {
  // Use redirect route that tracks clicks and redirects to affiliate URL
  const buyUrl = `/products/${product.id}/go`

  const isPopular = product.clicks > 50
  const isTrending = product.clicks > 20

  // Calculate discount percentage
  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0

  // Low stock warning
  const isLowStock = product.stock !== null && product.stock !== undefined && product.stock > 0 && product.stock <= 10
  const isOutOfStock = product.stock !== null && product.stock !== undefined && product.stock === 0

  // Hot sale indicator
  const isHotSale = hasDiscount && discountPercent >= 30

  // New arrival (launched within last 7 days)
  const isNew = product.launchedAt && (new Date().getTime() - new Date(product.launchedAt).getTime()) / (1000 * 60 * 60 * 24) <= 7

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-md hover:shadow-2xl hover:border-primary dark:hover:border-blue-500 transition-all duration-300 overflow-hidden group"
    >
      <Link href={`/products/${product.id}`}>
        <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 relative overflow-hidden">
          {product.mediaType === 'VIDEO' ? (
            <div className="relative w-full h-full">
              <video
                src={product.imageUrl}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                muted
                playsInline
                preload="none"
              />
              {/* Play icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <img
              src={product.imageUrl}
              alt={product.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {isHotSale && (
              <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg animate-pulse">
                <Flame className="w-3 h-3 fill-white" />
                Hot Sale!
              </div>
            )}
            {hasDiscount && discountPercent > 0 && !isHotSale && (
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                -{discountPercent}%
              </div>
            )}
            {product.isBestSeller && !isHotSale && (
              <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                <Crown className="w-3 h-3 fill-white" />
                ขายดี
              </div>
            )}
            {product.isLimited && !isHotSale && (
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                <Award className="w-3 h-3" />
                Limited
              </div>
            )}
            {isNew && !isHotSale && (
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                <Sparkles className="w-3 h-3 fill-white" />
                ใหม่
              </div>
            )}
            {product.featured && !isHotSale && !product.isBestSeller && !product.isLimited && !isNew && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                <Star className="w-3 h-3 fill-white" />
                แนะนำ
              </div>
            )}
            {isTrending && !isHotSale && !product.isBestSeller && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                <TrendingUp className="w-3 h-3" />
                มาแรง
              </div>
            )}
          </div>

          {/* Low Stock Badge - Bottom Left */}
          {isLowStock && (
            <div className="absolute bottom-3 left-3 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg animate-pulse">
              <AlertCircle className="w-3 h-3" />
              เหลือแค่ {product.stock} ชิ้น!
            </div>
          )}

          {/* Views Badge */}
          {product.clicks > 0 && (
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <Eye className="w-3 h-3" />
              {product.clicks > 1000 ? `${(product.clicks / 1000).toFixed(1)}K` : product.clicks}
            </div>
          )}
        </div>
      </Link>
      <div className="p-6">
        <Link
          href={`/products?category=${product.category.slug}`}
          className="text-xs font-bold text-primary dark:text-blue-400 mb-2 uppercase tracking-wider hover:underline inline-block px-2 py-1 bg-primary/10 dark:bg-blue-500/10 rounded-md"
        >
          {product.category.name}
        </Link>
        <Link href={`/products/${product.id}`}>
          <h3 className="text-lg font-extrabold mb-2 text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
            {product.title}
          </h3>
        </Link>
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 font-medium">
          {product.description}
        </p>

        {/* Star Rating */}
        <div className="flex items-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => {
            const rating = product.rating || 4.8
            return (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.floor(rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : i < Math.ceil(rating)
                    ? 'text-yellow-400 fill-yellow-400 opacity-50'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            )
          })}
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">
            ({(product.rating || 4.8).toFixed(1)})
          </span>
          {product.reviewCount && product.reviewCount > 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              · {product.reviewCount > 1000 ? `${(product.reviewCount / 1000).toFixed(1)}K` : product.reviewCount}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-2xl font-extrabold text-primary dark:text-blue-400 block">
              ฿{product.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </span>
            {isPopular && (
              <span className="text-xs font-bold text-green-600 dark:text-green-400">ราคาพิเศษ!</span>
            )}
          </div>
          <a
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 group/btn"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span className="hidden sm:inline">ซื้อ</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </motion.div>
  )
}
