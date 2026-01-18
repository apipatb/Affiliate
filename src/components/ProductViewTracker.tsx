'use client'

import { useEffect } from 'react'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'

interface ProductViewTrackerProps {
  product: {
    id: string
    title: string
    price: number
    imageUrl: string
  }
}

export default function ProductViewTracker({ product }: ProductViewTrackerProps) {
  const { addProduct } = useRecentlyViewed()

  useEffect(() => {
    // Add product to recently viewed when component mounts
    addProduct({
      id: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
    })
  }, [product.id, product.title, product.price, product.imageUrl, addProduct])

  // This component doesn't render anything
  return null
}
