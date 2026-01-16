'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, Star, Search, ChevronLeft, ChevronRight, CheckSquare, Square, Trash, Image, Video } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductMedia {
  id: string
  url: string
  type: 'IMAGE' | 'VIDEO'
  order: number
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
  media?: ProductMedia[]
}

const ITEMS_PER_PAGE = 20

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
  const [mediaGallery, setMediaGallery] = useState<ProductMedia[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // New state for search, pagination, and bulk operations
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Fetch products on initial load and when filters/page change
  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [currentPage, categoryFilter, searchTerm])

  const fetchProducts = async () => {
    setIsLoading(true)

    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: ITEMS_PER_PAGE.toString(),
    })

    if (categoryFilter !== 'all') {
      params.append('categoryId', categoryFilter)
    }

    if (searchTerm) {
      params.append('search', searchTerm)
    }

    console.log('[Fetch] Fetching products with params:', params.toString())

    try {
      const res = await fetch(`/api/products?${params.toString()}`)
      const data = await res.json()

      console.log('[Fetch] API Response:', {
        productsCount: data.data?.length || 0,
        pagination: data.pagination
      })

      setProducts(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalProducts(data.pagination?.total || 0)
    } catch (error) {
      console.error('[Fetch] Error fetching products:', error)
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    const data = await res.json()
    console.log('[Categories] Fetched categories:', data)
    setCategories(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = editingProduct
      ? `/api/products/${editingProduct.id}`
      : '/api/products'

    const method = editingProduct ? 'PUT' : 'POST'

    // Prepare data with media gallery
    const submitData = {
      ...formData,
      media: mediaGallery.map((item, index) => ({
        url: item.url,
        type: item.type,
        order: index, // Use array index as order
      })),
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData),
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
    if (totalProducts === 0) {
      alert('ไม่มีสินค้าให้ลบ')
      return
    }

    const confirmed = confirm(
      `⚠️ คำเตือน: คุณกำลังจะลบสินค้าทั้งหมด ${totalProducts} รายการ\n\nการกระทำนี้ไม่สามารถย้อนกลับได้!\n\nพิมพ์ "DELETE" เพื่อยืนยัน`
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
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)))
    }
  }

  const handleFilterChange = (newFilter: string) => {
    console.log('[UI] Category filter changed to:', newFilter)
    setCategoryFilter(newFilter)
    setCurrentPage(1) // Reset to page 1 when changing filter
    setSelectedProducts(new Set()) // Clear selections
  }

  const handleSearchChange = (newSearch: string) => {
    setSearchTerm(newSearch)
    setCurrentPage(1) // Reset to page 1 when searching
    setSelectedProducts(new Set()) // Clear selections
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
      // Load existing media gallery
      setMediaGallery(product.media || [])
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
      setMediaGallery([])
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
    setMediaGallery([])
    setUploadError('')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadError('')
    setIsUploading(true)

    try {
      // Upload all files
      const uploadPromises = Array.from(files).map(async (file) => {
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Upload failed')
        }

        // Determine media type from file type
        const type = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE'

        return {
          id: `temp-${Date.now()}-${Math.random()}`,
          url: data.url,
          type: type as 'IMAGE' | 'VIDEO',
          order: mediaGallery.length,
        }
      })

      const uploadedMedia = await Promise.all(uploadPromises)

      // Add to gallery
      setMediaGallery([...mediaGallery, ...uploadedMedia])

      // Set first image as imageUrl if not set
      if (!formData.imageUrl && uploadedMedia.length > 0) {
        setFormData({ ...formData, imageUrl: uploadedMedia[0].url })
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload file')
    } finally {
      setIsUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const removeMediaItem = (index: number) => {
    const newGallery = mediaGallery.filter((_, i) => i !== index)
    setMediaGallery(newGallery)

    // If removed the primary image, set new primary
    if (mediaGallery[index].url === formData.imageUrl && newGallery.length > 0) {
      setFormData({ ...formData, imageUrl: newGallery[0].url })
    } else if (newGallery.length === 0) {
      setFormData({ ...formData, imageUrl: '' })
    }
  }

  const setPrimaryImage = (index: number) => {
    setFormData({ ...formData, imageUrl: mediaGallery[index].url })
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === index) return

    const newGallery = [...mediaGallery]
    const draggedItem = newGallery[draggedIndex]

    // Remove from old position
    newGallery.splice(draggedIndex, 1)

    // Insert at new position
    newGallery.splice(index, 0, draggedItem)

    setMediaGallery(newGallery)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
    setSelectedProducts(new Set()) // Clear selections when changing page
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
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
            จัดการสินค้า
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-full border border-blue-200 dark:border-blue-700/50">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                {categoryFilter !== 'all' || searchTerm ? `พบ ${totalProducts.toLocaleString('th-TH')} รายการ` : `ทั้งหมด ${totalProducts.toLocaleString('th-TH')} สินค้า`}
              </span>
            </div>
            {(categoryFilter !== 'all' || searchTerm) && (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 rounded-full border border-green-200 dark:border-green-700/50">
                <Search className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                  หน้า {currentPage}/{totalPages}
                </span>
              </div>
            )}
            {selectedProducts.size > 0 && (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 rounded-full border border-purple-200 dark:border-purple-700/50">
                <CheckSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                  เลือกอยู่ {selectedProducts.size} รายการ
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all font-semibold"
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
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              ค้นหาสินค้า
            </label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="พิมพ์ชื่อสินค้า, รายละเอียด หรือหมวดหมู่..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-900 dark:text-white placeholder:text-slate-400 transition-all font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              หมวดหมู่
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-900 dark:text-white transition-all cursor-pointer font-medium"
            >
              <option value="all">ทุกหมวดหมู่</option>
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
      {selectedProducts.size === 0 && totalProducts > 0 && (
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
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 border-b-2 border-slate-200 dark:border-slate-600">
            <tr>
              <th className="w-12 p-4">
                <button
                  onClick={toggleSelectAll}
                  className="w-5 h-5 flex items-center justify-center hover:scale-110 transition-transform"
                  title={selectedProducts.size === products.length && products.length > 0 ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                >
                  {selectedProducts.size === products.length && products.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </th>
              <th className="text-left p-4 font-extrabold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider">สินค้า</th>
              <th className="text-left p-4 font-extrabold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider">หมวดหมู่</th>
              <th className="text-left p-4 font-extrabold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider">ราคา</th>
              <th className="text-left p-4 font-extrabold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider">คลิก</th>
              <th className="text-left p-4 font-extrabold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider">ประเภท</th>
              <th className="text-left p-4 font-extrabold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {products.map((product) => (
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
                  <a
                    href={`/products/${product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 hover:opacity-80 transition-opacity group/link"
                  >
                    {product.mediaType === 'VIDEO' ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex-shrink-0 shadow-md border-2 border-slate-200 dark:border-slate-600 group-hover/link:shadow-lg group-hover/link:border-primary/50 transition-all">
                        <video
                          src={product.imageUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                            <svg className="w-4 h-4 text-primary ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-20 h-20 rounded-xl object-cover bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex-shrink-0 shadow-md border-2 border-slate-200 dark:border-slate-600 group-hover/link:shadow-lg group-hover/link:border-primary/50 transition-all"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 dark:text-white group-hover/link:text-primary transition-colors line-clamp-1 text-base">
                          {product.title}
                        </p>
                        {product.featured && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0 drop-shadow-sm" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 mt-1 font-medium">
                        {product.description}
                      </p>
                    </div>
                  </a>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary border border-primary/30 shadow-sm">
                    {product.category.name}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
                      ฿{product.price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${product.clicks > 10 ? 'bg-green-500 animate-pulse shadow-green-500/50' : product.clicks > 0 ? 'bg-blue-500 shadow-blue-500/50' : 'bg-slate-300'}`}></div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      {product.clicks.toLocaleString('th-TH')}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold shadow-sm ${product.mediaType === 'VIDEO'
                    ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-600'
                    : 'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600'
                    }`}>
                    {product.mediaType === 'VIDEO' ? (
                      <>
                        <Video className="w-3.5 h-3.5" />
                        วิดีโอ
                      </>
                    ) : (
                      <>
                        <Image className="w-3.5 h-3.5" />
                        รูปภาพ
                      </>
                    )}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={product.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110"
                      title="ดูที่ Shopee"
                    >
                      <ExternalLink className="w-4.5 h-4.5" />
                    </a>
                    <button
                      onClick={() => openModal(product)}
                      className="p-2.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:scale-110"
                      title="แก้ไข"
                    >
                      <Pencil className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:scale-110"
                      title="ลบ"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && !isLoading && (categoryFilter !== 'all' || searchTerm) && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-slate-200 dark:border-slate-600">
              <Search className="w-12 h-12 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
              ไม่พบสินค้าที่ตรงกับการค้นหา
            </h3>
            <p className="text-base text-slate-600 dark:text-slate-400 text-center max-w-md font-medium">
              ลองเปลี่ยนคำค้นหาหรือหมวดหมู่ดูนะครับ
            </p>
          </div>
        )}
        {products.length === 0 && !isLoading && totalProducts === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-primary/30">
              <Plus className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
              ยังไม่มีสินค้า
            </h3>
            <p className="text-base text-slate-600 dark:text-slate-400 text-center max-w-md mb-5 font-medium">
              เริ่มต้นเพิ่มสินค้าแรกของคุณตอนนี้เลย!
            </p>
            <button
              onClick={() => openModal()}
              className="btn-primary flex items-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              เพิ่มสินค้าแรก
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
            หน้า {currentPage} จาก {totalPages} • ทั้งหมด {totalProducts.toLocaleString('th-TH')} รายการ
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2.5 rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-700 dark:text-slate-300 disabled:hover:border-slate-300 dark:disabled:hover:border-slate-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* First page */}
              {currentPage > 3 && (
                <>
                  <button
                    onClick={() => goToPage(1)}
                    className="w-10 h-10 rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:border-primary transition-all text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    1
                  </button>
                  {currentPage > 4 && (
                    <span className="px-2 text-slate-400 font-bold">...</span>
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
                    className={`w-10 h-10 rounded-lg border-2 transition-all font-bold ${
                      currentPage === page
                        ? 'bg-gradient-to-br from-primary to-blue-600 text-white border-primary shadow-md shadow-primary/30'
                        : 'border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:border-primary text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}

              {/* Last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="px-2 text-slate-400 font-bold">...</span>
                  )}
                  <button
                    onClick={() => goToPage(totalPages)}
                    className="w-10 h-10 rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:border-primary transition-all text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-700 dark:text-slate-300 disabled:hover:border-slate-300 dark:disabled:hover:border-slate-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}


      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">ชื่อสินค้า</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-900 dark:text-white font-medium transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">รายละเอียด</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-900 dark:text-white font-medium transition-all"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">ราคา (฿)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-900 dark:text-white font-medium transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">หมวดหมู่</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-900 dark:text-white font-medium transition-all"
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
              {/* Media Gallery Upload Section */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                  รูปภาพและวิดีโอสินค้า
                </label>

                {/* Upload Button */}
                <label className={`
                  flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-primary transition-all
                  ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}>
                  <Plus className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isUploading ? 'กำลังอัปโหลด...' : 'เลือกรูปภาพหรือวิดีโอ (หลายไฟล์)'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,video/*"
                    multiple
                    disabled={isUploading}
                  />
                </label>

                {uploadError && (
                  <p className="text-sm text-red-500 dark:text-red-400 font-semibold mt-2">{uploadError}</p>
                )}

                {/* Media Gallery Preview */}
                {mediaGallery.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                      ลากเพื่อจัดเรียงลำดับ • คลิกดาวเพื่อกำหนดเป็นรูปหลัก • คลิก X เพื่อลบ
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                      {mediaGallery.map((media, index) => (
                        <div
                          key={media.id}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`
                            relative aspect-square rounded-lg overflow-hidden border-2 cursor-move group
                            ${media.url === formData.imageUrl
                              ? 'border-primary ring-2 ring-primary/30'
                              : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'}
                            ${draggedIndex === index ? 'opacity-50' : ''}
                            transition-all
                          `}
                        >
                          {/* Media Preview */}
                          {media.type === 'VIDEO' ? (
                            <div className="relative w-full h-full bg-slate-900">
                              <video
                                src={media.url}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Video className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          ) : (
                            <img
                              src={media.url}
                              alt={`Media ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}

                          {/* Overlay Controls */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            {/* Set as Primary Button */}
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(index)}
                              className={`
                                p-2 rounded-full transition-all
                                ${media.url === formData.imageUrl
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-white/90 text-slate-700 hover:bg-yellow-500 hover:text-white'}
                              `}
                              title="กำหนดเป็นรูปหลัก"
                            >
                              <Star className={`w-4 h-4 ${media.url === formData.imageUrl ? 'fill-white' : ''}`} />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => removeMediaItem(index)}
                              className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Primary Badge */}
                          {media.url === formData.imageUrl && (
                            <div className="absolute top-1 left-1 bg-yellow-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                              หลัก
                            </div>
                          )}

                          {/* Order Number */}
                          <div className="absolute top-1 right-1 bg-black/60 text-white px-2 py-0.5 rounded text-xs font-bold">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legacy imageUrl field (hidden, auto-populated) */}
                <input
                  type="hidden"
                  value={formData.imageUrl}
                  required={mediaGallery.length === 0}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">URL แอฟฟิลิเอท</label>
                <input
                  type="url"
                  value={formData.affiliateUrl}
                  onChange={(e) => setFormData({ ...formData, affiliateUrl: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-900 dark:text-white font-medium transition-all"
                  required
                />
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="featured" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  สินค้าแนะนำ
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-600"
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn-primary font-semibold">
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
