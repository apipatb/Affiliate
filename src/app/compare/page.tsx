'use client'

import { useComparison } from '@/hooks/useComparison'
import { ArrowLeft, X, Star, Zap, ArrowRight, Scale } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ComparePage() {
  const { comparison, removeFromComparison, clearComparison } = useComparison()

  if (comparison.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-primary dark:text-blue-400 hover:underline mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปยังสินค้า
          </Link>

          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Scale className="w-12 h-12 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              ไม่มีสินค้าในการเปรียบเทียบ
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              เพิ่มสินค้าเพื่อเปรียบเทียบคุณสมบัติและราคา
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              เลือกสินค้า
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Fill empty slots to always show 4 columns
  const slots = [...comparison]
  while (slots.length < 4) {
    slots.push(null as any)
  }

  const buyUrl = (productId: string) => `/products/${productId}/go`

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-primary dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปยังสินค้า
          </Link>

          {comparison.length > 0 && (
            <button
              onClick={clearComparison}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold"
            >
              ลบทั้งหมด
            </button>
          )}
        </div>

        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            เปรียบเทียบสินค้า
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            เปรียบเทียบ {comparison.length} สินค้า เพื่อเลือกสินค้าที่ดีที่สุดสำหรับคุณ
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Product Images */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {slots.map((product, index) => (
                <motion.div
                  key={product?.id || `empty-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative ${
                    product
                      ? 'bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden'
                      : 'bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {product ? (
                    <>
                      <button
                        onClick={() => removeFromComparison(product.id)}
                        className="absolute top-2 right-2 z-10 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <Link href={`/products/${product.id}`}>
                        <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </Link>
                    </>
                  ) : (
                    <div className="aspect-square flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                          <Scale className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          เพิ่มสินค้า
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Product Names */}
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-200 dark:border-slate-700">
                {slots.map((product, index) => (
                  <div key={product?.id || `name-${index}`} className="min-h-[60px]">
                    {product ? (
                      <Link
                        href={`/products/${product.id}`}
                        className="font-bold text-sm text-slate-900 dark:text-white hover:text-primary dark:hover:text-blue-400 line-clamp-2 transition-colors"
                      >
                        {product.title}
                      </Link>
                    ) : (
                      <div className="h-full bg-slate-50 dark:bg-slate-900/50 rounded-lg"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Category */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                {slots.map((product, index) => (
                  <div key={product?.id || `cat-${index}`}>
                    {product ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          หมวดหมู่
                        </p>
                        <p className="text-sm font-bold text-primary dark:text-blue-400">
                          {product.categoryName}
                        </p>
                      </div>
                    ) : (
                      <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Price */}
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-200 dark:border-slate-700">
                {slots.map((product, index) => (
                  <div key={product?.id || `price-${index}`}>
                    {product ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          ราคา
                        </p>
                        <p className="text-xl font-extrabold text-primary dark:text-blue-400">
                          ฿{product.price.toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-through">
                            ฿{product.originalPrice.toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="h-12 bg-slate-50 dark:bg-slate-900/50 rounded-lg"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Rating */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                {slots.map((product, index) => (
                  <div key={product?.id || `rating-${index}`}>
                    {product ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          คะแนน
                        </p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {(product.rating || 4.8).toFixed(1)}
                          </span>
                          {product.reviewCount && product.reviewCount > 0 && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              ({product.reviewCount})
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Views */}
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-200 dark:border-slate-700">
                {slots.map((product, index) => (
                  <div key={product?.id || `views-${index}`}>
                    {product ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          ผู้เข้าชม
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {product.clicks
                            ? product.clicks > 1000
                              ? `${(product.clicks / 1000).toFixed(1)}K`
                              : product.clicks
                            : 0}
                        </p>
                      </div>
                    ) : (
                      <div className="h-10 bg-slate-50 dark:bg-slate-900/50 rounded-lg"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50">
                {slots.map((product, index) => (
                  <div key={product?.id || `desc-${index}`} className="min-h-[80px]">
                    {product ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          คำอธิบาย
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                          {product.description}
                        </p>
                      </div>
                    ) : (
                      <div className="h-full bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Buy Buttons */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              {slots.map((product, index) => (
                <div key={product?.id || `buy-${index}`}>
                  {product ? (
                    <a
                      href={buyUrl(product.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      <Zap className="w-5 h-5 fill-white" />
                      ซื้อเลย
                      <ArrowRight className="w-5 h-5" />
                    </a>
                  ) : (
                    <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
