'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'affiliate_comparison'
const MAX_ITEMS = 4
const STORAGE_EVENT = 'comparison-updated'

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

// Helper function to get comparison from localStorage
const getStoredComparison = (): ComparisonItem[] => {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.error('Failed to parse comparison:', e)
    return []
  }
}

// Helper function to save and trigger update
const saveComparison = (items: ComparisonItem[]) => {
  if (typeof window === 'undefined') return

  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  // Dispatch custom event to notify all components
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: items }))
}

export function useComparison() {
  const [comparison, setComparison] = useState<ComparisonItem[]>([])
  const [mounted, setMounted] = useState(false)

  // Load initial data
  useEffect(() => {
    setComparison(getStoredComparison())
    setMounted(true)
  }, [])

  // Listen for changes from other components
  useEffect(() => {
    const handleStorageChange = (e: CustomEvent<ComparisonItem[]>) => {
      setComparison(e.detail)
    }

    window.addEventListener(STORAGE_EVENT as any, handleStorageChange)

    return () => {
      window.removeEventListener(STORAGE_EVENT as any, handleStorageChange)
    }
  }, [])

  const addToComparison = (item: ComparisonItem) => {
    const current = getStoredComparison()

    if (current.length >= MAX_ITEMS) {
      alert(`สามารถเปรียบเทียบได้สูงสุด ${MAX_ITEMS} สินค้าเท่านั้น`)
      return
    }

    if (current.some(i => i.id === item.id)) {
      return
    }

    const newComparison = [...current, item]
    saveComparison(newComparison)
    setComparison(newComparison)
  }

  const removeFromComparison = (id: string) => {
    const current = getStoredComparison()
    const newComparison = current.filter((item) => item.id !== id)
    saveComparison(newComparison)
    setComparison(newComparison)
  }

  const isInComparison = (id: string) => {
    if (!mounted) return false
    return comparison.some((item) => item.id === id)
  }

  const toggleComparison = (item: ComparisonItem) => {
    const current = getStoredComparison()

    if (current.some(i => i.id === item.id)) {
      removeFromComparison(item.id)
    } else {
      addToComparison(item)
    }
  }

  const clearComparison = () => {
    saveComparison([])
    setComparison([])
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
