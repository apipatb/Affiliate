'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from './ProductCard'
import { motion, AnimatePresence } from 'framer-motion'

interface Product {
  id: string
  title: string
  description: string
  price: number
  affiliateUrl: string
  imageUrl: string
  mediaType: 'IMAGE' | 'VIDEO'
  categoryId: string
  category: {
    id: string
    name: string
    slug: string
  }
  clicks: number
  featured: boolean
  createdAt: string | Date
  updatedAt?: string | Date
}

interface ProductCarouselProps {
  products: Product[]
  autoPlay?: boolean
  interval?: number
}

export default function ProductCarousel({ products, autoPlay = true, interval = 5000 }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(3)

  // Update items per page based on screen size
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 640) {
        setItemsPerPage(1) // Mobile: 1 item
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(2) // Tablet: 2 items
      } else {
        setItemsPerPage(3) // Desktop: 3 items
      }
    }

    updateItemsPerPage()
    window.addEventListener('resize', updateItemsPerPage)
    return () => window.removeEventListener('resize', updateItemsPerPage)
  }, [])

  const maxIndex = Math.max(0, products.length - itemsPerPage)

  useEffect(() => {
    if (!autoPlay || products.length <= itemsPerPage) return

    const timer = setInterval(() => {
      next()
    }, interval)

    return () => clearInterval(timer)
  }, [currentIndex, autoPlay, interval, products.length])

  const next = () => {
    setDirection(1)
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }

  const prev = () => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
  }

  const goTo = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  if (products.length === 0) return null

  const visibleProducts = products.slice(currentIndex, currentIndex + itemsPerPage)
  const shouldShowControls = products.length > itemsPerPage

  return (
    <div className="relative">
      {/* Products */}
      <div className="overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {shouldShowControls && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6 text-black dark:text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6 text-black dark:text-white" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {shouldShowControls && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-primary'
                  : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
