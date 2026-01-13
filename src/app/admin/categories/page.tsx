'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  _count: {
    products: number
  }
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCategories(data)
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const url = editingCategory
      ? `/api/categories/${editingCategory.id}`
      : '/api/categories'

    const method = editingCategory ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    if (res.ok) {
      fetchCategories()
      closeModal()
    } else {
      const data = await res.json()
      setError(data.error || 'เกิดข้อผิดพลาด')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?')) return

    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })

    if (res.ok) {
      fetchCategories()
    } else {
      const data = await res.json()
      alert(data.error || 'ลบหมวดหมู่ไม่สำเร็จ')
    }
  }

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setName(category.name)
    } else {
      setEditingCategory(null)
      setName('')
    }
    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setName('')
    setError('')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-black">หมวดหมู่</h1>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          เพิ่มหมวดหมู่
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl p-6 border border-slate-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-black">{category.name}</h3>
                  <p className="text-sm text-slate-500">/{category.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openModal(category)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-black"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-black">{category._count.products}</span> สินค้า
              </p>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-slate-600 bg-white rounded-xl border border-slate-200">
          ยังไม่มีหมวดหมู่ เพิ่มหมวดหมู่แรกของคุณ!
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-black">
                {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-100 text-red-600 text-sm rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1 text-black">ชื่อหมวดหมู่</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-black"
                  placeholder="เช่น อิเล็กทรอนิกส์"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium hover:bg-slate-100 rounded-lg transition-colors text-black"
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn-primary">
                  {editingCategory ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มหมวดหมู่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
