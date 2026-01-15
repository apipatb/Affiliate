'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'affiliate_comparison'
const MAX_ITEMS = 4

export interface ComparisonItem {
  id: string
  title: string
  price: number
  imageUrl: string
  categoryName: string
  rating?: number
  reviewCount?: number
  originalPrice?: number | null
  clicks?: number
  description?: string
}

export function useComparison() {
  const [comparison, setComparison] = useState<ComparisonItem[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setComparison(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse comparison:', e)
      }
    }
  }, [])

  const addToComparison = (item: ComparisonItem) => {
    if (comparison.length >= MAX_ITEMS) {
      alert(`สามารถเปรียบเทียบได้สูงสุด ${MAX_ITEMS} สินค้าเท่านั้น`)
      return
    }

    if (isInComparison(item.id)) {
      return
    }

    const newComparison = [...comparison, item]
    setComparison(newComparison)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newComparison))
  }

  const removeFromComparison = (id: string) => {
    const newComparison = comparison.filter((item) => item.id !== id)
    setComparison(newComparison)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newComparison))
  }

  const isInComparison = (id: string) => {
    return comparison.some((item) => item.id === id)
  }

  const toggleComparison = (item: ComparisonItem) => {
    if (isInComparison(item.id)) {
      removeFromComparison(item.id)
    } else {
      addToComparison(item)
    }
  }

  const clearComparison = () => {
    setComparison([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    comparison,
    addToComparison,
    removeFromComparison,
    isInComparison,
    toggleComparison,
    clearComparison,
    count: comparison.length,
    isFull: comparison.length >= MAX_ITEMS,
  }
}
