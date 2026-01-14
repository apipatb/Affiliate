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
      const res = await fetch('/api/shopee/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, categoryId, featured }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: `สินค้า "${data.product.title}" ถูก import สำเร็จ!` })
        setUrl('')
        setCategoryId('')
        setFeatured(false)

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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-slate-200">
              Shopee URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://shopee.co.th/product-name-i.123456.789012"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ตัวอย่าง: https://shopee.co.th/product-name-i.123456.789012
            </p>
          </div>

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

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl">
        <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">💡 วิธีใช้งาน</h3>
        <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
          <li>เปิดสินค้าจาก Shopee ที่ต้องการ import</li>
          <li>คัดลอก URL จากแถบที่อยู่ของเบราว์เซอร์</li>
          <li>วาง URL ลงในช่องด้านบน</li>
          <li>เลือกหมวดหมู่ที่เหมาะสม</li>
          <li>คลิก "Import สินค้า" เพื่อดึงข้อมูลและบันทึกลงระบบ</li>
        </ol>
      </div>
    </div>
  )
}
