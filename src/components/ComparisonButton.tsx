'use client'

import { useComparison } from '@/hooks/useComparison'
import { Scale, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

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
  const { toggleComparison, isInComparison, isFull, count } = useComparison()
  const inComparison = isInComparison(productId)
  const [justAdded, setJustAdded] = useState(false)

  // Show feedback when added
  useEffect(() => {
    if (inComparison && !justAdded) {
      setJustAdded(true)
      const timer = setTimeout(() => setJustAdded(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [inComparison])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    console.log('Comparison button clicked:', {
      productId,
      inComparison,
      isFull,
      count,
    })

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

    console.log('After toggle, count should be:', count + (inComparison ? -1 : 1))
  }

  if (variant === 'small') {
    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        animate={justAdded ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
        onClick={handleClick}
        disabled={!inComparison && isFull}
        title={inComparison ? 'ลบจากการเปรียบเทียบ' : 'เพิ่มเพื่อเปรียบเทียบ'}
        className={`relative w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all ${
          inComparison
            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
        } ${!inComparison && isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <AnimatePresence mode="wait">
          {justAdded ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.2 }}
            >
              <Check className="w-4 h-4 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="scale"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Scale className={`w-4 h-4 ${inComparison ? 'fill-white' : ''}`} />
            </motion.div>
          )}
        </AnimatePresence>
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
