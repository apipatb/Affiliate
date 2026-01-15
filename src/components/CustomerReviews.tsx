'use client'

import { Star, ThumbsUp, User, VerifiedIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface Review {
  id: string
  userName: string
  rating: number
  comment: string
  date: string
  verified: boolean
  helpful: number
  images?: string[]
}

interface CustomerReviewsProps {
  productId: string
  productRating: number
  reviewCount: number
}

// Mock reviews data - in production, this would come from your database
const mockReviews: Review[] = [
  {
    id: '1',
    userName: 'สมชาย ใจดี',
    rating: 5,
    comment: 'สินค้าดีมาก คุณภาพเยี่ยม ตรงตามที่โฆษณา จัดส่งเร็วมาก แนะนำเลยครับ',
    date: '2026-01-10',
    verified: true,
    helpful: 24,
  },
  {
    id: '2',
    userName: 'วิภา สุขสันต์',
    rating: 4,
    comment: 'โดยรวมดีครับ แต่การจัดส่งช้าไปหน่อย สินค้าดีตามที่คาดหวัง',
    date: '2026-01-08',
    verified: true,
    helpful: 12,
  },
  {
    id: '3',
    userName: 'ประยุทธ์ มั่นคง',
    rating: 5,
    comment: 'ของดีมาก ราคาคุ้มค่า ใช้งานได้จริง แนะนำให้เพื่อนๆ ต่อแล้ว',
    date: '2026-01-05',
    verified: false,
    helpful: 8,
  },
  {
    id: '4',
    userName: 'สุดา ยิ้มแย้ม',
    rating: 5,
    comment: 'ประทับใจมากค่ะ บรรจุภัณฑ์ดี สินค้าไม่เสียหาย ใช้งานได้ดีเยี่ยม',
    date: '2026-01-03',
    verified: true,
    helpful: 15,
  },
  {
    id: '5',
    userName: 'อนุชา พรหมมา',
    rating: 3,
    comment: 'ตามราคา สินค้าก็โอเค แต่คุณภาพไม่เยี่ยมมาก อาจต้องปรับปรุง',
    date: '2025-12-28',
    verified: true,
    helpful: 5,
  },
]

export default function CustomerReviews({
  productId,
  productRating,
  reviewCount,
}: CustomerReviewsProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | number>('all')
  const [helpfulClicked, setHelpfulClicked] = useState<Set<string>>(new Set())

  const filteredReviews =
    selectedFilter === 'all'
      ? mockReviews
      : mockReviews.filter((review) => review.rating === selectedFilter)

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: mockReviews.filter((r) => r.rating === rating).length,
    percentage:
      (mockReviews.filter((r) => r.rating === rating).length / mockReviews.length) * 100,
  }))

  const handleHelpful = (reviewId: string) => {
    setHelpfulClicked((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId)
      } else {
        newSet.add(reviewId)
      }
      return newSet
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-6 lg:p-8">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        รีวิวจากลูกค้า
      </h2>

      {/* Rating Summary */}
      <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
        {/* Overall Rating */}
        <div className="flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900 rounded-xl p-6">
          <div className="text-5xl font-extrabold text-primary dark:text-blue-400 mb-2">
            {productRating.toFixed(1)}
          </div>
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-6 h-6 ${
                  i < Math.floor(productRating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : i < Math.ceil(productRating)
                    ? 'text-yellow-400 fill-yellow-400 opacity-50'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            จาก {reviewCount.toLocaleString('th-TH')} รีวิว
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <button
              key={rating}
              onClick={() => setSelectedFilter(rating)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${
                selectedFilter === rating ? 'bg-slate-100 dark:bg-slate-900' : ''
              }`}
            >
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {rating}
                </span>
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="flex-1">
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400 w-12 text-right">
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            selectedFilter === 'all'
              ? 'bg-primary text-white'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          ทั้งหมด ({mockReviews.length})
        </button>
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            onClick={() => setSelectedFilter(rating)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              selectedFilter === rating
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {rating} ดาว
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">
              ไม่มีรีวิวสำหรับตัวกรองนี้
            </p>
          </div>
        ) : (
          filteredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {review.userName}
                      </span>
                      {review.verified && (
                        <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                          <VerifiedIcon className="w-3 h-3" />
                          ซื้อแล้ว
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(review.date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                {review.comment}
              </p>

              {/* Review Footer */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleHelpful(review.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    helpfulClicked.has(review.id)
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <ThumbsUp
                    className={`w-4 h-4 ${
                      helpfulClicked.has(review.id) ? 'fill-current' : ''
                    }`}
                  />
                  เป็นประโยชน์ ({review.helpful + (helpfulClicked.has(review.id) ? 1 : 0)})
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {filteredReviews.length > 0 && filteredReviews.length < reviewCount && (
        <div className="mt-8 text-center">
          <button className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold px-8 py-3 rounded-xl transition-colors">
            โหลดรีวิวเพิ่มเติม
          </button>
        </div>
      )}
    </div>
  )
}
