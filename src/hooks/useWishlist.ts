'use client'

import { useEffect, useState } from 'react'

interface WishlistItem {
  id: string
  title: string
  price: number
  imageUrl: string
  categoryName: string
}

const STORAGE_KEY = 'wishlist'

export function useWishlist() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setWishlist(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse wishlist:', e)
      }
    }
  }, [])

  const addToWishlist = (item: WishlistItem) => {
    setWishlist((prev) => {
      // Check if already in wishlist
      if (prev.some((p) => p.id === item.id)) {
        return prev
      }

      const updated = [...prev, item]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => {
      const updated = prev.filter((item) => item.id !== productId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId)
  }

  const toggleWishlist = (item: WishlistItem) => {
    if (isInWishlist(item.id)) {
      removeFromWishlist(item.id)
    } else {
      addToWishlist(item)
    }
  }

  const clearWishlist = () => {
    setWishlist([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
    count: wishlist.length,
  }
}
