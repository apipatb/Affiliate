'use client'

import { useState, useEffect } from 'react'
import {
  Zap,
  Play,
  Pause,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  Bell,
  Send,
  Calendar,
  TrendingUp,
  Package,
  Video,
  Sparkles,
  AlertTriangle,
  Download,
  Rocket,
} from 'lucide-react'

interface PipelineConfig {
  bestPostingHours: number[]
  maxPostsPerDay: number
  minPostInterval: number
  autoGenerateHooks: boolean
  autoGenerateVideo: boolean
  autoSchedule: boolean
  notificationsEnabled: boolean
}

interface QueueStatus {
  needsProcessing: number
  processing: number
  scheduledToPost: number
  completed: number
  failed: number
}

interface PipelineStats {
  totalJobs: number
  activeAccounts: number
}

export default function AutoPipelineDashboard() {
  const [config, setConfig] = useState<PipelineConfig | null>(null)
  const [queue, setQueue] = useState<QueueStatus | null>(null)
  const [stats, setStats] = useState<PipelineStats | null>(null)
  const [nextSlot, setNextSlot] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null)
  const [productsWithoutJobs, setProductsWithoutJobs] = useState(0)

  // Fetch pipeline status
  const fetchStatus = async () => {
    try {
      const [configRes, queueRes, productsRes, jobsRes] = await Promise.all([
        fetch('/api/tiktok/auto-pipeline'),
        fetch('/api/tiktok/auto-pipeline?action=queue'),
        fetch('/api/products?limit=10000').then(r => r.json()),
        fetch('/api/tiktok/jobs?limit=10000').then(r => r.json()),
      ])

      const configData = await configRes.json()
      const queueData = await queueRes.json()

      if (configData.success) {
        setConfig(configData.data.config)
        setStats(configData.data.stats)
      }

      if (queueData.success) {
        setQueue(queueData.data.queue)
      }

      // Calculate products without TikTok jobs
      const allProducts = productsRes.data || productsRes.products || []
      const allJobs = Array.isArray(jobsRes) ? jobsRes : (jobsRes.data || [])
      const jobProductIds = new Set(allJobs.map((j: any) => j.internalProductId).filter(Boolean))
      const productsNoJob = allProducts.filter((p: any) => !jobProductIds.has(p.id))
      setProductsWithoutJobs(productsNoJob.length)

      // Get next posting slot
      const slotRes = await fetch('/api/tiktok/auto-pipeline?action=next-slot')
      const slotData = await slotRes.json()
      if (slotData.success) {
        setNextSlot(slotData.data.nextSlotLocal)
      }
    } catch (error) {
      console.error('Failed to fetch pipeline status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  // Process pending pipelines
  const processPending = async () => {
    setProcessing(true)
    setActionResult(null)

    try {
      const res = await fetch('/api/tiktok/auto-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process-pending', limit: 5 }),
      })

      const data = await res.json()

      if (data.success) {
        setActionResult({
          success: true,
          message: `ประมวลผลสำเร็จ ${data.data.success}/${data.data.processed} jobs`,
        })
        fetchStatus()
      } else {
        setActionResult({ success: false, message: data.error || 'เกิดข้อผิดพลาด' })
      }
    } catch (error) {
      setActionResult({ success: false, message: 'ไม่สามารถเชื่อมต่อ server ได้' })
    } finally {
      setProcessing(false)
    }
  }

  // Schedule all unscheduled jobs
  const scheduleAll = async () => {
    setProcessing(true)
    setActionResult(null)

    try {
      const res = await fetch('/api/tiktok/auto-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'schedule-all', limit: 10 }),
      })

      const data = await res.json()

      if (data.success) {
        setActionResult({
          success: true,
          message: `ตั้งเวลาโพสต์สำเร็จ ${data.data.scheduled} jobs`,
        })
        fetchStatus()
      } else {
        setActionResult({ success: false, message: data.error || 'เกิดข้อผิดพลาด' })
      }
    } catch (error) {
      setActionResult({ success: false, message: 'ไม่สามารถเชื่อมต่อ server ได้' })
    } finally {
      setProcessing(false)
    }
  }

  // Test webhook
  const testWebhook = async () => {
    setProcessing(true)
    try {
      const res = await fetch('/api/tiktok/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'all', message: '🧪 ทดสอบจาก Auto Pipeline Dashboard' }),
      })

      const data = await res.json()

      if (data.success) {
        setActionResult({ success: true, message: 'ส่ง notification ทดสอบแล้ว' })
      } else {
        setActionResult({ success: false, message: 'ยังไม่ได้ตั้งค่า LINE/Discord' })
      }
    } catch (error) {
      setActionResult({ success: false, message: 'ไม่สามารถส่ง notification ได้' })
    } finally {
      setProcessing(false)
    }
  }

  // Import all products as TikTok jobs
  const importAllProducts = async (runPipeline: boolean = false) => {
    setProcessing(true)
    setActionResult(null)

    try {
      const res = await fetch('/api/tiktok/auto-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import-all-products',
          limit: 20,
          runPipeline,
        }),
      })

      const data = await res.json()

      if (data.success) {
        const summary = data.data.summary
        setActionResult({
          success: true,
          message: `นำเข้า ${summary.success}/${summary.total} สินค้าเป็น TikTok Jobs${summary.remainingProducts > 0 ? ` (เหลืออีก ${summary.remainingProducts})` : ''}`,
        })
        fetchStatus()
      } else {
        setActionResult({ success: false, message: data.error || data.message || 'เกิดข้อผิดพลาด' })
      }
    } catch (error) {
      setActionResult({ success: false, message: 'ไม่สามารถนำเข้าสินค้าได้' })
    } finally {
      setProcessing(false)
    }
  }

  // Manual trigger cron
  const triggerCron = async () => {
    setProcessing(true)
    setActionResult(null)

    try {
      const res = await fetch('/api/cron/tiktok-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'all' }),
      })

      const data = await res.json()

      if (data.success) {
        const pipelines = data.results?.pipelines
        const posts = data.results?.posts

        let message = 'Cron ทำงานสำเร็จ: '
        if (pipelines) message += `Pipeline ${pipelines.success}/${pipelines.processed}, `
        if (posts) message += `Posts ${posts.successCount}/${posts.processed}`

        setActionResult({ success: true, message })
        fetchStatus()
      } else {
        setActionResult({ success: false, message: data.error || 'เกิดข้อผิดพลาด' })
      }
    } catch (error) {
      setActionResult({ success: false, message: 'ไม่สามารถ trigger cron ได้' })
    } finally {
      setProcessing(false)
    }
  }

  // Retry all failed jobs
  const retryAllFailed = async () => {
    if (!queue?.failed || queue.failed === 0) {
      setActionResult({ success: false, message: 'ไม่มี jobs ที่ล้มเหลว' })
      return
    }

    setProcessing(true)
    setActionResult(null)

    try {
      const res = await fetch('/api/tiktok/jobs/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true, limit: 10 }),
      })

      const data = await res.json()

      if (data.success) {
        setActionResult({
          success: true,
          message: `Retry สำเร็จ ${data.retried || 0} jobs`,
        })
        fetchStatus()
      } else {
        setActionResult({ success: false, message: data.error || 'เกิดข้อผิดพลาด' })
      }
    } catch (error) {
      setActionResult({ success: false, message: 'ไม่สามารถ retry jobs ได้' })
    } finally {
      setProcessing(false)
    }
  }

  // Generate all missing hooks
  const generateAllHooks = async () => {
    setProcessing(true)
    setActionResult(null)

    try {
      const res = await fetch('/api/tiktok/jobs?status=PENDING&limit=100')
      const data = await res.json()
      const jobs = Array.isArray(data) ? data : (data.data?.jobs || [])
      const jobsNeedHooks = jobs.filter((j: any) => !j.hook1 || j.hook1.trim() === '')

      if (jobsNeedHooks.length === 0) {
        setActionResult({ success: true, message: 'ทุก jobs มี hooks แล้ว' })
        setProcessing(false)
        return
      }

      let success = 0
      let failed = 0

      for (const job of jobsNeedHooks.slice(0, 10)) {
        try {
          const hookRes = await fetch('/api/tiktok/generate-hooks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productName: job.productName || job.productid }),
          })

          if (hookRes.ok) {
            const hooks = await hookRes.json()
            await fetch(`/api/tiktok/jobs/${job.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                hook1: hooks.hook1,
                hook2: hooks.hook2,
                hook3: hooks.hook3,
                ending: hooks.ending,
                caption: hooks.caption,
                hashtags: hooks.hashtags,
              }),
            })
            success++
          } else {
            failed++
          }
        } catch (e) {
          failed++
        }
      }

      setActionResult({
        success: true,
        message: `สร้าง hooks สำเร็จ ${success}/${jobsNeedHooks.length} jobs${jobsNeedHooks.length > 10 ? ' (max 10 ต่อครั้ง)' : ''}`,
      })
      fetchStatus()
    } catch (error) {
      setActionResult({ success: false, message: 'ไม่สามารถสร้าง hooks ได้' })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          <span className="ml-3 text-gray-400">กำลังโหลด Auto Pipeline...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Auto Pipeline</h2>
            <p className="text-sm text-gray-400">ระบบอัตโนมัติสำหรับสร้างและโพสต์วิดีโอ</p>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="รีเฟรช"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Action Result */}
      {actionResult && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            actionResult.success
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {actionResult.success ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{actionResult.message}</span>
        </div>
      )}

      {/* Queue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-400">รอประมวลผล</span>
          </div>
          <div className="text-2xl font-bold text-yellow-300">{queue?.needsProcessing || 0}</div>
        </div>

        <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Loader2 className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-400">กำลังทำ</span>
          </div>
          <div className="text-2xl font-bold text-blue-300">{queue?.processing || 0}</div>
        </div>

        <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-400">ตั้งเวลาโพสต์</span>
          </div>
          <div className="text-2xl font-bold text-purple-300">{queue?.scheduledToPost || 0}</div>
        </div>

        <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400">เสร็จแล้ว</span>
          </div>
          <div className="text-2xl font-bold text-green-300">{queue?.completed || 0}</div>
        </div>

        <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-400">ล้มเหลว</span>
          </div>
          <div className="text-2xl font-bold text-red-300">{queue?.failed || 0}</div>
        </div>
      </div>

      {/* Config Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" /> การตั้งค่า Auto
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">สร้าง Hooks อัตโนมัติ</span>
              <span className={config?.autoGenerateHooks ? 'text-green-400' : 'text-gray-500'}>
                {config?.autoGenerateHooks ? '✓ เปิด' : '✗ ปิด'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">สร้าง Video อัตโนมัติ</span>
              <span className={config?.autoGenerateVideo ? 'text-green-400' : 'text-gray-500'}>
                {config?.autoGenerateVideo ? '✓ เปิด' : '✗ ปิด'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">ตั้งเวลาโพสต์อัตโนมัติ</span>
              <span className={config?.autoSchedule ? 'text-green-400' : 'text-gray-500'}>
                {config?.autoSchedule ? '✓ เปิด' : '✗ ปิด'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">แจ้งเตือน LINE/Discord</span>
              <span className={config?.notificationsEnabled ? 'text-green-400' : 'text-yellow-400'}>
                {config?.notificationsEnabled ? '✓ เปิด' : '⚠ ยังไม่ตั้งค่า'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> เวลาโพสต์
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">เวลาที่ดีที่สุด</span>
              <span className="text-white">
                {config?.bestPostingHours?.map(h => `${h}:00`).join(', ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">โพสต์สูงสุด/วัน</span>
              <span className="text-white">{config?.maxPostsPerDay} โพสต์</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">ระยะห่างขั้นต่ำ</span>
              <span className="text-white">{config?.minPostInterval} นาที</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">โพสต์ถัดไป</span>
              <span className="text-purple-400">{nextSlot || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning if no accounts */}
      {stats?.activeAccounts === 0 && (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center gap-2 text-yellow-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>ยังไม่มี TikTok Account เชื่อมต่อ - ไม่สามารถโพสต์อัตโนมัติได้</span>
        </div>
      )}

      {/* Import Products Section */}
      {productsWithoutJobs > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Package className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-medium text-amber-300">
                  พบ {productsWithoutJobs} สินค้าที่ยังไม่มี TikTok Job
                </h3>
                <p className="text-xs text-amber-400/70">นำเข้าสินค้าเพื่อเริ่มสร้างวิดีโอ TikTok อัตโนมัติ</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => importAllProducts(false)}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Import Jobs Only
              </button>
              <button
                onClick={() => importAllProducts(true)}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-orange-500/20"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4" />
                )}
                Import + Auto Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <button
          onClick={processPending}
          disabled={processing || (queue?.needsProcessing || 0) === 0}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          {processing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>Process Queue</span>
        </button>

        <button
          onClick={scheduleAll}
          disabled={processing || stats?.activeAccounts === 0}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          <Clock className="w-4 h-4" />
          <span>Schedule All</span>
        </button>

        <button
          onClick={triggerCron}
          disabled={processing}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          {processing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>Run Cron</span>
        </button>

        <button
          onClick={testWebhook}
          disabled={processing}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span>Test Notify</span>
        </button>
      </div>

      {/* Action Buttons - Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={generateAllHooks}
          disabled={processing}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          {processing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>Generate Hooks</span>
        </button>

        <button
          onClick={retryAllFailed}
          disabled={processing || (queue?.failed || 0) === 0}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Failed ({queue?.failed || 0})</span>
        </button>

        <button
          onClick={() => importAllProducts(false)}
          disabled={processing || productsWithoutJobs === 0}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Import ({productsWithoutJobs})</span>
        </button>

        <button
          onClick={() => window.open('/admin/tiktok', '_blank')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Full Dashboard</span>
        </button>
      </div>

      {/* Flow Diagram */}
      <div className="mt-6 p-4 bg-black/20 rounded-lg">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Auto Pipeline Flow</h3>
        <div className="flex items-center justify-between text-xs overflow-x-auto pb-2">
          <div className="flex items-center gap-1 text-yellow-400 whitespace-nowrap">
            <Package className="w-4 h-4" />
            <span>Product</span>
          </div>
          <span className="text-gray-600">→</span>
          <div className="flex items-center gap-1 text-blue-400 whitespace-nowrap">
            <Sparkles className="w-4 h-4" />
            <span>Hooks (AI)</span>
          </div>
          <span className="text-gray-600">→</span>
          <div className="flex items-center gap-1 text-purple-400 whitespace-nowrap">
            <Video className="w-4 h-4" />
            <span>Video</span>
          </div>
          <span className="text-gray-600">→</span>
          <div className="flex items-center gap-1 text-pink-400 whitespace-nowrap">
            <Clock className="w-4 h-4" />
            <span>Schedule</span>
          </div>
          <span className="text-gray-600">→</span>
          <div className="flex items-center gap-1 text-green-400 whitespace-nowrap">
            <Send className="w-4 h-4" />
            <span>Post</span>
          </div>
          <span className="text-gray-600">→</span>
          <div className="flex items-center gap-1 text-cyan-400 whitespace-nowrap">
            <Bell className="w-4 h-4" />
            <span>Notify</span>
          </div>
        </div>
      </div>
    </div>
  )
}
