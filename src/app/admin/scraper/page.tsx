'use client'

import { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Download, Link as LinkIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ScrapedProduct {
  productId: string
  title: string
  price: number
  imageUrl: string
  affiliateUrl: string
  commission?: string
  commissionRate?: string
}

export default function ScraperPage() {
  const [url, setUrl] = useState('')
  const [limit, setLimit] = useState(50)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [currentProduct, setCurrentProduct] = useState('')
  const [results, setResults] = useState<ScrapedProduct[]>([])
  const [error, setError] = useState('')

  const handleScrape = async () => {
    if (!url.trim()) {
      setError('กรุณาใส่ URL หน้า Shopee Affiliate')
      return
    }

    // Validate URL
    if (!url.includes('shopee.co.th')) {
      setError('URL ต้องเป็นหน้า Shopee เท่านั้น')
      return
    }

    setIsLoading(true)
    setError('')
    setProgress(0)
    setTotal(0)
    setResults([])
    setCurrentProduct('')

    try {
      const response = await fetch('/api/shopee/scrape-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, limit }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to scrape')
      }

      // Check if response is streaming
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('text/event-stream')) {
        // Handle Server-Sent Events (SSE)
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) throw new Error('No reader available')

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'progress') {
                setProgress(data.current)
                setTotal(data.total)
                setCurrentProduct(data.productTitle || '')
              } else if (data.type === 'product') {
                setResults((prev) => [...prev, data.product])
              } else if (data.type === 'complete') {
                setResults(data.products)
                setProgress(data.total)
                setTotal(data.total)
              } else if (data.type === 'error') {
                setError(data.message)
              }
            }
          }
        }
      } else {
        // Regular JSON response
        const data = await response.json()
        setResults(data.products || [])
        setTotal(data.products?.length || 0)
        setProgress(data.products?.length || 0)
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadCSV = () => {
    if (results.length === 0) return

    // Create CSV content
    const headers = ['รหัสสินค้า', 'ชื่อสินค้า', 'ราคา', 'รูปภาพ', 'ลิงก์แอฟฟิลิเอท', 'คอมมิชชั่น', 'อัตรา']
    const rows = results.map((p) => [
      p.productId,
      `"${p.title.replace(/"/g, '""')}"`,
      p.price,
      p.imageUrl,
      p.affiliateUrl,
      p.commission || '',
      p.commissionRate || '',
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    // Add BOM for Excel UTF-8 support
    const bom = '\uFEFF'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `shopee-products-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            🔗 Shopee Affiliate Scraper
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            ดึงข้อมูลสินค้าจากหน้า Shopee Affiliate Dashboard พร้อม rate limiting
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="space-y-4">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                URL หน้า Shopee Affiliate
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://shopee.co.th/..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                วาง URL จากหน้า Affiliate Dashboard ของ Shopee
              </p>
            </div>

            {/* Limit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  จำนวนสินค้า
                </label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                >
                  <option value={10}>10 รายการ</option>
                  <option value={25}>25 รายการ</option>
                  <option value={50}>50 รายการ</option>
                  <option value={100}>100 รายการ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Delay (วินาที)
                </label>
                <input
                  type="text"
                  value="2-3 (สุ่ม)"
                  disabled
                  className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                />
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>หมายเหตุ:</strong> ระบบจะมี delay 2-3 วินาทีระหว่างแต่ละรายการ เพื่อป้องกันการโดน block
                <br />
                เวลาโดยประมาณ: <strong>{Math.ceil(limit * 2.5 / 60)} นาที</strong> สำหรับ {limit} รายการ
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleScrape}
              disabled={isLoading || !url.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังดึงข้อมูล...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  เริ่มดึงข้อมูล
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress */}
        {isLoading && total > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-6 mb-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  กำลังดึงข้อมูล...
                </span>
                <span className="text-sm font-bold text-primary">
                  {progress} / {total}
                </span>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                  style={{ width: `${(progress / total) * 100}%` }}
                />
              </div>
            </div>
            {currentProduct && (
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                📦 {currentProduct}
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-200">
              <strong>ข้อผิดพลาด:</strong> {error}
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  ดึงข้อมูลสำเร็จ ({results.length} รายการ)
                </h2>
              </div>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-2 font-bold text-slate-700 dark:text-slate-300">รูป</th>
                    <th className="text-left py-3 px-2 font-bold text-slate-700 dark:text-slate-300">ชื่อสินค้า</th>
                    <th className="text-right py-3 px-2 font-bold text-slate-700 dark:text-slate-300">ราคา</th>
                    <th className="text-left py-3 px-2 font-bold text-slate-700 dark:text-slate-300">คอมมิชชั่น</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((product, index) => (
                    <tr key={index} className="border-b border-slate-100 dark:border-slate-700">
                      <td className="py-3 px-2">
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      </td>
                      <td className="py-3 px-2 text-slate-900 dark:text-white">
                        {product.title.length > 50 ? product.title.substring(0, 50) + '...' : product.title}
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-slate-900 dark:text-white">
                        ฿{product.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-400">
                        {product.commission || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
