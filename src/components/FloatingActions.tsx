'use client'

import { useState, useEffect } from 'react'
import { ArrowUp, Heart, Search, Filter } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import Link from 'next/link'

interface FloatingActionsProps {
  showSearch?: boolean
  showFilter?: boolean
  onFilterClick?: () => void
}

export default function FloatingActions({
  showSearch = false,
  showFilter = false,
  onFilterClick,
}: FloatingActionsProps) {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const { count } = useWishlist()

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      {/* Wishlist Button */}
      <Link
        href="/wishlist"
        className="relative group bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-110"
      >
        <Heart className="w-6 h-6 fill-white" />
        {count > 0 && (
          <div className="absolute -top-1 -right-1 bg-yellow-400 text-slate-900 text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-pulse">
            {count > 9 ? '9+' : count}
          </div>
        )}
        <span className="absolute right-full mr-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
          รายการโปรด ({count})
        </span>
      </Link>

      {/* Search Button */}
      {showSearch && (
        <Link
          href="/products"
          className="group bg-blue-500 hover:bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-110"
        >
          <Search className="w-6 h-6" />
          <span className="absolute right-full mr-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            ค้นหาสินค้า
          </span>
        </Link>
      )}

      {/* Filter Button */}
      {showFilter && onFilterClick && (
        <button
          onClick={onFilterClick}
          className="group bg-purple-500 hover:bg-purple-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-110 lg:hidden"
        >
          <Filter className="w-6 h-6" />
          <span className="absolute right-full mr-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            กรองสินค้า
          </span>
        </button>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="group bg-slate-700 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-110 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <ArrowUp className="w-6 h-6" />
          <span className="absolute right-full mr-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            กลับขึ้นด้านบน
          </span>
        </button>
      )}
    </div>
  )
}
