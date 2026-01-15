'use client'

import { useWishlist } from '@/hooks/useWishlist'
import Link from 'next/link'
import { Heart, ShoppingCart, X, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist()

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors mb-8 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้าสินค้า
          </Link>

          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Heart className="w-16 h-16 text-slate-300 dark:text-slate-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
              ยังไม่มีสินค้าโปรด
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              คลิกไอคอนหัวใจบนสินค้าที่คุณชอบเพื่อบันทึกไว้ดูภายหลัง
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
              เลือกซื้อสินค้า
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไปหน้าสินค้า
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                รายการโปรด
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {wishlist.length} สินค้า
              </p>
            </div>
          </div>
          <button
            onClick={clearWishlist}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold transition-colors"
          >
            ลบทั้งหมด
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl transition-all border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-blue-500 overflow-hidden group"
            >
              <Link href={`/products/${item.id}`}>
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 relative overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      removeFromWishlist(item.id)
                    }}
                    className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition-all transform hover:scale-110"
                    title="ลบออกจากรายการโปรด"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </Link>

              <div className="p-4">
                <Link
                  href={`/products?category=${item.categoryName}`}
                  className="text-xs font-bold text-primary dark:text-blue-400 mb-1 uppercase tracking-wider hover:underline inline-block"
                >
                  {item.categoryName}
                </Link>
                <Link href={`/products/${item.id}`}>
                  <h3 className="text-base font-extrabold mb-2 text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                </Link>
                <div className="flex items-center justify-between gap-2 mt-4">
                  <span className="text-xl font-extrabold text-primary dark:text-blue-400">
                    ฿{item.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </span>
                  <Link
                    href={`/products/${item.id}`}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-4 py-2 rounded-lg inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all text-sm"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    ดู
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
