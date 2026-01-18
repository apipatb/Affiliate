'use client'

import { useState, useEffect, useCallback } from 'react'

export interface RecentProduct {
  id: string
  title: string
  price: number
  imageUrl: string
  viewedAt: number
}

const STORAGE_KEY = 'recently_viewed_products'
const MAX_ITEMS = 10

export function useRecentlyViewed() {
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const products = JSON.parse(stored) as RecentProduct[]
        // Filter out old items (older than 30 days)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
        const filtered = products.filter(p => p.viewedAt > thirtyDaysAgo)
        setRecentProducts(filtered)
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage when products change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentProducts))
      } catch (error) {
        console.error('Error saving recently viewed:', error)
      }
    }
  }, [recentProducts, isLoaded])

  // Add a product to recently viewed
  const addProduct = useCallback((product: Omit<RecentProduct, 'viewedAt'>) => {
    setRecentProducts(prev => {
      // Remove if already exists
      const filtered = prev.filter(p => p.id !== product.id)
      // Add to front with timestamp
      const newProduct: RecentProduct = {
        ...product,
        viewedAt: Date.now(),
      }
      // Keep only MAX_ITEMS
      return [newProduct, ...filtered].slice(0, MAX_ITEMS)
    })
  }, [])

  // Clear all recently viewed
  const clearAll = useCallback(() => {
    setRecentProducts([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Get products excluding a specific ID (useful when on product page)
  const getExcluding = useCallback((excludeId: string) => {
    return recentProducts.filter(p => p.id !== excludeId)
  }, [recentProducts])

  return {
    recentProducts,
    addProduct,
    clearAll,
    getExcluding,
    isLoaded,
  }
}
