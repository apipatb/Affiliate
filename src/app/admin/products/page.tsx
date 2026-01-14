'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, Star, Search, ChevronLeft, ChevronRight, CheckSquare, Square, Trash } from 'lucide-react'

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

const ITEMS_PER_PAGE = 20

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
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

  // New state for search, pagination, and bulk operations
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    // Filter products based on search term and category
    let filtered = [...products]

    console.log('[Filter] Starting filter...')
    console.log('[Filter] Total products:', products.length)
    console.log('[Filter] Category filter:', categoryFilter)
    console.log('[Filter] Search term:', searchTerm)

    if (categoryFilter !== 'all') {
      console.log('[Filter] Filtering by category:', categoryFilter)
      filtered = filtered.filter((p) => {
        const match = p.categoryId === categoryFilter
        if (match) {
          console.log('[Filter] Match found:', p.title, 'Category ID:', p.categoryId)
        }
        return match
      })
      console.log('[Filter] After category filter:', filtered.length)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      console.log('[Filter] After search filter:', filtered.length)
    }

    console.log('[Filter] Final filtered count:', filtered.length)
    setFilteredProducts(filtered)
    setCurrentPage(1) // Reset to page 1 when filtering
  }, [searchTerm, categoryFilter, products])

  const fetchProducts = async () => {
    const res = await fetch('/api/products?limit=10000') // Get all products for admin
    const data = await res.json()
    setProducts(data.data || data) // Handle both old and new API format
    setFilteredProducts(data.data || data)
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
      // Remove from selected if it was selected
      const newSelected = new Set(selectedProducts)
      newSelected.delete(id)
      setSelectedProducts(newSelected)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      alert('กรุณาเลือกสินค้าที่ต้องการลบ')
      return
    }

    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า ${selectedProducts.size} รายการ?`)) return

    setIsDeleting(true)
    try {
      const res = await fetch('/api/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: Array.from(selectedProducts) }),
      })

      const data = await res.json()

      if (res.ok) {
        alert(data.message)
        fetchProducts()
        setSelectedProducts(new Set())
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error}`)
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบสินค้า')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteAll = async () => {
    if (products.length === 0) {
      alert('ไม่มีสินค้าให้ลบ')
      return
    }

    const confirmed = confirm(
      `⚠️ คำเตือน: คุณกำลังจะลบสินค้าทั้งหมด ${products.length} รายการ\n\nการกระทำนี้ไม่สามารถย้อนกลับได้!\n\nพิมพ์ "DELETE" เพื่อยืนยัน`
    )

    if (!confirmed) return

    // Additional confirmation
    const confirmText = prompt('พิมพ์ "DELETE" เพื่อยืนยันการลบสินค้าทั้งหมด:')
    if (confirmText !== 'DELETE') {
      alert('การลบถูกยกเลิก')
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch('/api/products/delete-all', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        alert(data.message)
        fetchProducts()
        setSelectedProducts(new Set())
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error}`)
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบสินค้า')
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedProducts.size === paginatedProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(paginatedProducts.map((p) => p.id)))
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            จัดการสินค้า
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                ทั้งหมด {products.length} สินค้า
              </span>
            </div>
            {filteredProducts.length !== products.length && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
                <Search className="w-3 h-3 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  กรองแล้ว {filteredProducts.length} รายการ
                </span>
              </div>
            )}
            {selectedProducts.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                <CheckSquare className="w-3 h-3 text-purple-600" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  เลือกอยู่ {selectedProducts.size} รายการ
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
        >
          <Plus className="w-5 h-5" />
          เพิ่มสินค้า
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              ค้นหาสินค้า
            </label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="พิมพ์ชื่อสินค้า, รายละเอียด หรือหมวดหมู่..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-black dark:text-white placeholder:text-slate-400 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              หมวดหมู่
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                console.log('[UI] Category filter changed to:', e.target.value)
                setCategoryFilter(e.target.value)
              }}
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-black dark:text-white transition-all cursor-pointer"
            >
              <option value="all">🔍 ทุกหมวดหมู่</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.size > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                เลือกสินค้า {selectedProducts.size} รายการ
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                พร้อมดำเนินการแบบกลุ่ม
              </p>
            </div>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-medium"
          >
            <Trash2 className="w-5 h-5" />
            {isDeleting ? 'กำลังลบ...' : 'ลบที่เลือก'}
          </button>
        </div>
      )}

      {/* Delete All Button (Only show when no selection) */}
      {selectedProducts.size === 0 && products.length > 0 && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleDeleteAll}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-medium"
          >
            <Trash className="w-4 h-4" />
            {isDeleting ? 'กำลังลบ...' : 'ลบสินค้าทั้งหมด'}
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800">
            <tr>
              <th className="w-12 p-4">
                <button
                  onClick={toggleSelectAll}
                  className="w-5 h-5 flex items-center justify-center hover:scale-110 transition-transform"
                  title={selectedProducts.size === paginatedProducts.length && paginatedProducts.length > 0 ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                >
                  {selectedProducts.size === paginatedProducts.length && paginatedProducts.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </th>
              <th className="text-left p-4 font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wide">สินค้า</th>
              <th className="text-left p-4 font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wide">หมวดหมู่</th>
              <th className="text-left p-4 font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wide">ราคา</th>
              <th className="text-left p-4 font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wide">คลิก</th>
              <th className="text-left p-4 font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wide">ประเภท</th>
              <th className="text-left p-4 font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wide">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {paginatedProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/30 dark:hover:from-slate-700/50 dark:hover:to-blue-900/10 transition-all duration-200 group">
                <td className="p-4">
                  <button
                    onClick={() => toggleSelectProduct(product.id)}
                    className="w-5 h-5 flex items-center justify-center hover:scale-125 transition-transform"
                  >
                    {selectedProducts.has(product.id) ? (
                      <CheckSquare className="w-5 h-5 text-primary animate-in fade-in zoom-in duration-200" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    )}
                  </button>
                </td>
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
        {paginatedProducts.length === 0 && filteredProducts.length === 0 && products.length > 0 && (
          <div className="text-center py-12 text-slate-600">
            ไม่พบสินค้าที่ตรงกับการค้นหา
          </div>
        )}
        {products.length === 0 && (
          <div className="text-center py-12 text-slate-600">
            ยังไม่มีสินค้า เพิ่มสินค้าแรกของคุณ!
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            แสดง {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} จาก {filteredProducts.length} รายการ
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-black"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
              {/* First page */}
              {currentPage > 3 && (
                <>
                  <button
                    onClick={() => goToPage(1)}
                    className="w-10 h-10 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors text-black"
                  >
                    1
                  </button>
                  {currentPage > 4 && (
                    <span className="px-2 text-slate-400">...</span>
                  )}
                </>
              )}

              {/* Pages around current */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  return page === currentPage ||
                         page === currentPage - 1 ||
                         page === currentPage + 1 ||
                         (page === 1 && currentPage <= 3) ||
                         (page === totalPages && currentPage >= totalPages - 2)
                })
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-10 h-10 rounded-lg border transition-colors ${
                      currentPage === page
                        ? 'bg-primary text-white border-primary'
                        : 'border-slate-300 hover:bg-slate-50 text-black'
                    }`}
                  >
                    {page}
                  </button>
                ))}

              {/* Last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="px-2 text-slate-400">...</span>
                  )}
                  <button
                    onClick={() => goToPage(totalPages)}
                    className="w-10 h-10 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors text-black"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-black"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}


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
