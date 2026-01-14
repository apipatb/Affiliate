'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  slug: string
}

export default function ImportPage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [featured, setFeatured] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Manual input fields
  const [manualMode, setManualMode] = useState(false)
  const [manualData, setManualData] = useState({
    title: '',
    description: '',
    price: '',
    imageUrl: '',
    commissionRate: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      let endpoint = '/api/shopee/import'
      let body: any = { url, categoryId, featured }

      // If manual mode, use direct product creation
      if (manualMode) {
        endpoint = '/api/products'
        body = {
          title: manualData.title,
          description: manualData.description,
          price: parseFloat(manualData.price),
          affiliateUrl: url,
          imageUrl: manualData.imageUrl,
          categoryId,
          featured,
        }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        const productTitle = manualMode ? manualData.title : data.product.title
        setMessage({ type: 'success', text: `สินค้า "${productTitle}" ถูก import สำเร็จ!` })
        setUrl('')
        setCategoryId('')
        setFeatured(false)
        setManualData({
          title: '',
          description: '',
          price: '',
          imageUrl: '',
          commissionRate: '',
        })

        // Redirect to products page after 2 seconds
        setTimeout(() => router.push('/admin/products'), 2000)
      } else {
        setMessage({ type: 'error', text: data.error || 'เกิดข้อผิดพลาดในการ import สินค้า' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-slate-100">Import สินค้าจาก Shopee</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          วาง URL สินค้าจาก Shopee เพื่อ import ข้อมูลเข้าสู่ระบบอัตโนมัติ
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 max-w-2xl">
        {/* Mode Toggle */}
        <div className="mb-6 flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <button
            type="button"
            onClick={() => setManualMode(false)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !manualMode
                ? 'bg-white dark:bg-slate-800 text-black dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            อัตโนมัติ (ดึงจาก Shopee)
          </button>
          <button
            type="button"
            onClick={() => setManualMode(true)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              manualMode
                ? 'bg-white dark:bg-slate-800 text-black dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            กรอกข้อมูลเอง (Affiliate Link)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-slate-200">
              {manualMode ? 'Shopee Affiliate Link' : 'Shopee URL'} <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={manualMode ? "https://shope.ee/xxxxx (จากหน้า Shopee Affiliate)" : "https://shopee.co.th/product-name-i.123456.789012"}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {manualMode
                ? 'วาง Affiliate Link ที่คัดลอกจากหน้า Shopee Affiliate (https://affiliate.shopee.co.th)'
                : 'ตัวอย่าง: https://shopee.co.th/product-name-i.123456.789012'
              }
            </p>
          </div>

          {/* Manual Mode Fields */}
          {manualMode && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2 text-black dark:text-slate-200">
                  ชื่อสินค้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualData.title}
                  onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
                  placeholder="ชื่อสินค้า"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black dark:text-slate-200">
                  คำอธิบาย <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={manualData.description}
                  onChange={(e) => setManualData({ ...manualData, description: e.target.value })}
                  placeholder="คำอธิบายสินค้า"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black dark:text-slate-200">
                  ราคา (บาท) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={manualData.price}
                  onChange={(e) => setManualData({ ...manualData, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black dark:text-slate-200">
                  URL รูปภาพ <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={manualData.imageUrl}
                  onChange={(e) => setManualData({ ...manualData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black dark:text-slate-200">
                  อัตราคอมมิชชั่น (%) <span className="text-slate-400">(ไม่บังคับ)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={manualData.commissionRate}
                  onChange={(e) => setManualData({ ...manualData, commissionRate: e.target.value })}
                  placeholder="เช่น 5.5"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ดูจากหน้า Shopee Affiliate (สำหรับบันทึกไว้อ้างอิง)
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-slate-200">
              หมวดหมู่ <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
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
              ตั้งเป็นสินค้าแนะนำ
            </label>
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'กำลัง Import...' : 'Import สินค้า'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-black dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 space-y-4 max-w-2xl">
        {/* Auto Mode Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">💡 โหมดอัตโนมัติ (ดึงจาก Shopee)</h3>
          <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
            <li>เปิดสินค้าจาก Shopee ที่ต้องการ import</li>
            <li>คัดลอก URL จากแถบที่อยู่ของเบราว์เซอร์</li>
            <li>วาง URL ลงในช่องด้านบน</li>
            <li>เลือกหมวดหมู่</li>
            <li>คลิก "Import สินค้า" - ระบบจะดึงข้อมูลอัตโนมัติ</li>
          </ol>
        </div>

        {/* Manual Mode Instructions */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="font-medium text-green-900 dark:text-green-300 mb-2">✨ โหมดกรอกข้อมูลเอง (Affiliate Link)</h3>
          <p className="text-sm text-green-800 dark:text-green-400 mb-2">
            <strong>ใช้เมื่อ:</strong> ต้องการใช้ Affiliate Link จาก Shopee Affiliate Dashboard
          </p>
          <ol className="text-sm text-green-800 dark:text-green-400 space-y-1 list-decimal list-inside">
            <li>เข้า <a href="https://affiliate.shopee.co.th/offer/product_offer" target="_blank" className="underline hover:text-green-600">Shopee Affiliate</a> และค้นหาสินค้า</li>
            <li>คลิก "รับลิงก์" หรือ "สร้างลิงก์" และคัดลอก Affiliate Link</li>
            <li>เปลี่ยนเป็นโหมด "กรอกข้อมูลเอง"</li>
            <li>วาง Affiliate Link และกรอกข้อมูลสินค้า (ชื่อ, ราคา, รูปภาพ)</li>
            <li>สามารถบันทึกอัตราคอมมิชชั่นไว้อ้างอิงได้ (ไม่บังคับ)</li>
          </ol>
          <div className="mt-3 p-3 bg-white dark:bg-green-950/30 rounded border border-green-300 dark:border-green-700">
            <p className="text-xs text-green-700 dark:text-green-400">
              <strong>💰 ข้อดี:</strong> ใช้ Affiliate Link ที่ได้รับคอมมิชชั่นโดยตรง ไม่ต้องรอ Shopee API
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
