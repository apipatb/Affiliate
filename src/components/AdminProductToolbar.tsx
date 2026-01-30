'use client'

import { useState, useEffect } from 'react'
import { Pencil, Upload, Plus, Video, Image as ImageIcon, X, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ProductMedia {
  id: string
  url: string
  type: 'IMAGE' | 'VIDEO'
  order: number
}

interface AdminProductToolbarProps {
  productId: string
  productTitle: string
  existingMedia?: ProductMedia[]
}

export default function AdminProductToolbar({ productId, productTitle, existingMedia = [] }: AdminProductToolbarProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [mediaGallery, setMediaGallery] = useState<ProductMedia[]>(existingMedia)
  const [uploadError, setUploadError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const data = await res.json()
          setIsAdmin(data.authenticated && data.user?.role === 'ADMIN')
        }
      } catch {
        setIsAdmin(false)
      }
    }
    checkAdmin()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadError('')
    setIsUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || data.error || `Upload failed (${res.status})`)
        }

        const type = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE'

        return {
          id: `temp-${Date.now()}-${Math.random()}`,
          url: data.url,
          type: type as 'IMAGE' | 'VIDEO',
          order: mediaGallery.length,
        }
      })

      const uploadedMedia = await Promise.all(uploadPromises)
      setMediaGallery([...mediaGallery, ...uploadedMedia])
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload file')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const removeMediaItem = (index: number) => {
    setMediaGallery(mediaGallery.filter((_, i) => i !== index))
  }

  const addMediaFromUrl = () => {
    const url = prompt('ใส่ URL ของรูปภาพหรือวิดีโอ:')
    if (!url) return

    try {
      new URL(url)
    } catch {
      alert('URL ไม่ถูกต้อง')
      return
    }

    const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url)
    const type: 'IMAGE' | 'VIDEO' = isVideo ? 'VIDEO' : 'IMAGE'

    setMediaGallery([...mediaGallery, {
      id: `temp-url-${Date.now()}`,
      url,
      type,
      order: mediaGallery.length,
    }])
  }

  const saveMedia = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/products/${productId}/media`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media: mediaGallery.map((item, index) => ({
            url: item.url,
            type: item.type,
            order: index,
          }))
        }),
      })

      if (res.ok) {
        alert('บันทึกสำเร็จ!')
        setShowUploadModal(false)
        // Reload page to show new media
        window.location.reload()
      } else {
        const error = await res.json()
        alert(`เกิดข้อผิดพลาด: ${error.details || error.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      alert(`เกิดข้อผิดพลาดในการบันทึก: ${error.message || 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isAdmin) return null

  return (
    <>
      {/* Floating Admin Toolbar - positioned at left side to avoid overlap */}
      <div className="fixed bottom-6 left-4 z-50 flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-2 shadow-xl border border-slate-700">
          <p className="text-xs text-slate-400 px-2 mb-1">Admin</p>
          <div className="flex flex-col gap-1">
            <Link
              href={`/admin/products?edit=${productId}`}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm"
              title="แก้ไขสินค้า"
            >
              <Pencil className="w-4 h-4" />
              <span className="font-medium">แก้ไข</span>
            </Link>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm"
              title="เพิ่มรูป/วิดีโอ"
            >
              <Upload className="w-4 h-4" />
              <span className="font-medium">เพิ่มสื่อ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-black dark:text-white">
                จัดการรูปภาพ/วิดีโอ - {productTitle}
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Upload Buttons */}
              <div className="flex gap-2">
                <label className={`flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>อัพโหลดไฟล์</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={addMediaFromUrl}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มจาก URL</span>
                </button>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {uploadError}
                </div>
              )}

              {/* Media Gallery */}
              <div className="grid grid-cols-3 gap-3">
                {mediaGallery.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-600 group"
                  >
                    {item.type === 'VIDEO' ? (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <Video className="w-8 h-8 text-white" />
                      </div>
                    ) : (
                      <Image
                        src={item.url}
                        alt={`Media ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => removeMediaItem(index)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
                      {item.type === 'VIDEO' ? (
                        <Video className="w-3 h-3 inline mr-1" />
                      ) : (
                        <ImageIcon className="w-3 h-3 inline mr-1" />
                      )}
                      {index + 1}
                    </div>
                  </div>
                ))}
                {mediaGallery.length === 0 && (
                  <div className="col-span-3 py-8 text-center text-slate-500">
                    ยังไม่มีรูปภาพ/วิดีโอ
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={saveMedia}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
