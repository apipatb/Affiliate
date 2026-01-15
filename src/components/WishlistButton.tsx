'use client'

import { Heart } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import { useState, useEffect } from 'react'

interface WishlistButtonProps {
  productId: string
  productTitle: string
  price: number
  imageUrl: string
  categoryName: string
  variant?: 'small' | 'large'
}

export default function WishlistButton({
  productId,
  productTitle,
  price,
  imageUrl,
  categoryName,
  variant = 'large',
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const [isFavorite, setIsFavorite] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    setIsFavorite(isInWishlist(productId))
  }, [productId, isInWishlist])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    toggleWishlist({
      id: productId,
      title: productTitle,
      price,
      imageUrl,
      categoryName,
    })

    setIsFavorite(!isFavorite)

    // Show animation
    setShowAnimation(true)
    setTimeout(() => setShowAnimation(false), 600)
  }

  if (variant === 'small') {
    return (
      <button
        onClick={handleClick}
        className={`p-2 rounded-full transition-all ${
          isFavorite
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-white/90 dark:bg-slate-800/90 hover:bg-red-50 dark:hover:bg-red-900/20'
        } shadow-lg backdrop-blur-sm ${showAnimation ? 'scale-125' : 'scale-100'}`}
        title={isFavorite ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
      >
        <Heart
          className={`w-5 h-5 transition-all ${
            isFavorite
              ? 'text-white fill-white'
              : 'text-red-500 dark:text-red-400'
          } ${showAnimation ? 'animate-pulse' : ''}`}
        />
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg ${
        isFavorite
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-600'
      } ${showAnimation ? 'scale-110' : 'scale-100'}`}
    >
      <Heart
        className={`w-5 h-5 transition-all ${
          isFavorite ? 'fill-white' : ''
        } ${showAnimation ? 'animate-pulse' : ''}`}
      />
      <span className="hidden sm:inline">
        {isFavorite ? 'บันทึกแล้ว' : 'บันทึกสินค้า'}
      </span>
    </button>
  )
}
