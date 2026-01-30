'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import TikTokAccountManager from '@/components/TikTokAccountManager'
import AutoPipelineDashboard from '@/components/AutoPipelineDashboard'
import PostingCalendar from '@/components/PostingCalendar'
import BatchEditModal from '@/components/BatchEditModal'
import AICaptionGenerator from '@/components/AICaptionGenerator'
import {
  Video,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Copy,
  ExternalLink,
  Sparkles,
  Settings,
  Download,
  Search,
  Package,
  X,
  Film,
  Loader2,
  Upload,
  ImageIcon,
  Music,
  Type,
  Images,
  Eye,
  FileDown,
  CopyPlus,
  BookTemplate,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart,
  Calendar,
  CalendarClock,
  Hash,
  Send,
  Zap,
  Rocket,
  RotateCcw,
  AlertTriangle
} from 'lucide-react'

interface TikTokJob {
  id: string
  productid: string
  internalProductId?: string // Link to internal Product
  affiliateUrl?: string // Affiliate URL to platform
  productName?: string
  productImage?: string
  productImages?: string[]
  hooking?: string
  hook2?: string
  hook3?: string
  ending?: string
  final_video?: string
  caption?: string
  hashtags?: string[]
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED'
  error?: string
  scheduledAt?: string // When to auto-post
  postedAt?: string // When actually posted
  createdAt: string
  updatedAt: string
}

// Video generation options
interface VideoOptions {
  backgroundMusic: string | null
  musicVolume: number
  showTextOverlay: boolean
  textStyle: 'minimal' | 'bold' | 'neon' | 'simple'
  watermark: WatermarkOptions
}

interface WatermarkOptions {
  enabled: boolean
  type: 'image' | 'text'
  imagePath: string
  text: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  opacity: number
  scale: number
}

const WATERMARK_POSITIONS = [
  { value: 'top-left', label: '↖️ บนซ้าย' },
  { value: 'top-right', label: '↗️ บนขวา' },
  { value: 'bottom-left', label: '↙️ ล่างซ้าย' },
  { value: 'bottom-right', label: '↘️ ล่างขวา' },
  { value: 'center', label: '⬛ ตรงกลาง' },
]

const MUSIC_OPTIONS = [
  { value: '', label: 'ไม่มีเพลง' },
  { value: 'upbeat', label: '🎵 Upbeat (สนุกสนาน)' },
  { value: 'chill', label: '🎶 Chill (ผ่อนคลาย)' },
  { value: 'energetic', label: '⚡ Energetic (มีพลัง)' },
  { value: 'corporate', label: '💼 Corporate (มืออาชีพ)' },
]

const TEXT_STYLE_OPTIONS = [
  { value: 'bold', label: '🅱️ Bold (ตัวหนา)' },
  { value: 'minimal', label: '✨ Minimal (เรียบง่าย)' },
  { value: 'neon', label: '💚 Neon (เรืองแสง)' },
  { value: 'simple', label: '📝 Simple (เหลืองดำ)' },
]

// Default watermark settings
const DEFAULT_WATERMARK: WatermarkOptions = {
  enabled: false,
  type: 'text',
  imagePath: '/images/logo.png',
  text: '@YourChannel',
  position: 'bottom-right',
  opacity: 0.7,
  scale: 0.15,
}

// Video template presets
const VIDEO_TEMPLATES: { id: string; name: string; description: string; settings: Omit<VideoOptions, 'watermark'> }[] = [
  {
    id: 'flash-sale',
    name: '🔥 Flash Sale',
    description: 'สำหรับโปรโมชั่นลดราคา',
    settings: {
      backgroundMusic: 'energetic',
      musicVolume: 0.4,
      showTextOverlay: true,
      textStyle: 'neon' as const,
    }
  },
  {
    id: 'product-review',
    name: '⭐ Product Review',
    description: 'รีวิวสินค้าแบบมืออาชีพ',
    settings: {
      backgroundMusic: 'chill',
      musicVolume: 0.25,
      showTextOverlay: true,
      textStyle: 'minimal' as const,
    }
  },
  {
    id: 'unboxing',
    name: '📦 Unboxing',
    description: 'แกะกล่องสินค้าใหม่',
    settings: {
      backgroundMusic: 'upbeat',
      musicVolume: 0.35,
      showTextOverlay: true,
      textStyle: 'bold' as const,
    }
  },
  {
    id: 'tutorial',
    name: '📚 Tutorial',
    description: 'สอนวิธีใช้งานสินค้า',
    settings: {
      backgroundMusic: 'corporate',
      musicVolume: 0.2,
      showTextOverlay: true,
      textStyle: 'simple' as const,
    }
  },
  {
    id: 'minimal',
    name: '🎯 Minimal',
    description: 'เรียบง่าย ไม่มีเพลง',
    settings: {
      backgroundMusic: null,
      musicVolume: 0,
      showTextOverlay: false,
      textStyle: 'minimal' as const,
    }
  },
]

const PLATFORM_COLORS: Record<string, string> = {
  SHOPEE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  LAZADA: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  TIKTOK: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  AMAZON: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  DONE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_ICONS = {
  PENDING: Clock,
  PROCESSING: RefreshCw,
  DONE: CheckCircle,
  FAILED: AlertCircle,
}

interface Product {
  id: string
  title: string
  imageUrl: string
  price: number
  platform: string
  affiliateUrl: string
}

// Extract platform product ID from affiliate URL (returns ID only, no prefix)
function extractPlatformProductId(url: string, platform: string): string {
  try {
    // Shopee: https://shopee.co.th/xxx-i.{shop_id}.{item_id} or https://s.shopee.co.th/xxx
    if (platform === 'SHOPEE' || url.includes('shopee')) {
      // Standard format: -i.{shop_id}.{item_id}
      const match = url.match(/-i\.(\d+)\.(\d+)/)
      if (match) {
        return match[2] // Return item_id only
      }
      // Short link format: s.shopee.co.th/{code}
      const shortMatch = url.match(/s\.shopee\.[^/]+\/([^/?]+)/)
      if (shortMatch) {
        return shortMatch[1] // Return code only, no prefix
      }
    }

    // Lazada: https://www.lazada.co.th/products/xxx-i{item_id}.html
    if (platform === 'LAZADA' || url.includes('lazada')) {
      const match = url.match(/-i(\d+)/)
      if (match) {
        return match[1]
      }
    }

    // Amazon: https://www.amazon.com/dp/{ASIN}
    if (platform === 'AMAZON' || url.includes('amazon')) {
      const match = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/)
      if (match) {
        return match[1]
      }
    }

    // TikTok Shop: https://shop.tiktok.com/product/{id}
    if (platform === 'TIKTOK' || url.includes('tiktok')) {
      const match = url.match(/\/product\/(\d+)/)
      if (match) {
        return match[1]
      }
    }
  } catch (e) {
    console.error('Failed to extract product ID from URL:', url, e)
  }

  // Fallback: return partial hash from URL (no prefix, will be added by caller)
  return url.slice(-12).replace(/[^a-zA-Z0-9]/g, '')
}

export default function TikTokDashboard() {
  const [jobs, setJobs] = useState<TikTokJob[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingJob, setEditingJob] = useState<TikTokJob | null>(null)
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [generatingVideo, setGeneratingVideo] = useState<Set<string>>(new Set())
  const [showVideoOptions, setShowVideoOptions] = useState<string | null>(null)
  const [videoOptions, setVideoOptions] = useState<VideoOptions>({
    backgroundMusic: null,
    musicVolume: 0.3,
    showTextOverlay: false,
    textStyle: 'bold',
    watermark: {
      enabled: false,
      type: 'text',
      imagePath: '/images/logo.png',
      text: '@YourChannel',
      position: 'bottom-right',
      opacity: 0.7,
      scale: 0.15,
    }
  })
  const [previewVideo, setPreviewVideo] = useState<TikTokJob | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [progressData, setProgressData] = useState<Record<string, { progress: number, step: string }>>({})
  const [postingToTikTok, setPostingToTikTok] = useState<Set<string>>(new Set())
  const [runningPipeline, setRunningPipeline] = useState<Set<string>>(new Set())
  const [retryingJobs, setRetryingJobs] = useState<Set<string>>(new Set())
  const [showBatchEdit, setShowBatchEdit] = useState(false)

  // Poll for progress of generating videos
  useEffect(() => {
    if (generatingVideo.size === 0) {
      setProgressData({})
      return
    }

    const interval = setInterval(async () => {
      try {
        const ids = Array.from(generatingVideo).join(',')
        const res = await fetch(`/api/tiktok/jobs/progress?ids=${ids}`)
        if (res.ok) {
          const data = await res.json()
          const newProgress: Record<string, { progress: number, step: string }> = {}
          data.jobs.forEach((job: any) => {
            newProgress[job.id] = {
              progress: job.progress || 0,
              step: job.progressStep || 'กำลังประมวลผล...',
            }
            // If job completed, remove from generating set
            if (job.status !== 'PROCESSING' && job.videoUrl) {
              setGeneratingVideo(prev => {
                const next = new Set(prev)
                next.delete(job.id)
                return next
              })
              fetchJobs() // Refresh jobs list
            }
          })
          setProgressData(newProgress)
        }
      } catch (e) {
        console.error('Progress fetch error:', e)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [generatingVideo])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const url = filter === 'all' ? '/api/tiktok/jobs' : `/api/tiktok/jobs?status=${filter}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setJobs(data)
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [filter])

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบรายการนี้?')) return

    try {
      const res = await fetch(`/api/tiktok/jobs/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setJobs(jobs.filter(j => j.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const handlePostToTikTok = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return

    if (!job.final_video) {
      alert('กรุณาสร้างวิดีโอก่อนโพสต์')
      return
    }

    if (!confirm('ต้องการโพสต์วิดีโอนี้ไปยัง TikTok?')) return

    setPostingToTikTok(prev => new Set(prev).add(jobId))

    try {
      const res = await fetch('/api/tiktok/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })

      const data = await res.json()

      if (data.success) {
        alert('โพสต์สำเร็จ!')
        fetchJobs()
      } else {
        alert(`โพสต์ล้มเหลว: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to post:', error)
      alert('เกิดข้อผิดพลาดในการโพสต์')
    } finally {
      setPostingToTikTok(prev => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  // Run Auto Pipeline for a single job (Hooks → Video → Schedule)
  const handleRunAutoPipeline = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return

    if (job.status === 'DONE') {
      alert('Job นี้เสร็จสิ้นแล้ว')
      return
    }

    if (!confirm(`ต้องการรัน Auto Pipeline สำหรับ "${job.productName || job.productid}"?\n\nระบบจะทำงานต่อไปนี้อัตโนมัติ:\n1. สร้าง Hooks (ถ้ายังไม่มี)\n2. สร้าง Video\n3. ตั้งเวลาโพสต์`)) return

    setRunningPipeline(prev => new Set(prev).add(jobId))

    try {
      const res = await fetch('/api/tiktok/auto-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run',
          jobId,
          options: {
            generateHooks: !job.hooking || job.hooking.trim() === '',
            generateVideo: true,
            schedulePost: true,
          },
        }),
      })

      const data = await res.json()

      if (data.success) {
        const result = data.data
        let message = '✅ Auto Pipeline เสร็จสิ้น!\n\n'

        if (result.steps?.hooks) {
          message += result.steps.hooks.skipped
            ? '• Hooks: ข้ามไป (มีอยู่แล้ว)\n'
            : '• Hooks: สร้างสำเร็จ ✓\n'
        }
        if (result.steps?.video) {
          message += result.steps.video.success
            ? '• Video: สร้างสำเร็จ ✓\n'
            : `• Video: ${result.steps.video.error || 'ล้มเหลว'}\n`
        }
        if (result.steps?.schedule) {
          message += result.steps.schedule.success
            ? `• Schedule: ${result.steps.schedule.scheduledAt ? new Date(result.steps.schedule.scheduledAt).toLocaleString('th-TH') : 'ตั้งเวลาแล้ว'} ✓\n`
            : '• Schedule: ข้ามไป\n'
        }

        alert(message)
        fetchJobs()
      } else {
        alert(`❌ Auto Pipeline ล้มเหลว: ${data.message || data.error}`)
      }
    } catch (error) {
      console.error('Auto pipeline error:', error)
      alert('เกิดข้อผิดพลาดในการรัน Auto Pipeline')
    } finally {
      setRunningPipeline(prev => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  // Bulk run Auto Pipeline for selected jobs
  const handleBulkRunPipeline = async () => {
    if (selectedJobs.size === 0) {
      alert('กรุณาเลือก Job ที่ต้องการรัน Pipeline')
      return
    }

    const pendingJobs = jobs.filter(j => selectedJobs.has(j.id) && j.status !== 'DONE')
    if (pendingJobs.length === 0) {
      alert('ไม่มี Job ที่สามารถรัน Pipeline ได้')
      return
    }

    if (!confirm(`ต้องการรัน Auto Pipeline สำหรับ ${pendingJobs.length} Jobs?\n\nระบบจะสร้าง Hooks, Video และตั้งเวลาโพสต์อัตโนมัติ`)) return

    let successCount = 0
    let failCount = 0

    for (const job of pendingJobs) {
      setRunningPipeline(prev => new Set(prev).add(job.id))

      try {
        const res = await fetch('/api/tiktok/auto-pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'run',
            jobId: job.id,
            options: {
              generateHooks: !job.hooking || job.hooking.trim() === '',
              generateVideo: true,
              schedulePost: true,
            },
          }),
        })

        const data = await res.json()
        if (data.success) {
          successCount++
        } else {
          failCount++
        }
      } catch (e) {
        failCount++
      } finally {
        setRunningPipeline(prev => {
          const next = new Set(prev)
          next.delete(job.id)
          return next
        })
      }
    }

    alert(`✅ สำเร็จ: ${successCount} Jobs\n${failCount > 0 ? `❌ ล้มเหลว: ${failCount} Jobs` : ''}`)
    setSelectedJobs(new Set())
    fetchJobs()
  }

  // Retry a single failed job
  const handleRetryJob = async (jobId: string, runPipeline: boolean = false) => {
    const job = jobs.find(j => j.id === jobId)
    if (!job || job.status !== 'FAILED') {
      alert('Job นี้ไม่ได้อยู่ในสถานะ FAILED')
      return
    }

    setRetryingJobs(prev => new Set(prev).add(jobId))

    try {
      const res = await fetch('/api/tiktok/jobs/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, runPipeline }),
      })

      const data = await res.json()

      if (data.success) {
        alert(`✅ ${data.message}`)
        fetchJobs()
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      console.error('Retry error:', error)
      alert('ไม่สามารถ Retry ได้')
    } finally {
      setRetryingJobs(prev => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  // Retry all failed jobs
  const handleRetryAllFailed = async () => {
    const failedJobs = jobs.filter(j => j.status === 'FAILED')
    if (failedJobs.length === 0) {
      alert('ไม่มี Job ที่ล้มเหลว')
      return
    }

    if (!confirm(`ต้องการ Retry ทั้งหมด ${failedJobs.length} Jobs ที่ล้มเหลว?`)) return

    try {
      const res = await fetch('/api/tiktok/jobs/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true, limit: 50 }),
      })

      const data = await res.json()

      if (data.success) {
        alert(`✅ Queued ${data.retried} jobs for retry`)
        fetchJobs()
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      console.error('Retry all error:', error)
      alert('ไม่สามารถ Retry ได้')
    }
  }

  const handleDuplicate = async (job: TikTokJob) => {
    try {
      const res = await fetch('/api/tiktok/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: `${job.productid}-copy-${Date.now().toString().slice(-4)}`,
          internalProductId: job.internalProductId,
          affiliateUrl: job.affiliateUrl,
          productName: job.productName,
          productImage: job.productImage,
          productImages: job.productImages,
          hooking: job.hooking,
          hook2: job.hook2,
          hook3: job.hook3,
          ending: job.ending,
          caption: job.caption,
          hashtags: job.hashtags,
        }),
      })

      if (res.ok) {
        alert('คัดลอก Job สำเร็จ!')
        fetchJobs()
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to duplicate:', error)
      alert('ไม่สามารถคัดลอก Job ได้')
    }
  }

  const handleDownloadVideo = async (videoUrl: string, productName: string) => {
    try {
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tiktok-${productName?.replace(/[^a-zA-Z0-9]/g, '-') || 'video'}-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      // Fallback: open in new tab
      window.open(videoUrl, '_blank')
    }
  }

  // Bulk generate hooks for selected jobs
  const handleBulkGenerateHooks = async () => {
    if (selectedJobs.size === 0) {
      alert('กรุณาเลือก Job ที่ต้องการสร้าง Hooks')
      return
    }

    const jobsWithoutHooks = jobs.filter(j =>
      selectedJobs.has(j.id) &&
      (!j.hooking || j.hooking.trim() === '')
    )

    if (jobsWithoutHooks.length === 0) {
      alert('Job ที่เลือกมี Hooks อยู่แล้วทั้งหมด')
      return
    }

    if (!confirm(`ต้องการสร้าง Hooks ให้ ${jobsWithoutHooks.length} Job?`)) return

    let successCount = 0
    let failCount = 0

    for (const job of jobsWithoutHooks) {
      try {
        // Generate hooks
        const hooksRes = await fetch('/api/tiktok/generate-hooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName: job.productName || job.productid }),
        })

        if (hooksRes.ok) {
          const hooks = await hooksRes.json()

          // Update job with hooks
          const updateRes = await fetch(`/api/tiktok/jobs/${job.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hooking: hooks.hook1,
              hook2: hooks.hook2,
              hook3: hooks.hook3,
              ending: hooks.ending,
              caption: hooks.caption,
              hashtags: hooks.hashtags,
            }),
          })

          if (updateRes.ok) {
            successCount++
          } else {
            failCount++
          }
        } else {
          failCount++
        }
      } catch (e) {
        failCount++
      }
    }

    alert(`✅ สร้าง Hooks สำเร็จ ${successCount} Job${failCount > 0 ? `\n❌ ล้มเหลว ${failCount} Job` : ''}`)
    setSelectedJobs(new Set())
    fetchJobs()
  }

  // Export jobs to CSV
  const handleExportCSV = () => {
    const jobsToExport = selectedJobs.size > 0
      ? jobs.filter(j => selectedJobs.has(j.id))
      : jobs

    if (jobsToExport.length === 0) {
      alert('ไม่มีข้อมูลสำหรับ Export')
      return
    }

    const headers = [
      'ID', 'Product ID', 'Product Name', 'Status',
      'Hook 1', 'Hook 2', 'Hook 3', 'Ending',
      'Caption', 'Hashtags', 'Video URL', 'Scheduled At', 'Created At'
    ]

    const csvContent = [
      headers.join(','),
      ...jobsToExport.map(job => [
        job.id,
        `"${(job.productid || '').replace(/"/g, '""')}"`,
        `"${(job.productName || '').replace(/"/g, '""')}"`,
        job.status,
        `"${(job.hooking || '').replace(/"/g, '""')}"`,
        `"${(job.hook2 || '').replace(/"/g, '""')}"`,
        `"${(job.hook3 || '').replace(/"/g, '""')}"`,
        `"${(job.ending || '').replace(/"/g, '""')}"`,
        `"${(job.caption || '').replace(/"/g, '""')}"`,
        `"${(job.hashtags || []).join(' ')}"`,
        job.final_video || '',
        job.scheduledAt || '',
        job.createdAt,
      ].join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tiktok-jobs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    alert(`Export ${jobsToExport.length} Jobs สำเร็จ!`)
  }

  const handleBulkDelete = async () => {
    if (selectedJobs.size === 0) return
    if (!confirm(`ต้องการลบ ${selectedJobs.size} รายการ?`)) return

    try {
      await Promise.all(
        Array.from(selectedJobs).map(id =>
          fetch(`/api/tiktok/jobs/${id}`, { method: 'DELETE' })
        )
      )
      setJobs(jobs.filter(j => !selectedJobs.has(j.id)))
      setSelectedJobs(new Set())
    } catch (error) {
      console.error('Failed to bulk delete:', error)
    }
  }

  // Batch generate videos for selected jobs
  const handleBatchGenerateVideo = async () => {
    if (selectedJobs.size === 0) {
      alert('กรุณาเลือก Job ที่ต้องการสร้างวิดีโอ')
      return
    }

    const jobsToGenerate = jobs.filter(j => selectedJobs.has(j.id) && j.status === 'PENDING')
    if (jobsToGenerate.length === 0) {
      alert('ไม่มี Job ที่พร้อมสร้างวิดีโอ (ต้องเป็นสถานะ PENDING)')
      return
    }

    if (!confirm(`ต้องการสร้างวิดีโอ ${jobsToGenerate.length} รายการ?`)) return

    let successCount = 0
    let failCount = 0

    for (const job of jobsToGenerate) {
      setGeneratingVideo(prev => new Set(prev).add(job.id))

      try {
        const res = await fetch('/api/tiktok/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id,
            useAI: !job.productImage, // Use AI if no product image
            backgroundMusic: videoOptions.backgroundMusic,
            musicVolume: videoOptions.musicVolume,
            showTextOverlay: videoOptions.showTextOverlay,
            textStyle: videoOptions.textStyle,
            watermark: videoOptions.watermark?.enabled ? videoOptions.watermark : null,
          }),
        })

        if (res.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch (error) {
        failCount++
      } finally {
        setGeneratingVideo(prev => {
          const next = new Set(prev)
          next.delete(job.id)
          return next
        })
      }
    }

    alert(`✅ สร้างวิดีโอสำเร็จ ${successCount} รายการ${failCount > 0 ? `\n❌ ล้มเหลว ${failCount} รายการ` : ''}`)
    setSelectedJobs(new Set())
    fetchJobs()
  }

  // Batch schedule jobs
  const handleBatchSchedule = async (dateTimeStr: string) => {
    if (selectedJobs.size === 0) return

    try {
      const scheduledAt = new Date(dateTimeStr.replace(' ', 'T'))
      if (isNaN(scheduledAt.getTime())) {
        alert('รูปแบบวันที่ไม่ถูกต้อง กรุณาใช้: YYYY-MM-DD HH:mm')
        return
      }

      let successCount = 0
      let failCount = 0

      for (const jobId of selectedJobs) {
        try {
          const res = await fetch(`/api/tiktok/jobs/${jobId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scheduledAt: scheduledAt.toISOString() }),
          })

          if (res.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch {
          failCount++
        }
      }

      alert(`✅ ตั้งเวลาสำเร็จ ${successCount} รายการ\n📅 ${scheduledAt.toLocaleString('th-TH')}${failCount > 0 ? `\n❌ ล้มเหลว ${failCount} รายการ` : ''}`)
      setSelectedJobs(new Set())
      fetchJobs()
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการตั้งเวลา')
    }
  }

  const handleGenerateVideo = async (jobId: string, useAI: boolean = false, options?: VideoOptions) => {
    if (generatingVideo.has(jobId)) return

    const opts = options || videoOptions
    setGeneratingVideo(prev => new Set(prev).add(jobId))
    setShowVideoOptions(null)

    try {
      const res = await fetch('/api/tiktok/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          useAI,
          backgroundMusic: opts.backgroundMusic,
          musicVolume: opts.musicVolume,
          showTextOverlay: opts.showTextOverlay,
          textStyle: opts.textStyle,
          watermark: opts.watermark?.enabled ? opts.watermark : null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        const features = []
        if (opts.backgroundMusic) features.push('🎵 Music')
        if (opts.showTextOverlay) features.push('📝 Text')
        const featuresText = features.length > 0 ? `\n${features.join(' + ')}` : ''

        alert(`✅ สร้าง Video สำเร็จ!${featuresText}\nURL: ${data.job.videoUrl}\nระยะเวลา: ${Math.round(data.job.duration)}วินาที`)
        fetchJobs()
      } else {
        alert(`Error: ${data.error || 'Failed to generate video'}`)
      }
    } catch (error) {
      console.error('Generate video error:', error)
      alert('Failed to generate video')
    } finally {
      setGeneratingVideo(prev => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  const copyWebhookUrl = (type: string) => {
    const baseUrl = window.location.origin
    let url = ''
    switch (type) {
      case 'fetch':
        url = `${baseUrl}/api/tiktok/jobs`
        break
      case 'send':
        url = `${baseUrl}/api/tiktok/jobs`
        break
      case 'done':
        url = `${baseUrl}/api/tiktok/jobs/done`
        break
    }
    navigator.clipboard.writeText(url)
    alert(`คัดลอก ${type} URL แล้ว!`)
  }

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'PENDING').length,
    done: jobs.filter(j => j.status === 'DONE').length,
    failed: jobs.filter(j => j.status === 'FAILED').length,
    withVideo: jobs.filter(j => j.final_video).length,
    withHooks: jobs.filter(j => j.hooking && j.hooking.trim() !== '').length,
    scheduled: jobs.filter(j => j.scheduledAt).length,
    readyToGenerate: jobs.filter(j =>
      j.status === 'PENDING' &&
      j.hooking &&
      j.productImage &&
      !j.final_video
    ).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
              <Video className="w-7 h-7 text-pink-500" />
              TikTok Auto Sales
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              จัดการวิดีโอและปักสินค้าอัตโนมัติ
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchJobs}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            title="จัดการ Hook Templates"
          >
            <BookTemplate className="w-4 h-4 text-purple-500" />
            Templates
          </button>
          <button
            onClick={() => setShowAnalytics(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            title="Analytics & Reports"
          >
            <BarChart3 className="w-4 h-4 text-cyan-500" />
            Analytics
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Download className="w-4 h-4" />
            Import Products
          </button>
          <button
            onClick={() => setShowCSVImport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            <Plus className="w-4 h-4" />
            เพิ่มงาน
          </button>
        </div>
      </div>

      {/* TikTok Account Manager & Scheduler */}
      <TikTokAccountManager />

      {/* Auto Pipeline Dashboard */}
      <AutoPipelineDashboard />

      {/* Posting Calendar */}
      <PostingCalendar />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400">ทั้งหมด</p>
          <p className="text-xl font-bold text-black dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-yellow-600">รอดำเนินการ</p>
          <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-green-600">สำเร็จ</p>
          <p className="text-xl font-bold text-green-600">{stats.done}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-red-600">ล้มเหลว</p>
          <p className="text-xl font-bold text-red-600">{stats.failed}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-orange-600">มี Hooks</p>
          <p className="text-xl font-bold text-orange-600">{stats.withHooks}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-purple-600">มีวิดีโอ</p>
          <p className="text-xl font-bold text-purple-600">{stats.withVideo}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-pink-600">พร้อมสร้าง</p>
          <p className="text-xl font-bold text-pink-600">{stats.readyToGenerate}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-blue-600">ตั้งเวลา</p>
          <p className="text-xl font-bold text-blue-600">{stats.scheduled}</p>
        </div>
      </div>

      {/* Webhook URLs */}
      <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <span className="font-medium text-black dark:text-white">Webhook URLs สำหรับ Extension</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
            onClick={() => copyWebhookUrl('fetch')}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-600"
          >
            <Copy className="w-4 h-4" />
            <span className="truncate">Fetch URL (GET)</span>
          </button>
          <button
            onClick={() => copyWebhookUrl('send')}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-600"
          >
            <Copy className="w-4 h-4" />
            <span className="truncate">Send URL (POST)</span>
          </button>
          <button
            onClick={() => copyWebhookUrl('done')}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-600"
          >
            <Copy className="w-4 h-4" />
            <span className="truncate">Done URL (POST)</span>
          </button>
        </div>
      </div>

      {/* Filter & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'PENDING', 'DONE', 'FAILED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-pink-500 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {f === 'all' ? 'ทั้งหมด' : f}
            </button>
          ))}
          {/* Retry All Failed Button */}
          {stats.failed > 0 && (
            <button
              onClick={handleRetryAllFailed}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retry Failed ({stats.failed})
            </button>
          )}
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <button
            onClick={() => {
              // Select all jobs that are ready to generate video
              const readyJobs = jobs.filter(j =>
                j.status === 'PENDING' &&
                j.hooking &&
                j.productImage &&
                !j.final_video
              )
              if (readyJobs.length === 0) {
                alert('ไม่มี Job ที่พร้อมสร้างวิดีโอ')
                return
              }
              setSelectedJobs(new Set(readyJobs.map(j => j.id)))
              alert(`เลือก ${readyJobs.length} Job ที่พร้อมสร้างวิดีโอ`)
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
          >
            🎬 เลือก Job พร้อมสร้าง ({stats.readyToGenerate})
          </button>
          <button
            onClick={() => {
              // Select all jobs without hooks
              const noHooksJobs = jobs.filter(j => !j.hooking || j.hooking.trim() === '')
              if (noHooksJobs.length === 0) {
                alert('ทุก Job มี Hooks แล้ว')
                return
              }
              setSelectedJobs(new Set(noHooksJobs.map(j => j.id)))
              alert(`เลือก ${noHooksJobs.length} Job ที่ยังไม่มี Hooks`)
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600"
          >
            ✨ เลือก Job ไม่มี Hooks ({stats.total - stats.withHooks})
          </button>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <button
            onClick={async () => {
              const pendingJobs = jobs.filter(j => j.status === 'PENDING')
              if (pendingJobs.length === 0) {
                alert('ไม่มี Job ที่รอดำเนินการ')
                return
              }
              if (!confirm(`ต้องการรัน Auto Pipeline สำหรับ ${pendingJobs.length} Jobs?\n\nระบบจะสร้าง Hooks, Video และตั้งเวลาโพสต์อัตโนมัติให้ทั้งหมด`)) return
              setSelectedJobs(new Set(pendingJobs.map(j => j.id)))
              // Trigger bulk pipeline after selecting
              setTimeout(() => handleBulkRunPipeline(), 100)
            }}
            disabled={runningPipeline.size > 0}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white hover:from-amber-600 hover:via-orange-600 hover:to-red-600 disabled:opacity-50 shadow-lg shadow-orange-500/25"
          >
            <span className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              ⚡ Auto All Pending ({stats.pending})
            </span>
          </button>
        </div>
        {selectedJobs.size > 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              เลือก {selectedJobs.size} รายการ:
            </span>
            <button
              onClick={handleBulkGenerateHooks}
              className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
              title="สร้าง Hooks ด้วย AI"
            >
              <Sparkles className="w-4 h-4" />
              สร้าง Hooks
            </button>
            <button
              onClick={handleBatchGenerateVideo}
              disabled={generatingVideo.size > 0}
              className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm"
            >
              <Film className="w-4 h-4" />
              สร้างวิดีโอ
            </button>
            <button
              onClick={handleBulkRunPipeline}
              disabled={runningPipeline.size > 0}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-sm"
              title="Auto Pipeline: Hooks → Video → Schedule"
            >
              <Zap className="w-4 h-4" />
              Auto Pipeline
            </button>
            <button
              onClick={() => {
                const time = prompt('ตั้งเวลาโพสต์ (รูปแบบ: YYYY-MM-DD HH:mm)\nเช่น: 2025-01-25 10:00')
                if (time) {
                  handleBatchSchedule(time)
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              <Clock className="w-4 h-4" />
              ตั้งเวลา
            </button>
            <button
              onClick={() => setShowBatchEdit(true)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm"
              title="แก้ไขหลาย Jobs พร้อมกัน"
            >
              <Edit className="w-4 h-4" />
              Batch Edit
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
              title="Export เป็น CSV"
            >
              <FileDown className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              ลบ
            </button>
          </div>
        ) : (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
            title="Export ทั้งหมดเป็น CSV"
          >
            <FileDown className="w-4 h-4 text-green-500" />
            Export CSV
          </button>
        )}
      </div>

      {/* Jobs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedJobs(new Set(jobs.map(j => j.id)))
                      } else {
                        setSelectedJobs(new Set())
                      }
                    }}
                    checked={selectedJobs.size === jobs.length && jobs.length > 0}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">สถานะ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">กำหนดโพสต์</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Product ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hook 1</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hook 2</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hook 3</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ending</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Video</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    กำลังโหลด...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    ไม่พบรายการ
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const StatusIcon = STATUS_ICONS[job.status]
                  return (
                    <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedJobs.has(job.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedJobs)
                            if (e.target.checked) {
                              newSelected.add(job.id)
                            } else {
                              newSelected.delete(job.id)
                            }
                            setSelectedJobs(newSelected)
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {runningPipeline.has(job.id) ? (
                          <div className="w-32">
                            <div className="flex items-center gap-2 mb-1">
                              <Zap className="w-3 h-3 animate-pulse text-amber-500" />
                              <span className="text-xs text-amber-600 font-medium">
                                Pipeline...
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div className="w-full h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Hooks → Video → Schedule
                            </p>
                          </div>
                        ) : generatingVideo.has(job.id) && progressData[job.id] ? (
                          <div className="w-32">
                            <div className="flex items-center gap-2 mb-1">
                              <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                              <span className="text-xs text-purple-600 font-medium">
                                {progressData[job.id].progress}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${progressData[job.id].progress}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate" title={progressData[job.id].step}>
                              {progressData[job.id].step}
                            </p>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[job.status]}`}>
                            <StatusIcon className="w-3 h-3" />
                            {job.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {job.scheduledAt ? (
                          <div className="text-xs">
                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                              <Clock className="w-3 h-3" />
                              {new Date(job.scheduledAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}
                            </div>
                            <div className="text-slate-500">
                              {new Date(job.scheduledAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Show multiple images or single image */}
                          <div className="flex -space-x-2">
                            {(job.productImages && job.productImages.length > 0 ? job.productImages.slice(0, 3) : job.productImage ? [job.productImage] : []).map((img, idx) => (
                              <Image
                                key={idx}
                                src={img}
                                alt=""
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded object-cover border-2 border-white dark:border-slate-800"
                              />
                            ))}
                            {job.productImages && job.productImages.length > 3 && (
                              <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium border-2 border-white dark:border-slate-800">
                                +{job.productImages.length - 3}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-mono text-black dark:text-white">
                                {job.productid?.slice(0, 15)}{job.productid?.length > 15 ? '...' : ''}
                              </span>
                              {/* Link to internal product */}
                              {job.internalProductId && (
                                <Link
                                  href={`/products/${job.internalProductId}`}
                                  target="_blank"
                                  className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                                  title="ดูหน้าสินค้า"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                                </Link>
                              )}
                              {/* Link to affiliate URL */}
                              {job.affiliateUrl && (
                                <a
                                  href={job.affiliateUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-0.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded"
                                  title="ดูใน Platform"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-orange-500" />
                                </a>
                              )}
                            </div>
                            {/* Platform badge */}
                            {job.productid && (
                              <span className={`text-xs px-1.5 py-0.5 rounded mt-0.5 w-fit ${
                                job.productid.startsWith('SHOPEE') ? PLATFORM_COLORS.SHOPEE :
                                job.productid.startsWith('LAZADA') ? PLATFORM_COLORS.LAZADA :
                                job.productid.startsWith('TIKTOK') ? PLATFORM_COLORS.TIKTOK :
                                job.productid.startsWith('AMAZON') ? PLATFORM_COLORS.AMAZON :
                                PLATFORM_COLORS.OTHER
                              }`}>
                                {job.productid.split('-')[0] || 'OTHER'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 max-w-[150px]">
                          {job.hooking || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 max-w-[150px]">
                          {job.hook2 || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 max-w-[150px]">
                          {job.hook3 || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 max-w-[150px]">
                          {job.ending || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {job.final_video ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setPreviewVideo(job)}
                              className="p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded"
                              title="ดูตัวอย่างวิดีโอ"
                            >
                              <Eye className="w-4 h-4 text-pink-500" />
                            </button>
                            <button
                              onClick={() => handleDownloadVideo(job.final_video!, job.productName || '')}
                              className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                              title="ดาวน์โหลดวิดีโอ"
                            >
                              <FileDown className="w-4 h-4 text-green-500" />
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.origin + job.final_video)
                                alert('คัดลอก URL แล้ว!')
                              }}
                              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                              title="คัดลอก URL"
                            >
                              <Copy className="w-4 h-4 text-blue-500" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 relative">
                          {/* Generate Video with Options */}
                          <button
                            onClick={() => setShowVideoOptions(showVideoOptions === job.id ? null : job.id)}
                            disabled={generatingVideo.has(job.id) || !job.productImage}
                            title={!job.productImage ? 'ต้องมีรูปสินค้าก่อน' : 'สร้าง Video (คลิกเพื่อดูตัวเลือก)'}
                            className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {generatingVideo.has(job.id) ? (
                              <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                            ) : (
                              <Film className="w-4 h-4 text-purple-500" />
                            )}
                          </button>
                          {/* Generate AI Video with DALL-E */}
                          <button
                            onClick={() => handleGenerateVideo(job.id, true)}
                            disabled={generatingVideo.has(job.id)}
                            title="สร้าง Video ด้วย AI Images (DALL-E 3)"
                            className="p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {generatingVideo.has(job.id) ? (
                              <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-pink-500" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDuplicate(job)}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                            title="คัดลอก Job"
                          >
                            <CopyPlus className="w-4 h-4 text-blue-500" />
                          </button>
                          {/* Auto Pipeline Button */}
                          <button
                            onClick={() => handleRunAutoPipeline(job.id)}
                            disabled={runningPipeline.has(job.id) || job.status === 'DONE'}
                            className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title={job.status === 'DONE' ? 'Job เสร็จแล้ว' : 'Auto Pipeline (Hooks → Video → Schedule)'}
                          >
                            {runningPipeline.has(job.id) ? (
                              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4 text-amber-500" />
                            )}
                          </button>
                          {/* Post to TikTok Button */}
                          <button
                            onClick={() => handlePostToTikTok(job.id)}
                            disabled={postingToTikTok.has(job.id) || !job.final_video || job.status === 'DONE'}
                            className="p-1 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!job.final_video ? 'ต้องสร้างวิดีโอก่อน' : job.status === 'DONE' ? 'โพสต์แล้ว' : 'โพสต์ไปยัง TikTok'}
                          >
                            {postingToTikTok.has(job.id) ? (
                              <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4 text-pink-500" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingJob(job)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                            title="แก้ไข"
                          >
                            <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          </button>
                          {/* Retry Button for Failed Jobs */}
                          {job.status === 'FAILED' && (
                            <button
                              onClick={() => handleRetryJob(job.id, true)}
                              disabled={retryingJobs.has(job.id)}
                              className="p-1 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded disabled:opacity-50"
                              title="Retry Job"
                            >
                              {retryingJobs.has(job.id) ? (
                                <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                              ) : (
                                <RotateCcw className="w-4 h-4 text-orange-500" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(job.id)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>

                          {/* Video Options Dropdown */}
                          {showVideoOptions === job.id && (
                            <div className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-4">
                              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                                <Film className="w-4 h-4" />
                                ตัวเลือกสร้าง Video
                              </h4>

                              {/* Template Presets */}
                              <div className="mb-4">
                                <label className="text-xs text-slate-500 mb-2 block">🎬 เลือก Template</label>
                                <div className="grid grid-cols-2 gap-2">
                                  {VIDEO_TEMPLATES.map(template => (
                                    <button
                                      key={template.id}
                                      onClick={() => setVideoOptions({...template.settings, watermark: videoOptions.watermark})}
                                      className={`text-left p-2 rounded-lg border text-xs transition-all ${
                                        videoOptions.backgroundMusic === template.settings.backgroundMusic &&
                                        videoOptions.showTextOverlay === template.settings.showTextOverlay &&
                                        videoOptions.textStyle === template.settings.textStyle
                                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                                          : 'border-slate-200 dark:border-slate-600 hover:border-purple-300'
                                      }`}
                                    >
                                      <div className="font-medium">{template.name}</div>
                                      <div className="text-slate-500 text-[10px]">{template.description}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <hr className="my-3 border-slate-200 dark:border-slate-600" />

                              {/* Background Music */}
                              <div className="mb-3">
                                <label className="text-xs text-slate-500 mb-1 block">🎵 เพลงพื้นหลัง</label>
                                <select
                                  value={videoOptions.backgroundMusic || ''}
                                  onChange={(e) => setVideoOptions({...videoOptions, backgroundMusic: e.target.value || null})}
                                  className="w-full text-sm px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                                >
                                  {MUSIC_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Text Overlay */}
                              <div className="mb-3">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={videoOptions.showTextOverlay}
                                    onChange={(e) => setVideoOptions({...videoOptions, showTextOverlay: e.target.checked})}
                                    className="rounded"
                                  />
                                  📝 แสดงข้อความ Hook บนวิดีโอ
                                </label>
                              </div>

                              {videoOptions.showTextOverlay && (
                                <div className="mb-3">
                                  <label className="text-xs text-slate-500 mb-1 block">สไตล์ข้อความ</label>
                                  <select
                                    value={videoOptions.textStyle}
                                    onChange={(e) => setVideoOptions({...videoOptions, textStyle: e.target.value as any})}
                                    className="w-full text-sm px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                                  >
                                    {TEXT_STYLE_OPTIONS.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <hr className="my-3 border-slate-200 dark:border-slate-600" />

                              {/* Watermark Settings */}
                              <div className="mb-3">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={videoOptions.watermark.enabled}
                                    onChange={(e) => setVideoOptions({
                                      ...videoOptions,
                                      watermark: {...videoOptions.watermark, enabled: e.target.checked}
                                    })}
                                    className="rounded"
                                  />
                                  🏷️ ใส่ Watermark/Logo
                                </label>
                              </div>

                              {videoOptions.watermark.enabled && (
                                <div className="space-y-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setVideoOptions({
                                        ...videoOptions,
                                        watermark: {...videoOptions.watermark, type: 'text'}
                                      })}
                                      className={`flex-1 text-xs py-1.5 rounded ${videoOptions.watermark.type === 'text' ? 'bg-purple-500 text-white' : 'bg-white dark:bg-slate-600 border'}`}
                                    >
                                      ข้อความ
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setVideoOptions({
                                        ...videoOptions,
                                        watermark: {...videoOptions.watermark, type: 'image'}
                                      })}
                                      className={`flex-1 text-xs py-1.5 rounded ${videoOptions.watermark.type === 'image' ? 'bg-purple-500 text-white' : 'bg-white dark:bg-slate-600 border'}`}
                                    >
                                      รูปภาพ
                                    </button>
                                  </div>

                                  {videoOptions.watermark.type === 'text' ? (
                                    <input
                                      type="text"
                                      placeholder="@YourChannel"
                                      value={videoOptions.watermark.text}
                                      onChange={(e) => setVideoOptions({
                                        ...videoOptions,
                                        watermark: {...videoOptions.watermark, text: e.target.value}
                                      })}
                                      className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      placeholder="/images/logo.png"
                                      value={videoOptions.watermark.imagePath}
                                      onChange={(e) => setVideoOptions({
                                        ...videoOptions,
                                        watermark: {...videoOptions.watermark, imagePath: e.target.value}
                                      })}
                                      className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                                    />
                                  )}

                                  <select
                                    value={videoOptions.watermark.position}
                                    onChange={(e) => setVideoOptions({
                                      ...videoOptions,
                                      watermark: {...videoOptions.watermark, position: e.target.value as any}
                                    })}
                                    className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                                  >
                                    {WATERMARK_POSITIONS.map(pos => (
                                      <option key={pos.value} value={pos.value}>{pos.label}</option>
                                    ))}
                                  </select>

                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">โปร่งใส:</span>
                                    <input
                                      type="range"
                                      min="0.1"
                                      max="1"
                                      step="0.1"
                                      value={videoOptions.watermark.opacity}
                                      onChange={(e) => setVideoOptions({
                                        ...videoOptions,
                                        watermark: {...videoOptions.watermark, opacity: parseFloat(e.target.value)}
                                      })}
                                      className="flex-1"
                                    />
                                    <span className="text-xs w-8">{Math.round(videoOptions.watermark.opacity * 100)}%</span>
                                  </div>
                                </div>
                              )}

                              {/* Generate Buttons */}
                              <div className="flex gap-2 mt-4">
                                <button
                                  onClick={() => handleGenerateVideo(job.id, false, videoOptions)}
                                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
                                >
                                  <Film className="w-4 h-4" />
                                  สร้าง
                                </button>
                                <button
                                  onClick={() => setShowVideoOptions(null)}
                                  className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingJob) && (
        <JobModal
          job={editingJob}
          onClose={() => {
            setShowAddModal(false)
            setEditingJob(null)
          }}
          onSave={() => {
            setShowAddModal(false)
            setEditingJob(null)
            fetchJobs()
          }}
        />
      )}

      {/* Import from Products Modal */}
      {showImportModal && (
        <ImportProductsModal
          onClose={() => setShowImportModal(false)}
          onImport={() => {
            setShowImportModal(false)
            fetchJobs()
          }}
        />
      )}

      {/* Video Preview Modal */}
      {previewVideo && previewVideo.final_video && (
        <VideoPreviewModal
          job={previewVideo}
          onClose={() => setPreviewVideo(null)}
          onDownload={() => handleDownloadVideo(previewVideo.final_video!, previewVideo.productName || '')}
          onRegenerate={(jobId) => {
            setPreviewVideo(null)
            setShowVideoOptions(jobId)
          }}
        />
      )}

      {/* Hook Templates Modal */}
      {showTemplates && (
        <HookTemplatesModal
          onClose={() => setShowTemplates(false)}
          onSelect={(template) => {
            // Could be used to fill form
            setShowTemplates(false)
          }}
        />
      )}

      {/* CSV Import Modal */}
      {showCSVImport && (
        <CSVImportModal
          onClose={() => setShowCSVImport(false)}
          onImport={() => {
            setShowCSVImport(false)
            fetchJobs()
          }}
        />
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <AnalyticsModal onClose={() => setShowAnalytics(false)} />
      )}

      {/* Batch Edit Modal */}
      <BatchEditModal
        isOpen={showBatchEdit}
        onClose={() => setShowBatchEdit(false)}
        selectedJobIds={Array.from(selectedJobs)}
        onSuccess={() => {
          fetchJobs()
          setSelectedJobs(new Set())
        }}
      />

      {/* Floating Progress Panel */}
      {generatingVideo.size > 0 && (
        <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-40">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-medium text-sm">กำลังสร้างวิดีโอ ({generatingVideo.size})</span>
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {Array.from(generatingVideo).map(jobId => {
              const job = jobs.find(j => j.id === jobId)
              const progress = progressData[jobId]
              return (
                <div key={jobId} className="p-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                  <div className="flex items-center gap-2 mb-2">
                    {job?.productImage && (
                      <Image
                        src={job.productImage}
                        alt=""
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded object-cover"
                      />
                    )}
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1">
                      {job?.productName || jobId.slice(0, 8)}
                    </span>
                    <span className="text-xs font-bold text-purple-600">
                      {progress?.progress || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress?.progress || 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    {progress?.step || 'กำลังเริ่มต้น...'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Job Modal Component
function JobModal({
  job,
  onClose,
  onSave,
}: {
  job: TikTokJob | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    productId: job?.productid || '',
    productName: job?.productName || '',
    productImage: job?.productImage || '',
    hook1: job?.hooking || '',
    hook2: job?.hook2 || '',
    hook3: job?.hook3 || '',
    ending: job?.ending || '',
    videoUrl: job?.final_video || '',
    caption: job?.caption || '',
    hashtags: job?.hashtags || [] as string[],
    scheduledAt: job?.scheduledAt || '',
  })
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showSchedulePicker, setShowSchedulePicker] = useState(!!job?.scheduledAt)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('ไฟล์ต้องมีขนาดไม่เกิน 10MB')
      return
    }

    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData({ ...formData, productImage: data.url })
      } else {
        const error = await res.json()
        alert(`อัพโหลดไม่สำเร็จ: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('อัพโหลดไม่สำเร็จ')
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateHooks = async () => {
    if (!formData.productName) {
      alert('กรุณากรอกชื่อสินค้าก่อน')
      return
    }

    setGenerating(true)
    try {
      const res = await fetch('/api/tiktok/generate-hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.productName,
        }),
      })

      if (res.ok) {
        const hooks = await res.json()
        setFormData({
          ...formData,
          hook1: hooks.hook1 || formData.hook1,
          hook2: hooks.hook2 || formData.hook2,
          hook3: hooks.hook3 || formData.hook3,
          ending: hooks.ending || formData.ending,
          caption: hooks.caption || formData.caption,
          hashtags: hooks.hashtags || formData.hashtags,
        })
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to generate hooks'}`)
      }
    } catch (error) {
      console.error('Generate hooks error:', error)
      alert('Failed to generate hooks')
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = job ? `/api/tiktok/jobs/${job.id}` : '/api/tiktok/jobs'
      const method = job ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: formData.productId,
          productName: formData.productName,
          productImage: formData.productImage,
          hooking: formData.hook1,
          hook2: formData.hook2,
          hook3: formData.hook3,
          ending: formData.ending,
          videoUrl: formData.videoUrl,
          caption: formData.caption,
          hashtags: formData.hashtags,
          scheduledAt: showSchedulePicker && formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : null,
        }),
      })

      if (res.ok) {
        onSave()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-black dark:text-white">
            {job ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Product ID *
              </label>
              <input
                type="text"
                required
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="TikTok Product ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                ชื่อสินค้า
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              รูปสินค้า
            </label>
            <div className="space-y-3">
              {/* Image Preview */}
              {formData.productImage && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                  <Image
                    src={formData.productImage}
                    alt="Product preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, productImage: '' })}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Upload Button & URL Input */}
              <div className="flex gap-2">
                <label className={`flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">อัพโหลด...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">อัพโหลดรูป</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <span className="text-sm text-slate-400 self-center">หรือ</span>
              </div>

              {/* URL Input */}
              <input
                type="text"
                value={formData.productImage}
                onChange={(e) => setFormData({ ...formData, productImage: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="วาง URL รูปภาพ"
              />
            </div>
          </div>

          {/* AI Generate Hooks Button */}
          <div className="flex items-center justify-between py-2 px-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                AI Generate Hooks
              </span>
            </div>
            <button
              type="button"
              onClick={handleGenerateHooks}
              disabled={generating || !formData.productName}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  สร้าง Hook อัตโนมัติ
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hook 1 (เปิด)
              </label>
              <textarea
                value={formData.hook1}
                onChange={(e) => setFormData({ ...formData, hook1: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hook 2 (กลาง)
              </label>
              <textarea
                value={formData.hook2}
                onChange={(e) => setFormData({ ...formData, hook2: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hook 3 (ปิด)
              </label>
              <textarea
                value={formData.hook3}
                onChange={(e) => setFormData({ ...formData, hook3: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Ending (CTA)
              </label>
              <textarea
                value={formData.ending}
                onChange={(e) => setFormData({ ...formData, ending: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                rows={2}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Video URL
            </label>
            <input
              type="text"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>

          {/* AI Caption Generator */}
          <AICaptionGenerator
            productName={formData.productName}
            hooks={formData.hook1}
            onSelectCaption={(caption, hashtags) => {
              setFormData({
                ...formData,
                caption: caption || formData.caption,
                hashtags: hashtags.length > 0 ? hashtags : formData.hashtags,
              })
            }}
            currentCaption={formData.caption}
            currentHashtags={formData.hashtags}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Caption
            </label>
            <textarea
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Hashtags
            </label>
            <div className="space-y-2">
              {formData.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                      <button
                        type="button"
                        onClick={() => {
                          const newTags = [...formData.hashtags]
                          newTags.splice(idx, 1)
                          setFormData({ ...formData, hashtags: newTags })
                        }}
                        className="hover:text-pink-900 dark:hover:text-pink-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                placeholder="พิมพ์ hashtag แล้วกด Enter (เช่น #สินค้าดี)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const input = e.currentTarget
                    const value = input.value.trim()
                    if (value && !formData.hashtags.includes(value)) {
                      setFormData({
                        ...formData,
                        hashtags: [...formData.hashtags, value.startsWith('#') ? value : `#${value}`]
                      })
                      input.value = ''
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              />
            </div>
          </div>

          {/* Trending Hashtags */}
          <TrendingHashtagsSection
            selectedTags={formData.hashtags}
            onAddTag={(tag) => {
              if (!formData.hashtags.includes(tag)) {
                setFormData({
                  ...formData,
                  hashtags: [...formData.hashtags, tag]
                })
              }
            }}
            productName={formData.productName}
          />

          {/* Schedule Posting */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-100">ตั้งเวลาโพสต์</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSchedulePicker}
                  onChange={(e) => setShowSchedulePicker(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {showSchedulePicker && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-blue-700 dark:text-blue-300 mb-1">วันที่</label>
                    <input
                      type="date"
                      value={formData.scheduledAt ? formData.scheduledAt.split('T')[0] : ''}
                      onChange={(e) => {
                        const time = formData.scheduledAt ? formData.scheduledAt.split('T')[1] || '12:00' : '12:00'
                        setFormData({ ...formData, scheduledAt: `${e.target.value}T${time}` })
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-700 dark:text-blue-300 mb-1">เวลา</label>
                    <input
                      type="time"
                      value={formData.scheduledAt ? formData.scheduledAt.split('T')[1]?.slice(0, 5) || '12:00' : '12:00'}
                      onChange={(e) => {
                        const date = formData.scheduledAt ? formData.scheduledAt.split('T')[0] : new Date().toISOString().split('T')[0]
                        setFormData({ ...formData, scheduledAt: `${date}T${e.target.value}` })
                      }}
                      className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
                    />
                  </div>
                </div>

                {/* Quick schedule buttons */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'พรุ่งนี้ 9:00', days: 1, hour: 9 },
                    { label: 'พรุ่งนี้ 12:00', days: 1, hour: 12 },
                    { label: 'พรุ่งนี้ 18:00', days: 1, hour: 18 },
                    { label: 'มะรืนนี้ 12:00', days: 2, hour: 12 },
                  ].map((preset) => {
                    const date = new Date()
                    date.setDate(date.getDate() + preset.days)
                    date.setHours(preset.hour, 0, 0, 0)
                    const value = date.toISOString().slice(0, 16)
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, scheduledAt: value })}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800"
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>

                {formData.scheduledAt && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    จะโพสต์อัตโนมัติในวันที่ {new Date(formData.scheduledAt).toLocaleString('th-TH', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Import Products Modal Component
function ImportProductsModal({
  onClose,
  onImport,
}: {
  onClose: () => void
  onImport: () => void
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [platform, setPlatform] = useState<string>('all')
  const [autoGenerateHooks, setAutoGenerateHooks] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products?limit=200')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlatform = platform === 'all' || p.platform === platform
    return matchesSearch && matchesPlatform
  })

  const toggleProduct = (id: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedProducts(newSelected)
  }

  const toggleAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)))
    }
  }

  const handleImport = async () => {
    if (selectedProducts.size === 0) return

    setImporting(true)
    const selectedProductsList = products.filter(p => selectedProducts.has(p.id))
    setImportProgress({ current: 0, total: selectedProductsList.length })

    try {
      const jobsData = []

      for (let i = 0; i < selectedProductsList.length; i++) {
        const p = selectedProductsList[i]
        setImportProgress({ current: i + 1, total: selectedProductsList.length })

        let hooks = {}
        if (autoGenerateHooks) {
          try {
            const hooksRes = await fetch('/api/tiktok/generate-hooks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productName: p.title }),
            })
            if (hooksRes.ok) {
              hooks = await hooksRes.json()
            }
          } catch (e) {
            console.error('Failed to generate hooks for:', p.title, e)
          }
        }

        // Extract platform product ID from affiliate URL (or use internal ID as fallback)
        const platformProductId = p.affiliateUrl
          ? extractPlatformProductId(p.affiliateUrl, p.platform)
          : p.id.slice(-12)

        jobsData.push({
          productId: `${p.platform}-${platformProductId}`, // Platform-prefixed ID for consistency
          internalProductId: p.id, // Link back to internal Product
          affiliateUrl: p.affiliateUrl || '', // Store affiliate URL
          productName: p.title,
          productImage: p.imageUrl,
          hooking: (hooks as any).hook1 || '',
          hook2: (hooks as any).hook2 || '',
          hook3: (hooks as any).hook3 || '',
          ending: (hooks as any).ending || '',
          caption: (hooks as any).caption || '',
          hashtags: (hooks as any).hashtags || [],
        })
      }

      // Send jobs one by one to handle partial failures
      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      for (const job of jobsData) {
        try {
          const res = await fetch('/api/tiktok/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(job),
          })

          if (res.ok) {
            successCount++
          } else {
            failedCount++
            const error = await res.json()
            errors.push(`${job.productName}: ${error.details || error.error}`)
          }
        } catch (e) {
          failedCount++
          errors.push(`${job.productName}: Network error`)
        }
      }

      if (successCount > 0) {
        let message = `สร้าง ${successCount} งานสำเร็จ!`
        if (failedCount > 0) {
          message += `\n\n⚠️ ล้มเหลว ${failedCount} รายการ:\n${errors.slice(0, 5).join('\n')}`
          if (errors.length > 5) {
            message += `\n... และอีก ${errors.length - 5} รายการ`
          }
        }
        alert(message)
        onImport()
      } else {
        alert(`❌ ไม่สามารถสร้างงานได้:\n${errors.slice(0, 5).join('\n')}`)
      }
    } catch (error: any) {
      console.error('Import error:', error)
      alert(`Failed to import products: ${error.message || 'Unknown error'}`)
    } finally {
      setImporting(false)
      setImportProgress({ current: 0, total: 0 })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              Import จาก Products
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              เลือกสินค้าที่ต้องการสร้าง TikTok Job
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          >
            <option value="all">ทุก Platform</option>
            <option value="SHOPEE">Shopee</option>
            <option value="LAZADA">Lazada</option>
            <option value="TIKTOK">TikTok</option>
            <option value="AMAZON">Amazon</option>
            <option value="OTHER">Other</option>
          </select>
          <button
            onClick={toggleAll}
            className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            {selectedProducts.size === filteredProducts.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
          </button>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              ไม่พบสินค้า
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all ${
                    selectedProducts.has(product.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {selectedProducts.has(product.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-black dark:text-white line-clamp-2">
                        {product.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        ฿{product.price?.toLocaleString()}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                        product.platform === 'SHOPEE' ? 'bg-orange-100 text-orange-700' :
                        product.platform === 'LAZADA' ? 'bg-blue-100 text-blue-700' :
                        product.platform === 'TIKTOK' ? 'bg-pink-100 text-pink-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {product.platform}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
          {/* Auto Generate Option */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoGenerateHooks}
                onChange={(e) => setAutoGenerateHooks(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-purple-500 focus:ring-purple-500"
              />
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                สร้าง Hook อัตโนมัติด้วย AI
              </span>
            </label>
            <p className="text-sm text-slate-500">
              เลือกแล้ว {selectedProducts.size} รายการ
            </p>
          </div>

          {/* Progress bar when importing */}
          {importing && importProgress.total > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>กำลัง Import... {importProgress.current}/{importProgress.total}</span>
                <span>{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={importing}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleImport}
              disabled={selectedProducts.size === 0 || importing}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  กำลัง Import...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Import {selectedProducts.size} รายการ
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Video Preview Modal Component
function VideoPreviewModal({
  job,
  onClose,
  onDownload,
  onRegenerate,
}: {
  job: TikTokJob
  onClose: () => void
  onDownload: () => void
  onRegenerate?: (jobId: string) => void
}) {
  const copyCaption = () => {
    const text = `${job.caption || ''}\n\n${job.hashtags?.join(' ') || ''}`
    navigator.clipboard.writeText(text)
    alert('คัดลอก Caption + Hashtags แล้ว!')
  }

  const copyAllHooks = () => {
    const text = `Hook 1: ${job.hooking || '-'}

Hook 2: ${job.hook2 || '-'}

Hook 3: ${job.hook3 || '-'}

Ending: ${job.ending || '-'}

Caption: ${job.caption || '-'}

Hashtags: ${job.hashtags?.join(' ') || '-'}`
    navigator.clipboard.writeText(text)
    alert('คัดลอกทั้งหมดแล้ว!')
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-pink-500" />
              {job.productName || 'Video Preview'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">ID: {job.productid}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video Player */}
            <div className="space-y-4">
              <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden max-h-[500px] mx-auto">
                <video
                  src={job.final_video || ''}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  playsInline
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <FileDown className="w-4 h-4" />
                  ดาวน์โหลด MP4
                </button>
                <a
                  href={job.final_video || ''}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  เปิดใน Tab ใหม่
                </a>
              </div>
              {onRegenerate && (
                <button
                  onClick={() => {
                    if (confirm('ต้องการสร้างวิดีโอใหม่? วิดีโอเก่าจะถูกแทนที่')) {
                      onRegenerate(job.id)
                      onClose()
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  <RefreshCw className="w-4 h-4" />
                  สร้างวิดีโอใหม่
                </button>
              )}
            </div>

            {/* Info & Hooks */}
            <div className="space-y-4">
              {/* Product Image */}
              {job.productImage && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <Image
                    src={job.productImage}
                    alt=""
                    width={60}
                    height={60}
                    className="w-15 h-15 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-sm">{job.productName}</p>
                    {job.affiliateUrl && (
                      <a
                        href={job.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        ดูสินค้า
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Hooks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">📝 Hooks & Caption</h3>
                  <button
                    onClick={copyAllHooks}
                    className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    คัดลอกทั้งหมด
                  </button>
                </div>

                {[
                  { label: 'Hook 1 (เปิด)', value: job.hooking },
                  { label: 'Hook 2 (กลาง)', value: job.hook2 },
                  { label: 'Hook 3 (ปิด)', value: job.hook3 },
                  { label: 'Ending (CTA)', value: job.ending },
                ].map((item, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                    <p className="text-sm">{item.value || '-'}</p>
                  </div>
                ))}
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">📱 Caption สำหรับโพสต์</h3>
                  <button
                    onClick={copyCaption}
                    className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    คัดลอก
                  </button>
                </div>
                <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                  <p className="text-sm whitespace-pre-wrap">{job.caption || '-'}</p>
                  {job.hashtags && job.hashtags.length > 0 && (
                    <p className="text-sm text-pink-600 dark:text-pink-400 mt-2">
                      {job.hashtags.join(' ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook Templates Modal Component
function HookTemplatesModal({
  onClose,
  onSelect,
}: {
  onClose: () => void
  onSelect: (template: any) => void
}) {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: '',
    hookType: 'opening',
    template: '',
  })
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tiktok/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.template) {
      alert('กรุณากรอกชื่อและเนื้อหา Template')
      return
    }

    try {
      const res = await fetch('/api/tiktok/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      })

      if (res.ok) {
        alert('บันทึก Template สำเร็จ!')
        setNewTemplate({ name: '', category: '', hookType: 'opening', template: '' })
        setShowAddForm(false)
        fetchTemplates()
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('ไม่สามารถบันทึก Template ได้')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('ต้องการลบ Template นี้?')) return

    try {
      const res = await fetch(`/api/tiktok/templates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setTemplates(templates.filter(t => t.id !== id))
      }
    } catch (error) {
      alert('ไม่สามารถลบได้')
    }
  }

  const HOOK_TYPES = [
    { value: 'opening', label: '🎬 Opening (เปิด)' },
    { value: 'middle', label: '📝 Middle (กลาง)' },
    { value: 'closing', label: '🎯 Closing (ปิด)' },
    { value: 'ending', label: '📢 Ending (CTA)' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
            <BookTemplate className="w-5 h-5 text-purple-500" />
            Hook Templates
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
            >
              <Plus className="w-4 h-4" />
              เพิ่ม
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-purple-50 dark:bg-purple-900/20">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="ชื่อ Template"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
              />
              <input
                type="text"
                placeholder="หมวดหมู่ (ไม่บังคับ)"
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
              />
            </div>
            <select
              value={newTemplate.hookType}
              onChange={(e) => setNewTemplate({...newTemplate, hookType: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm mb-3"
            >
              {HOOK_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <textarea
              placeholder="เนื้อหา Template (ใช้ {productName} สำหรับชื่อสินค้า)"
              value={newTemplate.template}
              onChange={(e) => setNewTemplate({...newTemplate, template: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm mb-3"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                บันทึก
              </button>
            </div>
          </div>
        )}

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BookTemplate className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>ยังไม่มี Template</p>
              <p className="text-sm mt-1 mb-4">กดปุ่ม "เพิ่ม" เพื่อสร้าง Template ใหม่</p>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/tiktok/templates/seed', { method: 'POST' })
                    if (res.ok) {
                      const data = await res.json()
                      alert(`เพิ่ม ${data.count} Templates สำเร็จ!`)
                      fetchTemplates()
                    }
                  } catch (e) {
                    alert('ไม่สามารถเพิ่ม Templates ได้')
                  }
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                เพิ่ม Templates ตัวอย่าง (18 รายการ)
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                          {HOOK_TYPES.find(t => t.value === template.hookType)?.label || template.hookType}
                        </span>
                        {template.category && (
                          <span className="text-xs text-slate-500">{template.category}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(template.template)
                          alert('คัดลอกแล้ว!')
                        }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                      >
                        <Copy className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {template.template}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// CSV Import Modal Component
function CSVImportModal({
  onClose,
  onImport,
}: {
  onClose: () => void
  onImport: () => void
}) {
  const [csvText, setCsvText] = useState('')
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [autoGenerateHooks, setAutoGenerateHooks] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

  // Parse CSV text
  const parseCSV = (text: string) => {
    setError('')
    try {
      const lines = text.trim().split('\n')
      if (lines.length < 2) {
        setError('CSV ต้องมีอย่างน้อย 2 บรรทัด (header + data)')
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const rows: any[] = []

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Handle quoted values with commas
        const values: string[] = []
        let current = ''
        let inQuotes = false

        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        values.push(current.trim())

        const row: any = {}
        headers.forEach((header, idx) => {
          const value = values[idx] || ''
          // Map common header variations
          if (header === 'productid' || header === 'product_id' || header === 'id') {
            row.productId = value
          } else if (header === 'productname' || header === 'product_name' || header === 'name' || header === 'title') {
            row.productName = value
          } else if (header === 'productimage' || header === 'product_image' || header === 'image' || header === 'imageurl') {
            row.productImage = value
          } else if (header === 'affiliateurl' || header === 'affiliate_url' || header === 'url' || header === 'link') {
            row.affiliateUrl = value
          } else if (header === 'hook1' || header === 'hook_1' || header === 'opening') {
            row.hook1 = value
          } else if (header === 'hook2' || header === 'hook_2' || header === 'middle') {
            row.hook2 = value
          } else if (header === 'hook3' || header === 'hook_3' || header === 'closing') {
            row.hook3 = value
          } else if (header === 'ending' || header === 'cta') {
            row.ending = value
          } else if (header === 'caption' || header === 'description') {
            row.caption = value
          } else if (header === 'hashtags' || header === 'tags') {
            row.hashtags = value
          }
        })

        if (row.productId || row.productName) {
          rows.push(row)
        }
      }

      setParsedRows(rows)
    } catch (e: any) {
      setError('ไม่สามารถ parse CSV ได้: ' + e.message)
    }
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvText(text)
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  // Handle import
  const handleImport = async () => {
    if (parsedRows.length === 0) {
      setError('ไม่มีข้อมูลสำหรับ Import')
      return
    }

    setImporting(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/tiktok/jobs/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parsedRows,
          autoGenerateHooks,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResult({
        success: data.success,
        failed: data.failed,
        errors: data.errors || [],
      })

      if (data.success > 0) {
        setTimeout(() => {
          onImport()
        }, 2000)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setImporting(false)
    }
  }

  // Download template
  const downloadTemplate = () => {
    window.location.href = '/api/tiktok/jobs/import-csv'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6" />
            <div>
              <h2 className="font-bold text-lg">Import Jobs จาก CSV</h2>
              <p className="text-sm opacity-90">นำเข้าหลายรายการพร้อมกัน</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Download template */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">ดาวน์โหลด Template CSV</p>
              <p className="text-xs text-slate-500">ใช้เป็นตัวอย่างในการเตรียมข้อมูล</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-sm"
            >
              <FileDown className="w-4 h-4" />
              ดาวน์โหลด
            </button>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium mb-2">อัปโหลดไฟล์ CSV</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900/30 dark:file:text-green-400"
            />
          </div>

          {/* Or paste CSV */}
          <div>
            <label className="block text-sm font-medium mb-2">หรือ วาง CSV ข้อความ</label>
            <textarea
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value)
                parseCSV(e.target.value)
              }}
              placeholder="productId,productName,productImage,affiliateUrl,hook1,hook2,hook3,ending,caption,hashtags&#10;SHOPEE-123456,สินค้าตัวอย่าง,https://example.com/image.jpg,https://shopee.co.th/xxx,Hook เปิด,Hook กลาง,Hook ปิด,CTA,Caption,#hashtag1 #hashtag2"
              rows={6}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-slate-900 text-sm font-mono"
            />
          </div>

          {/* Auto-generate hooks option */}
          <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <input
              type="checkbox"
              id="autoGenerateHooks"
              checked={autoGenerateHooks}
              onChange={(e) => setAutoGenerateHooks(e.target.checked)}
              className="w-4 h-4 text-yellow-600 rounded"
            />
            <div>
              <label htmlFor="autoGenerateHooks" className="text-sm font-medium cursor-pointer">
                สร้าง Hooks อัตโนมัติ (AI)
              </label>
              <p className="text-xs text-slate-500">
                สำหรับ row ที่ไม่มี hook1 จะสร้าง Hooks ให้อัตโนมัติจากชื่อสินค้า
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="font-medium text-green-700 dark:text-green-400">Import สำเร็จ!</p>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                สำเร็จ: {result.success} รายการ | ล้มเหลว: {result.failed} รายการ
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                  <p className="font-medium">ข้อผิดพลาด:</p>
                  <ul className="list-disc list-inside">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {result.errors.length > 5 && <li>... และอีก {result.errors.length - 5} รายการ</li>}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Preview parsed data */}
          {parsedRows.length > 0 && !result && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                ตัวอย่างข้อมูล ({parsedRows.length} รายการ)
              </h3>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="max-h-60 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left">#</th>
                        <th className="px-2 py-2 text-left">Product ID</th>
                        <th className="px-2 py-2 text-left">ชื่อสินค้า</th>
                        <th className="px-2 py-2 text-left">รูป</th>
                        <th className="px-2 py-2 text-left">Hook1</th>
                        <th className="px-2 py-2 text-left">Hashtags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-2 py-1.5 text-slate-500">{i + 1}</td>
                          <td className="px-2 py-1.5 font-mono">{row.productId || '-'}</td>
                          <td className="px-2 py-1.5 max-w-[150px] truncate">{row.productName || '-'}</td>
                          <td className="px-2 py-1.5">
                            {row.productImage ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 max-w-[200px] truncate">
                            {row.hook1 || (
                              <span className="text-yellow-600 italic">
                                {autoGenerateHooks ? 'จะสร้างอัตโนมัติ' : '-'}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 max-w-[100px] truncate">{row.hashtags || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 10 && (
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 text-center">
                    ... และอีก {parsedRows.length - 10} รายการ
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleImport}
            disabled={parsedRows.length === 0 || importing || !!result}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลัง Import...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import {parsedRows.length} รายการ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Analytics Modal Component
function AnalyticsModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')
  const [analytics, setAnalytics] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/tiktok/analytics?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const data = await res.json()
      setAnalytics(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const PLATFORM_COLORS: Record<string, string> = {
    SHOPEE: 'bg-orange-500',
    LAZADA: 'bg-blue-500',
    TIKTOK: 'bg-pink-500',
    AMAZON: 'bg-yellow-500',
    OTHER: 'bg-gray-500',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            <div>
              <h2 className="font-bold text-lg">Analytics & Reports</h2>
              <p className="text-sm opacity-90">สถิติและข้อมูลเชิงลึก</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/20 text-white border border-white/30 text-sm"
            >
              <option value="7d" className="text-black">7 วันล่าสุด</option>
              <option value="30d" className="text-black">30 วันล่าสุด</option>
              <option value="all" className="text-black">ทั้งหมด</option>
            </select>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3" />
              <p>{error}</p>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <StatCard
                  label="ทั้งหมด"
                  value={analytics.overview.totalJobs}
                  icon={<Package className="w-5 h-5" />}
                  color="text-slate-600"
                />
                <StatCard
                  label="รอดำเนินการ"
                  value={analytics.overview.pending}
                  icon={<Clock className="w-5 h-5" />}
                  color="text-yellow-600"
                />
                <StatCard
                  label="กำลังประมวลผล"
                  value={analytics.overview.processing}
                  icon={<Activity className="w-5 h-5 animate-pulse" />}
                  color="text-blue-600"
                />
                <StatCard
                  label="สำเร็จ"
                  value={analytics.overview.done}
                  icon={<CheckCircle className="w-5 h-5" />}
                  color="text-green-600"
                />
                <StatCard
                  label="ล้มเหลว"
                  value={analytics.overview.failed}
                  icon={<AlertCircle className="w-5 h-5" />}
                  color="text-red-600"
                />
                <StatCard
                  label="อัตราสำเร็จ"
                  value={`${analytics.overview.successRate}%`}
                  icon={analytics.overview.successRate >= 80 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  color={analytics.overview.successRate >= 80 ? 'text-green-600' : 'text-orange-600'}
                />
                <StatCard
                  label="มีวิดีโอ"
                  value={analytics.overview.withVideo}
                  icon={<Film className="w-5 h-5" />}
                  color="text-purple-600"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Daily Chart */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-500" />
                    กิจกรรมรายวัน (7 วัน)
                  </h3>
                  <div className="flex items-end gap-2 h-40">
                    {analytics.dailyStats.map((day: any, i: number) => {
                      const maxVal = Math.max(...analytics.dailyStats.map((d: any) => d.created + d.completed + d.failed)) || 1
                      const total = day.created + day.completed + day.failed
                      const height = (total / maxVal) * 100
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex flex-col-reverse" style={{ height: '140px' }}>
                            <div
                              className="w-full bg-cyan-500 rounded-t transition-all"
                              style={{ height: `${(day.created / maxVal) * 100}%` }}
                              title={`สร้างใหม่: ${day.created}`}
                            />
                            <div
                              className="w-full bg-green-500"
                              style={{ height: `${(day.completed / maxVal) * 100}%` }}
                              title={`สำเร็จ: ${day.completed}`}
                            />
                            <div
                              className="w-full bg-red-500 rounded-t"
                              style={{ height: `${(day.failed / maxVal) * 100}%` }}
                              title={`ล้มเหลว: ${day.failed}`}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{day.dayLabel}</span>
                          <span className="text-xs font-medium">{total}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-cyan-500 rounded" />
                      <span>สร้างใหม่</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded" />
                      <span>สำเร็จ</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded" />
                      <span>ล้มเหลว</span>
                    </div>
                  </div>
                </div>

                {/* Platform Distribution */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-cyan-500" />
                    แหล่งที่มาสินค้า
                  </h3>
                  <div className="space-y-3">
                    {analytics.platformStats.filter((p: any) => p.count > 0).map((platform: any) => (
                      <div key={platform.platform} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded ${PLATFORM_COLORS[platform.platform] || 'bg-gray-400'}`} />
                        <span className="text-sm flex-1">{platform.platform}</span>
                        <span className="text-sm font-medium">{platform.count}</span>
                        <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${PLATFORM_COLORS[platform.platform] || 'bg-gray-400'}`}
                            style={{ width: `${platform.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-10">{platform.percentage}%</span>
                      </div>
                    ))}
                    {analytics.platformStats.filter((p: any) => p.count > 0).length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">ยังไม่มีข้อมูล</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Processing Stats & Hook Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Processing Time */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-500" />
                    เวลาประมวลผลเฉลี่ย
                  </h3>
                  {analytics.avgProcessingTime ? (
                    <div className="text-center py-4">
                      <p className="text-4xl font-bold text-cyan-600">
                        {analytics.avgProcessingTime.avgMinutes} <span className="text-lg">นาที</span>
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        จากตัวอย่าง {analytics.avgProcessingTime.sampleSize} วิดีโอ
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">ยังไม่มีข้อมูลเพียงพอ</p>
                  )}
                </div>

                {/* Hook Stats */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-500" />
                    สถิติ Hooks
                  </h3>
                  {analytics.hookStats.total > 0 ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">มี Hook 1:</span>
                        <span className="font-medium">{analytics.hookStats.withHook1} ({Math.round(analytics.hookStats.withHook1 / analytics.hookStats.total * 100)}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">มี Hook 2:</span>
                        <span className="font-medium">{analytics.hookStats.withHook2} ({Math.round(analytics.hookStats.withHook2 / analytics.hookStats.total * 100)}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">มี Hook 3:</span>
                        <span className="font-medium">{analytics.hookStats.withHook3} ({Math.round(analytics.hookStats.withHook3 / analytics.hookStats.total * 100)}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">มี Ending:</span>
                        <span className="font-medium">{analytics.hookStats.withEnding} ({Math.round(analytics.hookStats.withEnding / analytics.hookStats.total * 100)}%)</span>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                        <span className="text-slate-600 font-medium">ครบทุก Hook:</span>
                        <span className="font-bold text-green-600">{analytics.hookStats.withAllHooks} ({Math.round(analytics.hookStats.withAllHooks / analytics.hookStats.total * 100)}%)</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">ยังไม่มีข้อมูล</p>
                  )}
                </div>
              </div>

              {/* Recent Jobs */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-500" />
                  กิจกรรมล่าสุด
                </h3>
                {analytics.recentJobs.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.recentJobs.map((job: any) => (
                      <div
                        key={job.id}
                        className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-lg"
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          job.status === 'DONE' ? 'bg-green-500' :
                          job.status === 'FAILED' ? 'bg-red-500' :
                          job.status === 'PROCESSING' ? 'bg-blue-500 animate-pulse' :
                          'bg-yellow-500'
                        }`} />
                        <span className="text-sm flex-1 truncate">
                          {job.productName || job.id.slice(0, 8)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          job.status === 'DONE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          job.status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          job.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {job.status}
                        </span>
                        {job.videoUrl && (
                          <Film className="w-4 h-4 text-purple-500" />
                        )}
                        <span className="text-xs text-slate-500">
                          {new Date(job.updatedAt).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">ยังไม่มีกิจกรรม</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            อัพเดทล่าสุด: {new Date().toLocaleString('th-TH')}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.href = `/api/tiktok/analytics/export?period=${period}&format=csv`}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              <FileDown className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => window.location.href = `/api/tiktok/analytics/export?period=${period}&format=json`}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              <FileDown className="w-4 h-4" />
              Export JSON
            </button>
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component for Analytics
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
      <div className={`flex items-center gap-2 mb-1 ${color}`}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

// Trending Hashtags Section Component
function TrendingHashtagsSection({
  selectedTags,
  onAddTag,
  productName,
}: {
  selectedTags: string[]
  onAddTag: (tag: string) => void
  productName: string
}) {
  const [loading, setLoading] = useState(false)
  const [trendingData, setTrendingData] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expanded, setExpanded] = useState(false)

  const fetchTrending = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tiktok/trending-hashtags?category=${selectedCategory}`)
      if (res.ok) {
        const data = await res.json()
        setTrendingData(data)
      }
    } catch (e) {
      console.error('Failed to fetch trending hashtags:', e)
    } finally {
      setLoading(false)
    }
  }

  const generateForProduct = async () => {
    if (!productName) {
      alert('กรุณากรอกชื่อสินค้าก่อน')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/tiktok/trending-hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, count: 10 }),
      })

      if (res.ok) {
        const data = await res.json()
        data.hashtags.forEach((tag: string) => onAddTag(tag))
      }
    } catch (e) {
      console.error('Failed to generate hashtags:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (expanded && !trendingData) {
      fetchTrending()
    }
  }, [expanded])

  useEffect(() => {
    if (expanded) {
      fetchTrending()
    }
  }, [selectedCategory])

  return (
    <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-pink-600" />
          <span className="font-medium text-pink-900 dark:text-pink-100">Trending Hashtags</span>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin text-pink-500" />}
          <span className="text-xs text-pink-600">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Quick generate button */}
          <button
            type="button"
            onClick={generateForProduct}
            disabled={loading || !productName}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            สร้าง Hashtags จากชื่อสินค้า
          </button>

          {/* Category tabs */}
          {trendingData?.categories && (
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-2 py-1 text-xs rounded-lg ${
                  selectedCategory === 'all'
                    ? 'bg-pink-500 text-white'
                    : 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300'
                }`}
              >
                ทั้งหมด
              </button>
              {trendingData.categories.map((cat: any) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-1 text-xs rounded-lg ${
                    selectedCategory === cat.id
                      ? 'bg-pink-500 text-white'
                      : 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Trending tags */}
          {trendingData?.trending && (
            <div>
              <p className="text-xs text-pink-600 dark:text-pink-400 mb-2">คลิกเพื่อเพิ่ม:</p>
              <div className="flex flex-wrap gap-1">
                {trendingData.trending.map((item: any) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => onAddTag(item.tag)}
                    disabled={selectedTags.includes(item.tag)}
                    className={`px-2 py-1 text-xs rounded-full transition-all ${
                      selectedTags.includes(item.tag)
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/50 border border-pink-200 dark:border-pink-700'
                    }`}
                  >
                    {item.tag}
                    {selectedTags.includes(item.tag) && ' ✓'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular on platform */}
          {trendingData?.popular && trendingData.popular.length > 0 && (
            <div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">ใช้บ่อยในระบบ:</p>
              <div className="flex flex-wrap gap-1">
                {trendingData.popular.map((item: any) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => onAddTag(item.tag)}
                    disabled={selectedTags.includes(item.tag)}
                    className={`px-2 py-1 text-xs rounded-full ${
                      selectedTags.includes(item.tag)
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-not-allowed'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/50'
                    }`}
                  >
                    {item.tag} <span className="opacity-60">({item.count})</span>
                    {selectedTags.includes(item.tag) && ' ✓'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
