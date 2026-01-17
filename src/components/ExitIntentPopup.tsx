'use client'

import { useState, useEffect } from 'react'
import { X, Gift, ArrowRight, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface Product {
  id: string
  title: string
  price: number
  originalPrice?: number | null
  imageUrl: string
  rating?: number
}

export default function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [hasShown, setHasShown] = useState(false)

  useEffect(() => {
    // Check if already shown in this session
    const shown = sessionStorage.getItem('exitIntentShown')
    if (shown) {
      setHasShown(true)
      return
    }

    // Fetch featured products for recommendation
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?featured=true&limit=3')
        const data = await res.json()
        if (data.products && data.products.length > 0) {
          setProducts(data.products.slice(0, 3))
        }
      } catch (error) {
        console.error('Failed to fetch products for exit intent:', error)
      }
    }
    fetchProducts()

    // Exit intent detection
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves from top of page
      if (e.clientY <= 0 && !hasShown) {
        setIsVisible(true)
        setHasShown(true)
        sessionStorage.setItem('exitIntentShown', 'true')
      }
    }

    // Add delay before enabling exit intent (don't show immediately)
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave)
    }, 5000) // Wait 5 seconds before enabling

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [hasShown])

  const handleClose = () => {
    setIsVisible(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const calculateDiscount = (original: number, current: number) => {
    return Math.round(((original - current) / original) * 100)
  }

  if (!isVisible || products.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">เดี๋ยวก่อน!</h2>
                <p className="text-white/90">ดูสินค้าแนะนำก่อนไปไหม?</p>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="p-6">
            <p className="text-slate-600 dark:text-slate-400 mb-4 text-center">
              สินค้ายอดนิยมที่คุณอาจสนใจ
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group bg-slate-50 dark:bg-slate-900 rounded-xl p-3 hover:shadow-lg transition-all border-2 border-transparent hover:border-primary"
                  onClick={handleClose}
                >
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-white">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {product.title}
                  </h3>
                  <div className="flex items-center gap-1 mb-1">
                    {product.rating && (
                      <>
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {product.rating.toFixed(1)}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-xs text-red-500 font-semibold">
                        -{calculateDiscount(product.originalPrice, product.price)}%
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/products"
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
                onClick={handleClose}
              >
                ดูสินค้าทั้งหมด
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={handleClose}
                className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold py-3 px-6 rounded-xl transition-colors"
              >
                ไว้ทีหลัง
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
