'use client'

import { useComparison } from '@/hooks/useComparison'
import { Scale, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function ComparisonFloatingButton() {
  const { count, clearComparison } = useComparison()

  if (count === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Scale className="w-6 h-6 text-white fill-white" />
            </div>
            <div className="text-white">
              <p className="text-sm font-medium">เปรียบเทียบสินค้า</p>
              <p className="text-xs opacity-90">{count} จาก 4 สินค้า</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/compare"
              className="bg-white text-blue-600 font-bold px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
            >
              เปรียบเทียบตอนนี้
            </Link>
            <button
              onClick={clearComparison}
              className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
              title="ลบทั้งหมด"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
