'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Zap } from 'lucide-react'

interface StickyBuyButtonProps {
  productId: string
  productTitle: string
  price: number
  imageUrl: string
}

export default function StickyBuyButton({ productId, productTitle, price, imageUrl }: StickyBuyButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky button after scrolling 400px
      setIsVisible(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleClick = () => {
    const buyUrl = `/products/${productId}/go`
    window.open(buyUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Product Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src={imageUrl}
                alt={productTitle}
                loading="lazy"
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border-2 border-slate-200 dark:border-slate-700"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {productTitle}
                </p>
                <p className="text-lg font-extrabold text-primary dark:text-blue-400">
                  ฿{price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Buy Button */}
            <button
              onClick={handleClick}
              className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
            >
              <Zap className="w-5 h-5 fill-white" />
              <span className="hidden sm:inline">ซื้อเลย</span>
              <ShoppingCart className="w-5 h-5 sm:hidden" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
