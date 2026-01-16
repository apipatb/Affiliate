'use client'

import { useState } from 'react'
import { Share2, Facebook, Twitter, Link as LinkIcon, Check } from 'lucide-react'

interface ShareButtonsProps {
  url: string
  title: string
  description?: string
}

export default function ShareButtons({ url, title, description }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url
  const encodedUrl = encodeURIComponent(fullUrl)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = description ? encodeURIComponent(description) : ''

  const handleCopyLink = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        // Fallback for HTTP or older browsers
        const textArea = document.createElement('textarea')
        textArea.value = fullUrl
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        textArea.style.top = '-9999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
          const successful = document.execCommand('copy')
          if (successful) {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }
        } catch (fallbackErr) {
          console.error('Fallback copy failed:', fallbackErr)
          alert('ไม่สามารถคัดลอกลิงก์ได้ กรุณาคัดลอกด้วยตัวเอง: ' + fullUrl)
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err)
      // Show fallback message
      alert('ไม่สามารถคัดลอกลิงก์ได้ กรุณาคัดลอกด้วยตัวเอง: ' + fullUrl)
    }
  }

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
  }

  return (
    <div className="relative">
      {/* Share Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">แชร์</span>
      </button>

      {/* Share Menu Dropdown */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
              แชร์ไปที่
            </p>

            <div className="space-y-2">
              {/* Facebook */}
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Facebook className="w-5 h-5 text-white fill-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">Facebook</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">แชร์ไปยัง Facebook</p>
                </div>
              </a>

              {/* Twitter */}
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors group"
              >
                <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Twitter className="w-5 h-5 text-white fill-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">Twitter</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">แชร์ไปยัง Twitter</p>
                </div>
              </a>

              {/* Line */}
              <a
                href={shareLinks.line}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group"
              >
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">Line</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">แชร์ไปยัง Line</p>
                </div>
              </a>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
              >
                <div className="w-10 h-10 bg-slate-600 dark:bg-slate-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  {copied ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <LinkIcon className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {copied ? 'พร้อมแชร์แล้ว' : 'คัดลอก URL'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
