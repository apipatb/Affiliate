'use client'

import { useComparison } from '@/hooks/useComparison'
import { Scale } from 'lucide-react'
import { motion } from 'framer-motion'

interface ComparisonButtonProps {
  productId: string
  productTitle: string
  price: number
  imageUrl: string
  categoryName: string
  rating?: number
  reviewCount?: number
  originalPrice?: number | null
  clicks?: number
  description?: string
  variant?: 'small' | 'large'
}

export default function ComparisonButton({
  productId,
  productTitle,
  price,
  imageUrl,
  categoryName,
  rating,
  reviewCount,
  originalPrice,
  clicks,
  description,
  variant = 'small',
}: ComparisonButtonProps) {
  const { toggleComparison, isInComparison, isFull } = useComparison()
  const inComparison = isInComparison(productId)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!inComparison && isFull) {
      alert('สามารถเปรียบเทียบได้สูงสุด 4 สินค้าเท่านั้น')
      return
    }

    toggleComparison({
      id: productId,
      title: productTitle,
      price,
      imageUrl,
      categoryName,
      rating,
      reviewCount,
      originalPrice,
      clicks,
      description,
    })
  }

  if (variant === 'small') {
    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        disabled={!inComparison && isFull}
        className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all ${
          inComparison
            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
        } ${!inComparison && isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Scale className={`w-4 h-4 ${inComparison ? 'fill-white' : ''}`} />
      </motion.button>
    )
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      disabled={!inComparison && isFull}
      className={`w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
        inComparison
          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'
          : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
      } ${!inComparison && isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Scale className={`w-5 h-5 ${inComparison ? 'fill-white' : ''}`} />
      {inComparison ? 'ลบจากการเปรียบเทียบ' : 'เพิ่มเพื่อเปรียบเทียบ'}
    </motion.button>
  )
}
