'use client'

import { useEffect } from 'react'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'

interface TrackProductViewProps {
  productId: string
  productTitle: string
  price: number
  imageUrl: string
}

export default function TrackProductView({
  productId,
  productTitle,
  price,
  imageUrl,
}: TrackProductViewProps) {
  const { addProduct } = useRecentlyViewed()

  useEffect(() => {
    // Add product to recently viewed after a short delay
    const timer = setTimeout(() => {
      addProduct({
        id: productId,
        title: productTitle,
        price,
        imageUrl,
      })
    }, 1000) // Wait 1 second to ensure user is actually viewing the product

    return () => clearTimeout(timer)
  }, [productId, productTitle, price, imageUrl, addProduct])

  return null // This component doesn't render anything
}
