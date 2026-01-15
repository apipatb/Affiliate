'use client'

import { useState, useEffect } from 'react'
import { X, Star, ShoppingCart, Heart, Share2, Eye, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import WishlistButton from './WishlistButton'

interface QuickViewProduct {
  id: string
  title: string
  description: string
  price: number
  imageUrl: string
  mediaType: 'IMAGE' | 'VIDEO'
  rating?: number
  reviewCount?: number
  clicks: number
  soldCount?: number
  stock?: number | null
  originalPrice?: number | null
  category: {
    name: string
    slug: string
  }
}

interface QuickViewModalProps {
  product: QuickViewProduct | null
  isOpen: boolean
  onClose: () => void
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!product) return null

  const buyUrl = `/products/${product.id}/go`
  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0
  const isLowStock = product.stock !== null && product.stock !== undefined && product.stock > 0 && product.stock <= 10

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors shadow-lg"
            >
              <X className="w-6 h-6 text-slate-900 dark:text-white" />
            </button>

            <div className="grid md:grid-cols-2 gap-6 p-6 overflow-y-auto max-h-[90vh]">
              {/* Left: Image */}
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl overflow-hidden">
                  {product.mediaType === 'VIDEO' ? (
                    <video
                      src={product.imageUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Discount Badge */}
                  {hasDiscount && discountPercent > 0 && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      -{discountPercent}%
                    </div>
                  )}
                </div>

                {/* View Full Details */}
                <Link
                  href={`/products/${product.id}`}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-xl transition-colors"
                  onClick={onClose}
                >
                  <Eye className="w-4 h-4" />
                  ดูรายละเอียดเต็ม
                </Link>
              </div>

              {/* Right: Details */}
              <div className="flex flex-col">
                {/* Category */}
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="inline-block text-xs font-bold text-primary dark:text-blue-400 uppercase tracking-wider hover:underline mb-2 px-3 py-1 bg-primary/10 dark:bg-blue-500/10 rounded-full w-fit"
                  onClick={onClose}
                >
                  {product.category.name}
                </Link>

                {/* Title */}
                <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white mb-3 leading-tight">
                  {product.title}
                </h2>

                {/* Rating & Stats */}
                <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => {
                      const rating = product.rating || 4.8
                      return (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      )
                    })}
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">
                      ({(product.rating || 4.8).toFixed(1)})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm">
                    <Eye className="w-4 h-4" />
                    {product.clicks.toLocaleString('th-TH')} ครั้ง
                  </div>

                  {product.soldCount !== undefined && product.soldCount > 0 && (
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-semibold">
                      <Package className="w-4 h-4" />
                      ขายแล้ว {product.soldCount.toLocaleString('th-TH')}
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-slate-700 dark:text-slate-300 mb-6 line-clamp-3">
                  {product.description}
                </p>

                {/* Price */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 mb-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    {hasDiscount && product.originalPrice && (
                      <span className="text-xl font-bold text-slate-400 dark:text-slate-500 line-through">
                        ฿{product.originalPrice.toLocaleString('th-TH')}
                      </span>
                    )}
                    <span className="text-4xl font-extrabold text-primary dark:text-blue-400">
                      ฿{product.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {isLowStock && (
                    <p className="text-sm text-red-600 dark:text-red-400 font-bold">
                      ⚠️ เหลือแค่ {product.stock} ชิ้น!
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mb-4">
                  <a
                    href={buyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-6 py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    ซื้อเลย
                  </a>

                  <WishlistButton
                    productId={product.id}
                    productTitle={product.title}
                    price={product.price}
                    imageUrl={product.imageUrl}
                    categoryName={product.category.name}
                  />
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>จัดส่งฟรี</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>รับประกันคุณภาพ</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
