'use client'

import { X, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'

interface VideoPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl: string
  title: string
}

export default function VideoPlayerModal({
  isOpen,
  onClose,
  videoUrl,
  title,
}: VideoPlayerModalProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          exitFullscreen()
        } else {
          onClose()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose, isFullscreen])

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
        setIsFullscreen(false)
      } catch (error) {
        console.error('Exit fullscreen error:', error)
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-sm"
          />

          {/* Modal */}
          <div
            ref={containerRef}
            className="absolute inset-0 flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-6xl bg-black rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white line-clamp-2 flex-1">
                    {title}
                  </h3>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Video Player */}
              <div className="relative aspect-video bg-black">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full"
                  autoPlay
                  loop
                  controls
                  playsInline
                  muted={isMuted}
                />

                {/* Custom Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6">
                  <div className="flex items-center justify-end gap-3">
                    {/* Mute Toggle */}
                    <button
                      onClick={toggleMute}
                      className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
                      title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </button>

                    {/* Fullscreen Toggle */}
                    <button
                      onClick={toggleFullscreen}
                      className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
                      title={isFullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-5 h-5 text-white" />
                      ) : (
                        <Maximize2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts Hint */}
              <div className="absolute top-20 right-4 sm:right-6 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs opacity-60 pointer-events-none">
                กด ESC เพื่อปิด
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
