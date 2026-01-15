'use client'

import { useState } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LiveChatBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // Here you would integrate with your chat service (e.g., Line, Facebook Messenger, etc.)
    const lineUrl = `https://line.me/R/ti/p/@your-line-id?text=${encodeURIComponent(message)}`
    window.open(lineUrl, '_blank')

    setMessage('')
    setIsOpen(false)
  }

  return (
    <>
      {/* Chat Bubble Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 group"
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <MessageCircle className="w-7 h-7 text-white fill-white" />
        )}

        {/* Notification Badge */}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
          >
            1
          </motion.div>
        )}

        {/* Pulse Animation */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 left-6 z-50 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold">แชทกับเรา</h3>
                  <p className="text-white/80 text-xs">ออนไลน์ตอบกลับทันที</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-3 h-64 overflow-y-auto bg-slate-50 dark:bg-slate-900">
              {/* Bot Message */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none p-3 shadow-sm max-w-[80%]">
                  <p className="text-sm text-slate-900 dark:text-white">
                    สวัสดีครับ! 👋
                  </p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">
                    มีอะไรให้ช่วยไหมครับ?
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    เพียงแค่ 1 นาที
                  </p>
                </div>
              </motion.div>

              {/* Quick Replies */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-2 pl-10"
              >
                <button
                  onClick={() => setMessage('สอบถามข้อมูลสินค้า')}
                  className="text-left text-sm bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 transition-colors"
                >
                  📦 สอบถามข้อมูลสินค้า
                </button>
                <button
                  onClick={() => setMessage('ติดตามสถานะคำสั่งซื้อ')}
                  className="text-left text-sm bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 transition-colors"
                >
                  🚚 ติดตามสถานะคำสั่งซื้อ
                </button>
                <button
                  onClick={() => setMessage('สอบถามโปรโมชั่น')}
                  className="text-left text-sm bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 transition-colors"
                >
                  🎁 สอบถามโปรโมชั่น
                </button>
              </motion.div>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="พิมพ์ข้อความ..."
                  className="flex-1 px-4 py-2 border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-slate-300 disabled:to-slate-400 text-white p-2 rounded-xl transition-all disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                Powered by Line Official Account
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
