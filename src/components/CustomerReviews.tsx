'use client'

import { Star, ThumbsUp, User, VerifiedIcon, X, Send, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface ReviewMedia {
  id: string
  url: string
  type: 'IMAGE' | 'VIDEO'
  order: number
}

interface Review {
  id: string
  userName: string
  rating: number
  comment: string
  createdAt: string
  verified: boolean
  helpful: number
  media?: ReviewMedia[]
}

interface ReviewsResponse {
  reviews: Review[]
  total: number
  totalPages: number
  currentPage: number
  averageRating: number
  distribution: { [key: number]: number }
}

interface CustomerReviewsProps {
  productId: string
  productRating: number
  reviewCount: number
}

export default function CustomerReviews({
  productId,
  productRating: initialRating,
  reviewCount: initialCount,
}: CustomerReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<'all' | number>('all')
  const [helpfulClicked, setHelpfulClicked] = useState<Set<string>>(new Set())
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [total, setTotal] = useState(initialCount)
  const [averageRating, setAverageRating] = useState(initialRating)
  const [distribution, setDistribution] = useState<{ [key: number]: number }>({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Form state
  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    rating: 5,
    comment: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch reviews
  const fetchReviews = async (filterRating?: number, pageNum: number = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: pageNum.toString(), limit: '10' })
      if (filterRating) {
        params.set('rating', filterRating.toString())
      }

      const res = await fetch(`/api/products/${productId}/reviews?${params}`)
      const data: ReviewsResponse = await res.json()

      if (pageNum === 1) {
        setReviews(data.reviews)
      } else {
        setReviews(prev => [...prev, ...data.reviews])
      }
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setAverageRating(data.averageRating)
      setDistribution(data.distribution)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const handleFilterChange = (filter: 'all' | number) => {
    setSelectedFilter(filter)
    setPage(1)
    fetchReviews(filter === 'all' ? undefined : filter, 1)
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchReviews(selectedFilter === 'all' ? undefined : selectedFilter, nextPage)
  }

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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitMessage(null)

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmitMessage({ type: 'success', text: data.message })
        setFormData({ userName: '', userEmail: '', rating: 5, comment: '' })
        setShowWriteReview(false)
        // Refresh reviews
        fetchReviews()
      } else {
        setSubmitMessage({ type: 'error', text: data.error })
      }
    } catch {
      setSubmitMessage({ type: 'error', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่' })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: distribution[rating] || 0,
    percentage: total > 0 ? ((distribution[rating] || 0) / total) * 100 : 0,
  }))

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          รีวิวจากลูกค้า
        </h2>
        <button
          onClick={() => setShowWriteReview(!showWriteReview)}
          className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          เขียนรีวิว
        </button>
      </div>

      {/* Write Review Form */}
      {showWriteReview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8 p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-primary/20"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            แบ่งปันประสบการณ์ของคุณ
          </h3>

          {submitMessage && (
            <div className={`mb-4 p-3 rounded-lg ${
              submitMessage.type === 'success'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {submitMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                ให้คะแนน *
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= formData.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                ชื่อของคุณ *
              </label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                placeholder="เช่น สมชาย ใจดี"
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:outline-none"
                required
              />
            </div>

            {/* Email (optional) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                อีเมล (ไม่บังคับ)
              </label>
              <input
                type="email"
                value={formData.userEmail}
                onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                placeholder="example@email.com"
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">ใส่อีเมลเพื่อรับการแจ้งเตือนเมื่อมีคนตอบรีวิวของคุณ</p>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                ความคิดเห็น *
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="บอกเล่าประสบการณ์การใช้งานสินค้า... (อย่างน้อย 10 ตัวอักษร)"
                rows={4}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:outline-none resize-none"
                required
                minLength={10}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    ส่งรีวิว
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowWriteReview(false)}
                className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-6 py-3 rounded-lg transition-colors hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Rating Summary */}
      <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
        {/* Overall Rating */}
        <div className="flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900 rounded-xl p-6">
          <div className="text-5xl font-extrabold text-primary dark:text-blue-400 mb-2">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-6 h-6 ${
                  i < Math.floor(averageRating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : i < Math.ceil(averageRating)
                    ? 'text-yellow-400 fill-yellow-400 opacity-50'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            จาก {total.toLocaleString('th-TH')} รีวิว
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <button
              key={rating}
              onClick={() => handleFilterChange(rating)}
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
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            selectedFilter === 'all'
              ? 'bg-primary text-white'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          ทั้งหมด ({total})
        </button>
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            onClick={() => handleFilterChange(rating)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              selectedFilter === rating
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {rating} ดาว ({distribution[rating] || 0})
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {loading && reviews.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-slate-600 dark:text-slate-400">กำลังโหลดรีวิว...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            {selectedFilter !== 'all' ? (
              <>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  ไม่มีรีวิว {selectedFilter} ดาว
                </p>
                <button
                  onClick={() => handleFilterChange('all')}
                  className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold px-6 py-3 rounded-lg transition-colors"
                >
                  ดูรีวิวทั้งหมด
                </button>
              </>
            ) : (
              <>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  ยังไม่มีรีวิวสำหรับสินค้านี้
                </p>
                <button
                  onClick={() => setShowWriteReview(true)}
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg transition-colors"
                >
                  เป็นคนแรกที่รีวิว!
                </button>
              </>
            )}
          </div>
        ) : (
          reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
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
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                {review.comment}
              </p>

              {/* Review Media (Photos/Videos) */}
              {review.media && review.media.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {review.media.map((media) => (
                    <button
                      key={media.id}
                      onClick={() => media.type === 'IMAGE' && setSelectedImage(media.url)}
                      className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-blue-400 transition-colors"
                    >
                      {media.type === 'IMAGE' ? (
                        <img
                          src={media.url}
                          alt={`รีวิวจาก ${review.userName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="relative w-full h-full">
                          <video
                            src={media.url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                              <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

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
      {reviews.length > 0 && page < totalPages && (
        <div className="mt-8 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังโหลด...
              </span>
            ) : (
              'โหลดรีวิวเพิ่มเติม'
            )}
          </button>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-4xl max-h-[90vh]"
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img
              src={selectedImage}
              alt="รีวิวสินค้า"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </motion.div>
        </div>
      )}
    </div>
  )
}
