'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, Star } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  title: string
  description: string
  price: number
  affiliateUrl: string
  imageUrl: string
  mediaType: 'IMAGE' | 'VIDEO'
  categoryId: string
  category: Category
  clicks: number
  featured: boolean
  createdAt: string
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    affiliateUrl: '',
    imageUrl: '',
    mediaType: 'IMAGE' as 'IMAGE' | 'VIDEO',
    categoryId: '',
    featured: false,
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    const res = await fetch('/api/products?limit=1000') // Get all products for admin
    const data = await res.json()
    setProducts(data.data || data) // Handle both old and new API format
    setIsLoading(false)
  }

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCategories(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = editingProduct
      ? `/api/products/${editingProduct.id}`
      : '/api/products'

    const method = editingProduct ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (res.ok) {
      fetchProducts()
      closeModal()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?')) return

    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchProducts()
    }
  }

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        title: product.title,
        description: product.description,
        price: product.price.toString(),
        affiliateUrl: product.affiliateUrl,
        imageUrl: product.imageUrl,
        mediaType: product.mediaType,
        categoryId: product.categoryId,
        featured: product.featured,
      })
    } else {
      setEditingProduct(null)
      setFormData({
        title: '',
        description: '',
        price: '',
        affiliateUrl: '',
        imageUrl: '',
        mediaType: 'IMAGE',
        categoryId: categories[0]?.id || '',
        featured: false,
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setFormData({
      title: '',
      description: '',
      price: '',
      affiliateUrl: '',
      imageUrl: '',
      mediaType: 'IMAGE',
      categoryId: '',
      featured: false,
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')
    setIsUploading(true)

    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setFormData({ ...formData, imageUrl: data.url })
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload file')
    } finally {
      setIsUploading(false)
    }
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
        <h1 className="text-3xl font-bold text-black">สินค้า</h1>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          เพิ่มสินค้า
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-4 font-semibold text-sm text-black">สินค้า</th>
              <th className="text-left p-4 font-semibold text-sm text-black">หมวดหมู่</th>
              <th className="text-left p-4 font-semibold text-sm text-black">ราคา</th>
              <th className="text-left p-4 font-semibold text-sm text-black">คลิก</th>
              <th className="text-left p-4 font-semibold text-sm text-black">ประเภท</th>
              <th className="text-left p-4 font-semibold text-sm text-black">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {product.mediaType === 'VIDEO' ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100">
                        <video
                          src={product.imageUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-black">{product.title}</p>
                        {product.featured && (
                          <Star className="w-4 h-4 text-accent fill-accent" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-1">
                        {product.description}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {product.category.name}
                  </span>
                </td>
                <td className="p-4 font-medium text-black">฿{product.price.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.mediaType === 'VIDEO'
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-blue-100 text-blue-600'
                    }`}>
                    {product.mediaType === 'VIDEO' ? 'วิดีโอ' : 'รูปภาพ'}
                  </span>
                </td>
                <td className="p-4 text-black">{product.clicks}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <a
                      href={product.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-black"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => openModal(product)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-black"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12 text-slate-600">
            ยังไม่มีสินค้า เพิ่มสินค้าแรกของคุณ!
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-black">
                {editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-black">ชื่อสินค้า</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-black">รายละเอียด</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-black"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-black">ราคา (฿)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-black">หมวดหมู่</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-black"
                    required
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-black">ประเภทสื่อ</label>
                  <select
                    value={formData.mediaType}
                    onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as 'IMAGE' | 'VIDEO' })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-black"
                    required
                  >
                    <option value="IMAGE">รูปภาพ</option>
                    <option value="VIDEO">วิดีโอ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-black">
                    {formData.mediaType === 'VIDEO' ? 'วิดีโอ' : 'รูปภาพ'} URL หรือ อัปโหลด
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/media.mp4"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-black"
                      required
                    />
                    <div className="flex items-center gap-2">
                      <label className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors text-sm font-medium text-black
                        ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}>
                        <Plus className="w-4 h-4" />
                        {isUploading ? 'กำลังอัปโหลด...' : 'เลือกไฟล์เพื่ออัปโหลด'}
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          accept={formData.mediaType === 'VIDEO' ? 'video/*,video/mp4,video/x-m4v,video/quicktime,video/x-msvideo,video/x-ms-wmv,video/webm,video/ogg,.mkv,.mov,.avi,.wmv,.flv,.webm,.mp4' : 'image/*'}
                          disabled={isUploading}
                        />
                      </label>
                      {formData.imageUrl && (
                        <span className="text-xs text-green-600 font-medium">อัปโหลดเรียบร้อยแล้ว</span>
                      )}
                    </div>
                    {uploadError && (
                      <p className="text-xs text-red-500 font-medium">{uploadError}</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-black">URL แอฟฟิลิเอท</label>
                <input
                  type="url"
                  value={formData.affiliateUrl}
                  onChange={(e) => setFormData({ ...formData, affiliateUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-black"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <label htmlFor="featured" className="text-sm font-medium text-black">
                  สินค้าแนะนำ
                </label>
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
                  {editingProduct ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มสินค้า'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
