'use client'

import { useState } from 'react'
import { ZoomIn, X } from 'lucide-react'

interface ImageZoomProps {
  src: string
  alt: string
  className?: string
}

export default function ImageZoom({ src, alt, className = '' }: ImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setMousePosition({ x, y })
  }

  return (
    <>
      {/* Main Image */}
      <div
        className={`relative group cursor-zoom-in ${className}`}
        onClick={() => setIsZoomed(true)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="eager"
        />

        {/* Zoom Indicator */}
        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-4 h-4" />
          <span className="text-sm font-semibold">คลิกเพื่อซูม</span>
        </div>
      </div>

      {/* Zoomed Overlay */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsZoomed(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Instructions */}
          <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-semibold">
            เลื่อนเมาส์เพื่อดูรายละเอียด • คลิกเพื่อปิด
          </div>

          {/* Zoomable Image Container */}
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-zoom-out"
            onMouseMove={handleMouseMove}
          >
            <img
              src={src}
              alt={alt}
              className="max-w-[90%] max-h-[90%] object-contain transition-transform duration-100"
              style={{
                transform: `scale(2) translate(${(50 - mousePosition.x) * 0.5}%, ${(50 - mousePosition.y) * 0.5}%)`,
                transformOrigin: 'center center',
              }}
            />
          </div>

          {/* Zoom Level Indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold">
            200% ซูม
          </div>
        </div>
      )}
    </>
  )
}
