'use client'

import { useState, useEffect } from 'react'
import { DollarSign } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PriceRangeFilterProps {
  currentMinPrice?: string
  currentMaxPrice?: string
}

export default function PriceRangeFilter({
  currentMinPrice,
  currentMaxPrice,
}: PriceRangeFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [minPrice, setMinPrice] = useState(currentMinPrice || '')
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice || '')

  const priceRanges = [
    { label: 'ทั้งหมด', min: '', max: '' },
    { label: 'ต่ำกว่า ฿500', min: '', max: '500' },
    { label: '฿500 - ฿1,000', min: '500', max: '1000' },
    { label: '฿1,000 - ฿2,000', min: '1000', max: '2000' },
    { label: '฿2,000 - ฿5,000', min: '2000', max: '5000' },
    { label: 'มากกว่า ฿5,000', min: '5000', max: '' },
  ]

  const applyFilter = (min: string, max: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (min) {
      params.set('minPrice', min)
    } else {
      params.delete('minPrice')
    }

    if (max) {
      params.set('maxPrice', max)
    } else {
      params.delete('maxPrice')
    }

    // Reset to page 1 when filtering
    params.delete('page')

    router.push(`/products?${params.toString()}`)
  }

  const handleQuickSelect = (min: string, max: string) => {
    setMinPrice(min)
    setMaxPrice(max)
    applyFilter(min, max)
  }

  const handleCustomApply = () => {
    applyFilter(minPrice, maxPrice)
  }

  const isActive = (min: string, max: string) => {
    return (currentMinPrice || '') === min && (currentMaxPrice || '') === max
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-primary dark:text-blue-400" />
        <h3 className="font-bold text-slate-900 dark:text-white">ช่วงราคา</h3>
      </div>

      {/* Quick Select Buttons */}
      <div className="space-y-2 mb-4">
        {priceRanges.map((range) => (
          <button
            key={range.label}
            onClick={() => handleQuickSelect(range.min, range.max)}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isActive(range.min, range.max)
                ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Custom Range */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          กำหนดเอง
        </p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="ราคาต่ำสุด"
            min="0"
            className="px-3 py-2 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:border-primary dark:focus:border-blue-500 transition-colors"
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="ราคาสูงสุด"
            min="0"
            className="px-3 py-2 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:border-primary dark:focus:border-blue-500 transition-colors"
          />
        </div>
        <button
          onClick={handleCustomApply}
          className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
        >
          ใช้กรอง
        </button>
      </div>
    </div>
  )
}
