'use client'

import { useState } from 'react'
import {
  Sparkles,
  Loader2,
  Check,
  Copy,
  Hash,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface CaptionVersion {
  style: string
  caption: string
  hashtags: string[]
  tone: string
  emoji?: string
  styleDescription?: string
}

interface AICaptionGeneratorProps {
  productName: string
  productDescription?: string
  hooks?: string
  category?: string
  onSelectCaption: (caption: string, hashtags: string[]) => void
  currentCaption?: string
  currentHashtags?: string[]
}

export default function AICaptionGenerator({
  productName,
  productDescription,
  hooks,
  category,
  onSelectCaption,
  currentCaption,
  currentHashtags = [],
}: AICaptionGeneratorProps) {
  const [versions, setVersions] = useState<CaptionVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [trendingTags, setTrendingTags] = useState<string[]>([])

  const generateCaptions = async () => {
    if (!productName) {
      setError('กรุณาใส่ชื่อสินค้า')
      return
    }

    setLoading(true)
    setError(null)
    setVersions([])
    setSelectedIndex(null)

    try {
      // Fetch captions and trending tags in parallel
      const [captionsRes, trendingRes] = await Promise.all([
        fetch('/api/tiktok/generate-captions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName,
            productDescription,
            hooks,
            category,
            count: 4,
          }),
        }),
        fetch(`/api/tiktok/generate-captions?category=${category || 'general'}`),
      ])

      const captionsData = await captionsRes.json()
      const trendingData = await trendingRes.json()

      if (captionsData.success) {
        setVersions(captionsData.versions)
        setIsExpanded(true)
      } else {
        throw new Error(captionsData.error || 'Failed to generate')
      }

      if (trendingData.success) {
        setTrendingTags(trendingData.trending)
      }
    } catch (err: any) {
      console.error('Generate captions error:', err)
      setError(err.message || 'ไม่สามารถสร้าง Caption ได้')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (index: number) => {
    const version = versions[index]
    setSelectedIndex(index)
    onSelectCaption(version.caption, version.hashtags)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const styleColors: Record<string, string> = {
    viral: 'from-red-500 to-orange-500',
    professional: 'from-blue-500 to-indigo-500',
    friendly: 'from-pink-500 to-rose-500',
    urgent: 'from-amber-500 to-yellow-500',
    storytelling: 'from-purple-500 to-violet-500',
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="font-medium text-sm text-black dark:text-white">
            AI Caption Generator
          </span>
          {versions.length > 0 && (
            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
              {versions.length} เวอร์ชัน
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                generateCaptions()
              }}
              className="flex items-center gap-1 px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
            >
              <Zap className="w-3 h-3" />
              Generate
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <span className="ml-2 text-slate-500">กำลังสร้าง Caption...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Versions */}
          {versions.length > 0 && (
            <div className="space-y-2">
              {versions.map((version, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedIndex === index
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                  }`}
                  onClick={() => handleSelect(index)}
                >
                  {/* Style Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white bg-gradient-to-r ${
                        styleColors[version.style] || 'from-gray-500 to-gray-600'
                      }`}
                    >
                      {version.emoji} {version.style}
                    </span>
                    <div className="flex items-center gap-1">
                      {selectedIndex === index && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopy(version.caption)
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                        title="คัดลอก"
                      >
                        <Copy className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Caption */}
                  <p className="text-sm text-black dark:text-white mb-2">
                    {version.caption}
                  </p>

                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-1">
                    {version.hashtags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Tone */}
                  <p className="text-xs text-slate-500 mt-2">
                    โทน: {version.tone}
                  </p>
                </div>
              ))}

              {/* Regenerate Button */}
              <button
                onClick={generateCaptions}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RefreshCw className="w-4 h-4" />
                สร้างเวอร์ชันใหม่
              </button>
            </div>
          )}

          {/* Trending Hashtags */}
          {trendingTags.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-medium text-slate-500">Trending Hashtags</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {trendingTags.map((tag, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (!currentHashtags.includes(tag)) {
                        onSelectCaption(currentCaption || '', [...currentHashtags, tag])
                      }
                    }}
                    disabled={currentHashtags.includes(tag)}
                    className={`text-xs px-2 py-1 rounded-full transition-all ${
                      currentHashtags.includes(tag)
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 cursor-not-allowed'
                        : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 hover:bg-pink-200'
                    }`}
                  >
                    {tag}
                    {currentHashtags.includes(tag) && ' ✓'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && versions.length === 0 && !error && (
            <div className="text-center py-6 text-slate-500">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">คลิก "Generate" เพื่อสร้าง Caption หลายเวอร์ชัน</p>
              <p className="text-xs mt-1">AI จะสร้าง Caption 4 สไตล์ให้เลือก</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
