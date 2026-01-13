'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

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
  const [search, setSearch] = useState(currentSearch || '')

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    router.push(`/products?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters('search', search || null)
  }

  const clearFilters = () => {
    router.push('/products')
    setSearch('')
  }

  const hasFilters = currentCategory || currentSearch

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-black">ค้นหา</h3>
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาสินค้า..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm text-black"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </form>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-black">หมวดหมู่</h3>
        <div className="space-y-1">
          <button
            onClick={() => updateFilters('category', null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !currentCategory
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-black hover:bg-slate-100'
            }`}
          >
            ทุกหมวดหมู่
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => updateFilters('category', category.slug)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${
                currentCategory === category.slug
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-black hover:bg-slate-100'
              }`}
            >
              <span>{category.name}</span>
              <span className="text-xs text-slate-500">{category._count.products}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          ล้างตัวกรองทั้งหมด
        </button>
      )}
    </div>
  )
}
