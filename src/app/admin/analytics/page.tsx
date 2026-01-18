'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Package,
  Layers,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Award,
  Target,
  Activity,
  Calendar
} from 'lucide-react'

interface HistoryData {
  history: {
    date: string
    clicks: number
    byPlatform: Record<string, number>
  }[]
  summary: {
    totalClicks: number
    avgPerDay: string
    trend: string
    peakDay: string
    peakClicks: number
    period: string
    days: number
  }
}

interface AnalyticsData {
  overview: {
    totalProducts: number
    totalClicks: number
    totalCategories: number
    productsWithClicks: number
    clickRate: string
    avgClicksPerProduct: string
  }
  topProducts: {
    id: string
    title: string
    clicks: number
    platform: string
    category: { name: string } | null
  }[]
  categoryStats: {
    name: string
    clicks: number
    productCount: number
  }[]
  platformStats: {
    platform: string
    clicks: number
    count: number
  }[]
  recentActivity: {
    id: string
    title: string
    clicks: number
    updatedAt: string
  }[]
}

const PLATFORM_COLORS: Record<string, string> = {
  SHOPEE: 'bg-orange-500',
  LAZADA: 'bg-blue-600',
  AMAZON: 'bg-yellow-500',
  ALIEXPRESS: 'bg-red-500',
  TIKTOK: 'bg-pink-500',
  OTHER: 'bg-gray-500'
}

const PLATFORM_NAMES: Record<string, string> = {
  SHOPEE: 'Shopee',
  LAZADA: 'Lazada',
  AMAZON: 'Amazon',
  ALIEXPRESS: 'AliExpress',
  TIKTOK: 'TikTok Shop',
  OTHER: 'Other'
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [historyData, setHistoryData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyDays, setHistoryDays] = useState(30)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [analyticsRes, historyRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch(`/api/analytics/history?days=${historyDays}`)
      ])

      if (!analyticsRes.ok) throw new Error('Failed to fetch analytics')

      const [analyticsJson, historyJson] = await Promise.all([
        analyticsRes.json(),
        historyRes.ok ? historyRes.json() : null
      ])

      setData(analyticsJson)
      setHistoryData(historyJson)
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [historyDays])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
              <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'เกิดข้อผิดพลาด'}</p>
          <button onClick={fetchData} className="btn-primary">
            ลองใหม่
          </button>
        </div>
      </div>
    )
  }

  const maxClicks = Math.max(...data.topProducts.map(p => p.clicks), 1)
  const maxCategoryClicks = Math.max(...data.categoryStats.map(c => c.clicks), 1)
  const maxPlatformClicks = Math.max(...data.platformStats.map(p => p.clicks), 1)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-primary" />
                Click Analytics
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                สถิติการคลิกและประสิทธิภาพสินค้า
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            รีเฟรช
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MousePointerClick className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs text-green-500 font-medium">Total</span>
            </div>
            <p className="text-3xl font-bold text-black dark:text-white">
              {data.overview.totalClicks.toLocaleString()}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">คลิกทั้งหมด</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs text-slate-500">{data.overview.productsWithClicks} มีคลิก</span>
            </div>
            <p className="text-3xl font-bold text-black dark:text-white">
              {data.overview.totalProducts}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">สินค้าทั้งหมด</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-black dark:text-white">
              {data.overview.clickRate}%
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">อัตราคลิก (สินค้าที่มีคลิก)</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-black dark:text-white">
              {data.overview.avgClicksPerProduct}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">คลิกเฉลี่ย/สินค้า</p>
          </div>
        </div>

        {/* Click History Chart */}
        {historyData && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-black dark:text-white">
                  คลิกรายวัน
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={historyDays}
                  onChange={(e) => setHistoryDays(parseInt(e.target.value))}
                  className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-black dark:text-white"
                >
                  <option value={7}>7 วัน</option>
                  <option value={14}>14 วัน</option>
                  <option value={30}>30 วัน</option>
                  <option value={90}>90 วัน</option>
                </select>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-black dark:text-white">
                  {historyData.summary.totalClicks}
                </p>
                <p className="text-xs text-slate-500">คลิกในช่วงนี้</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-black dark:text-white">
                  {historyData.summary.avgPerDay}
                </p>
                <p className="text-xs text-slate-500">เฉลี่ย/วัน</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  {parseFloat(historyData.summary.trend) >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <p className={`text-2xl font-bold ${
                    parseFloat(historyData.summary.trend) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {historyData.summary.trend}%
                  </p>
                </div>
                <p className="text-xs text-slate-500">แนวโน้ม</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-black dark:text-white">
                  {historyData.summary.peakClicks}
                </p>
                <p className="text-xs text-slate-500">สูงสุด ({historyData.summary.peakDay?.slice(5) || '-'})</p>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="relative h-48">
              {historyData.history.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500">
                  ยังไม่มีข้อมูล - เริ่มบันทึกเมื่อมีคลิกใหม่
                </div>
              ) : (
                <div className="flex items-end justify-between h-full gap-1">
                  {(() => {
                    const maxHistoryClicks = Math.max(...historyData.history.map(h => h.clicks), 1)
                    // Show only last N bars based on screen (show fewer for smaller screens)
                    const displayData = historyData.history.slice(-Math.min(historyData.history.length, 30))

                    return displayData.map((item, idx) => {
                      const height = (item.clicks / maxHistoryClicks) * 100
                      const isToday = item.date === new Date().toISOString().split('T')[0]

                      return (
                        <div
                          key={item.date}
                          className="flex-1 flex flex-col items-center group relative"
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                            <div className="bg-slate-800 dark:bg-slate-600 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                              <p className="font-medium">{item.date}</p>
                              <p>{item.clicks} คลิก</p>
                            </div>
                          </div>

                          {/* Bar */}
                          <div
                            className={`w-full rounded-t transition-all duration-300 ${
                              isToday
                                ? 'bg-primary'
                                : 'bg-blue-400 dark:bg-blue-500 hover:bg-primary'
                            }`}
                            style={{ height: `${Math.max(height, 2)}%` }}
                          />

                          {/* Date label (show every 5th or on hover) */}
                          {(idx % 5 === 0 || idx === displayData.length - 1) && (
                            <span className="text-[10px] text-slate-400 mt-1 transform -rotate-45 origin-top-left">
                              {item.date.slice(5)}
                            </span>
                          )}
                        </div>
                      )
                    })
                  })()}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 text-center mt-4">
              * ข้อมูลเริ่มบันทึกเมื่อมีการอัปเดต ClickLog model
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Products */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-black dark:text-white mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              สินค้ายอดคลิกสูงสุด
            </h2>
            <div className="space-y-4">
              {data.topProducts.length === 0 ? (
                <p className="text-slate-500 text-center py-8">ยังไม่มีข้อมูลคลิก</p>
              ) : (
                data.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-slate-200 text-slate-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-black dark:text-white truncate">
                          {product.title}
                        </p>
                        <Link
                          href={`/products/${product.id}`}
                          target="_blank"
                          className="text-slate-400 hover:text-primary"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-500"
                            style={{ width: `${(product.clicks / maxClicks) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-16 text-right">
                          {product.clicks.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Category Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-black dark:text-white mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" />
              คลิกตามหมวดหมู่
            </h2>
            <div className="space-y-4">
              {data.categoryStats.length === 0 ? (
                <p className="text-slate-500 text-center py-8">ยังไม่มีข้อมูล</p>
              ) : (
                data.categoryStats.slice(0, 8).map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-black dark:text-white font-medium">{cat.name}</span>
                      <span className="text-slate-500">
                        {cat.clicks.toLocaleString()} คลิก • {cat.productCount} สินค้า
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${(cat.clicks / maxCategoryClicks) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-black dark:text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              คลิกตาม Platform
            </h2>
            <div className="space-y-4">
              {data.platformStats.map((platform) => (
                <div key={platform.platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${PLATFORM_COLORS[platform.platform] || PLATFORM_COLORS.OTHER}`} />
                      <span className="text-sm font-medium text-black dark:text-white">
                        {PLATFORM_NAMES[platform.platform] || platform.platform}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500">
                      {platform.clicks.toLocaleString()} คลิก • {platform.count} สินค้า
                    </span>
                  </div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${PLATFORM_COLORS[platform.platform] || PLATFORM_COLORS.OTHER} rounded-full transition-all duration-500`}
                      style={{ width: `${(platform.clicks / maxPlatformClicks) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Platform Pie Chart Visualization */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {data.platformStats.map((platform) => {
                  const percentage = data.overview.totalClicks > 0
                    ? ((platform.clicks / data.overview.totalClicks) * 100).toFixed(1)
                    : '0'
                  return (
                    <div key={platform.platform} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${PLATFORM_COLORS[platform.platform] || PLATFORM_COLORS.OTHER}`} />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {PLATFORM_NAMES[platform.platform] || platform.platform}: {percentage}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-black dark:text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              กิจกรรมล่าสุด
            </h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data.recentActivity.length === 0 ? (
                <p className="text-slate-500 text-center py-8">ยังไม่มีกิจกรรมล่าสุด</p>
              ) : (
                data.recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(item.updatedAt).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-primary font-medium">
                      <MousePointerClick className="w-4 h-4" />
                      {item.clicks}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
