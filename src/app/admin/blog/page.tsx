'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, Star, Search } from 'lucide-react'
import Link from 'next/link'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  published: boolean
  featured: boolean
  views: number
  createdAt: string
  publishedAt: string | null
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    published: false,
    featured: false,
    tags: '',
    metaTitle: '',
    metaDesc: '',
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const res = await fetch('/api/blog')
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const body = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      }

      const url = editingPost ? `/api/blog/${editingPost.slug}` : '/api/blog'
      const method = editingPost ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setShowModal(false)
        setEditingPost(null)
        resetForm()
        fetchPosts()
      }
    } catch (error) {
      console.error('Failed to save post:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm('ต้องการลบบทความนี้?')) return

    try {
      const res = await fetch(`/api/blog/${slug}`, { method: 'DELETE' })
      if (res.ok) {
        fetchPosts()
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  async function togglePublish(post: BlogPost) {
    try {
      const res = await fetch(`/api/blog/${post.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...post, published: !post.published }),
      })
      if (res.ok) {
        fetchPosts()
      }
    } catch (error) {
      console.error('Failed to toggle publish:', error)
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      coverImage: '',
      published: false,
      featured: false,
      tags: '',
      metaTitle: '',
      metaDesc: '',
    })
  }

  function openEditModal(post: BlogPost) {
    setEditingPost(post)
    // Fetch full post data
    fetch(`/api/blog/${post.slug}`)
      .then(res => res.json())
      .then(data => {
        setFormData({
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          coverImage: data.coverImage || '',
          published: data.published,
          featured: data.featured,
          tags: (data.tags || []).join(', '),
          metaTitle: data.metaTitle || '',
          metaDesc: data.metaDesc || '',
        })
        setShowModal(true)
      })
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">จัดการบทความ</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            สร้างและจัดการบทความสำหรับ SEO
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingPost(null)
            setShowModal(true)
          }}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          เขียนบทความ
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="ค้นหาบทความ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-black dark:text-white"
        />
      </div>

      {/* Posts Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">
            กำลังโหลด...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">
            ยังไม่มีบทความ
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">
                  บทความ
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
                  สถานะ
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
                  Views
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
                  วันที่
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600 dark:text-slate-300">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {post.featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                      <div>
                        <p className="font-medium text-black dark:text-white">{post.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => togglePublish(post)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        post.published
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {post.published ? 'เผยแพร่' : 'แบบร่าง'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                    {post.views}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                    {new Date(post.createdAt).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="p-2 text-slate-500 hover:text-primary transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => openEditModal(post)}
                        className="p-2 text-slate-500 hover:text-primary transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.slug)}
                        className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-black dark:text-white">
                {editingPost ? 'แก้ไขบทความ' : 'เขียนบทความใหม่'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                  หัวข้อ *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                  คำอธิบายย่อ (Excerpt) *
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                  เนื้อหา (HTML) *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-white font-mono text-sm"
                  placeholder="<p>เนื้อหาบทความ...</p>"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                    URL รูปปก
                  </label>
                  <input
                    type="url"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                    Tags (คั่นด้วย ,)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="รีวิวสินค้า, Top 10, เคล็ดลับ"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                    Meta Title (SEO)
                  </label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                    Meta Description (SEO)
                  </label>
                  <input
                    type="text"
                    value={formData.metaDesc}
                    onChange={(e) => setFormData({ ...formData, metaDesc: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-black dark:text-white">เผยแพร่</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-black dark:text-white">บทความแนะนำ</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
