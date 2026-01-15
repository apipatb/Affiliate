'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Gift } from 'lucide-react'

export default function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    // Check if user has already seen or dismissed the popup
    const hasSeenPopup = localStorage.getItem('newsletterPopupDismissed')
    const hasSubscribed = localStorage.getItem('newsletterSubscribed')

    if (hasSeenPopup || hasSubscribed) {
      return
    }

    // Show popup after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('newsletterPopupDismissed', 'true')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Here you would normally send the email to your backend
    // For now, we'll just simulate success
    setIsSubmitted(true)
    localStorage.setItem('newsletterSubscribed', 'true')

    // Close popup after 2 seconds
    setTimeout(() => {
      setIsVisible(false)
    }, 2000)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>

        {/* Content */}
        {!isSubmitted ? (
          <div className="p-8">
            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-extrabold text-center text-slate-900 dark:text-white mb-2">
              รับส่วนลดพิเศษ 10%!
            </h2>

            {/* Description */}
            <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
              สมัครรับข่าวสารและโปรโมชั่นพิเศษ รับส่วนลดทันทีสำหรับการสั่งซื้อครั้งแรก
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="อีเมลของคุณ"
                  required
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-primary dark:focus:border-blue-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                รับส่วนลด 10%
              </button>
            </form>

            {/* Fine Print */}
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
              เราเคารพความเป็นส่วนตัวของคุณ ยกเลิกได้ทุกเมื่อ
            </p>
          </div>
        ) : (
          // Success State
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
              สำเร็จ!
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              ตรวจสอบอีเมลของคุณเพื่อรับโค้ดส่วนลด 10%
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
