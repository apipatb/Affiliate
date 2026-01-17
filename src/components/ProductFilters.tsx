'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, SlidersHorizontal, Star, TrendingUp, Clock, DollarSign, Filter } from 'lucide-react'
import PriceRangeFilter from './PriceRangeFilter'

interface Category {
  id: string
  name: string
  slug: string
  _count: {
    products: number
  }
}

interface ProductFiltersProps {
  categories: Category[]
  currentCategory?: string
  currentSearch?: string
}

export default function ProductFilters({
  categories,
  currentCategory,
  currentSearch,
}: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const currentSort = searchParams.get('sort') || 'newest'
  const currentMinRating = searchParams.get('minRating') || ''

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    // Reset to page 1 when changing filters
    params.delete('page')

    router.push(`/products?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const searchValue = searchInputRef.current?.value.trim() || ''
    updateFilters('search', searchValue || null)
  }

  const clearSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.value = ''
    }
    updateFilters('search', null)
  }

  const clearFilters = () => {
    if (searchInputRef.current) {
      searchInputRef.current.value = ''
    }
    router.push('/products')
  }

  const hasFilters = currentCategory || currentSearch || currentSort !== 'newest' || currentMinRating

  const sortOptions = [
    { value: 'newest', label: 'ใหม่สุด', icon: Clock },
    { value: 'popular', label: 'ยอดนิยม', icon: TrendingUp },
    { value: 'rating', label: 'รีวิวสูงสุด', icon: Star },
    { value: 'price-low', label: 'ราคาต่ำ-สูง', icon: DollarSign },
    { value: 'price-high', label: 'ราคาสูง-ต่ำ', icon: DollarSign },
  ]

  const ratingOptions = [
    { value: '', label: 'ทุกระดับ' },
    { value: '4.5', label: '4.5+ ดาว' },
    { value: '4.0', label: '4.0+ ดาว' },
    { value: '3.5', label: '3.5+ ดาว' },
  ]

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold mb-3 text-slate-900 dark:text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          ค้นหาสินค้า
        </h3>
        <form onSubmit={handleSearch} className="relative">
          <input
            ref={searchInputRef}
            type="text"
            defaultValue={currentSearch || ''}
            placeholder="พิมพ์ชื่อสินค้าที่ต้องการ..."
            className="w-full pl-10 pr-10 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm text-slate-900 dark:text-white font-medium transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          {currentSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Sort */}
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold mb-3 text-slate-900 dark:text-white flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          เรียงลำดับ
        </h3>
        <div className="space-y-2">
          {sortOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => updateFilters('sort', option.value === 'newest' ? null : option.value)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  currentSort === option.value
                    ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-md shadow-primary/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Rating Filter */}
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold mb-3 text-slate-900 dark:text-white flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          ระดับรีวิว
        </h3>
        <div className="space-y-2">
          {ratingOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilters('minRating', option.value || null)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                currentMinRating === option.value
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md shadow-yellow-500/30'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <PriceRangeFilter
        currentMinPrice={searchParams.get('minPrice') || ''}
        currentMaxPrice={searchParams.get('maxPrice') || ''}
      />

      {/* Categories */}
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold mb-3 text-slate-900 dark:text-white flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          หมวดหมู่
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => updateFilters('category', null)}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              !currentCategory
                ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-md shadow-primary/30'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
            }`}
          >
            <div className="flex justify-between items-center">
              <span>ทุกหมวดหมู่</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${!currentCategory ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                {categories.reduce((sum, cat) => sum + cat._count.products, 0)}
              </span>
            </div>
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => updateFilters('category', category.slug)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                currentCategory === category.slug
                  ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-md shadow-primary/30'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{category.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${currentCategory === category.slug ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                  {category._count.products}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <X className="w-5 h-5" />
          ล้างตัวกรอง
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <SlidersHorizontal className="w-5 h-5" />
          ตัวกรองและเรียงลำดับ
        </button>
      </div>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-slate-900 p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">ตัวกรอง</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterContent />
          </div>
        </div>
      )}

      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <FilterContent />
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
      `}</style>
    </>
  )
}
