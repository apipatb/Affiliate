'use client'

import { useEffect, useState } from 'react'

interface RecentProduct {
  id: string
  title: string
  price: number
  imageUrl: string
  categoryName: string
}

const STORAGE_KEY = 'recentlyViewed'
const MAX_ITEMS = 8

export function useRecentlyViewed() {
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([])

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setRecentProducts(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse recently viewed:', e)
      }
    }
  }, [])

  const addProduct = (product: RecentProduct) => {
    setRecentProducts((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((p) => p.id !== product.id)

      // Add to beginning
      const updated = [product, ...filtered].slice(0, MAX_ITEMS)

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

      return updated
    })
  }

  const clearAll = () => {
    setRecentProducts([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    recentProducts,
    addProduct,
    clearAll,
  }
}
