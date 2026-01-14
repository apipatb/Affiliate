'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface ImportResult {
  productId: string
  title: string
  id?: string
  category?: string
  error?: string
}

export default function BulkImportPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [featured, setFeatured] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    total: number
    imported: number
    failed: number
    products: ImportResult[]
    errors: ImportResult[]
  } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('featured', featured.toString())

      const res = await fetch('/api/shopee/bulk-import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setResult(data)
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการ import')
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setLoading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        alert('กรุณาเลือกไฟล์ CSV เท่านั้น')
        return
      }
      setFile(selectedFile)
    }
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-slate-100">Import หลายสินค้าจาก CSV</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          อัพโหลดไฟล์ CSV จาก Shopee Affiliate เพื่อ import สินค้าหลายรายการพร้อมกัน
        </p>
      </div>

      {!result ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-black dark:text-slate-200">
                ไฟล์ CSV <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex flex-col items-center px-4 py-6 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-primary dark:hover:border-blue-400 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {file ? file.name : 'คลิกเพื่อเลือกไฟล์ CSV'}
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                </label>
              </div>
              {file && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  ✓ เลือกไฟล์: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>✨ Auto-Categorization:</strong> ระบบจะจัดหมวดหมู่สินค้าอัตโนมัติจากชื่อสินค้า ไม่ต้องเลือกเอง!
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-primary border-slate-300 dark:border-slate-600 rounded focus:ring-primary"
              />
              <label htmlFor="featured" className="ml-2 text-sm text-black dark:text-slate-200">
                ตั้งสินค้าทั้งหมดเป็นสินค้าแนะนำ
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !file}
                className="flex-1 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลัง Import...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Import สินค้า
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/products')}
                className="px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-lg text-black dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl">
          {/* Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold mb-4 text-black dark:text-slate-100">ผลการ Import</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.total}</div>
                <div className="text-sm text-blue-800 dark:text-blue-300">ทั้งหมด</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{result.imported}</div>
                <div className="text-sm text-green-800 dark:text-green-300">สำเร็จ</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{result.failed}</div>
                <div className="text-sm text-red-800 dark:text-red-300">ล้มเหลว</div>
              </div>
            </div>
          </div>

          {/* Imported Products */}
          {result.products.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-bold mb-4 text-green-700 dark:text-green-400 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                สินค้าที่ Import สำเร็จ ({result.imported})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {result.products.map((product, index) => (
                  <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-black dark:text-slate-100 truncate">
                          {product.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          ID: {product.productId}
                          {product.category && (
                            <span className="ml-2 text-blue-600 dark:text-blue-400">
                              • หมวดหมู่: {product.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-bold mb-4 text-red-700 dark:text-red-400 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                สินค้าที่ล้มเหลว ({result.failed})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {result.errors.map((error, index) => (
                  <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-black dark:text-slate-100">
                          {error.title}
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {error.error}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setResult(null)
                setFile(null)
                setFeatured(false)
              }}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Import ไฟล์ใหม่
            </button>
            <button
              onClick={() => router.push('/admin/products')}
              className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-black dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              ดูสินค้าทั้งหมด
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl">
        <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          วิธีใช้งาน
        </h3>
        <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
          <li>เข้า <a href="https://affiliate.shopee.co.th/offer/product_offer" target="_blank" className="underline hover:text-blue-600">Shopee Affiliate</a></li>
          <li>เลือกสินค้าหลายรายการ → คลิก "ส่งออกลิงก์"</li>
          <li>ดาวน์โหลดไฟล์ CSV</li>
          <li>อัพโหลดไฟล์ CSV ที่นี่ และคลิก "Import สินค้า"</li>
        </ol>
        <div className="mt-3 p-3 bg-white dark:bg-blue-950/30 rounded border border-blue-300 dark:border-blue-700">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            <strong>📝 หมายเหตุ:</strong> ระบบจะทำงานอัตโนมัติ:
          </p>
          <ul className="text-xs text-blue-700 dark:text-blue-400 mt-1 space-y-0.5 list-disc list-inside ml-2">
            <li>จัดหมวดหมู่สินค้าอัตโนมัติจากชื่อสินค้า</li>
            <li>ดึงรูปภาพสินค้าจริงจาก Shopee</li>
            <li>ใช้ Affiliate Link พร้อมค่าคอมมิชชั่น</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
