'use client'

import { useState } from 'react'
import { Image, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

export default function AdminToolsPage() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    updated: number
    total: number
  } | null>(null)

  async function handleUpdateImages() {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการอัพเดทรูปภาพสินค้าทั้งหมด?')) return

    setIsUpdating(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/update-images', {
        method: 'POST'
      })

      const data = await res.json()

      if (res.ok) {
        setResult({
          success: true,
          message: data.message,
          updated: data.updated,
          total: data.total
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'เกิดข้อผิดพลาด',
          updated: 0,
          total: 0
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
        updated: 0,
        total: 0
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-white">เครื่องมือสำหรับ Admin</h1>
        <p className="text-slate-700 dark:text-slate-300 mt-2">
          เครื่องมือช่วยจัดการระบบ
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Update Images Tool */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Image className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-black dark:text-white mb-2">
                อัพเดทรูปภาพสินค้า
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                อัพเดทรูปภาพสินค้าทั้งหมดให้เป็น placeholder ตามหมวดหมู่
              </p>

              {result && (
                <div className={`mb-4 p-4 rounded-lg ${
                  result.success
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-start gap-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${
                        result.success
                          ? 'text-green-800 dark:text-green-300'
                          : 'text-red-800 dark:text-red-300'
                      }`}>
                        {result.message}
                      </p>
                      {result.success && (
                        <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                          อัพเดทสำเร็จ {result.updated} จาก {result.total} สินค้า
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleUpdateImages}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    กำลังอัพเดท...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    อัพเดทรูปภาพทั้งหมด
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
