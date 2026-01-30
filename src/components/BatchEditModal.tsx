'use client'

import { useState } from 'react'
import {
  X,
  Save,
  Clock,
  Hash,
  Type,
  Calendar,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'

interface BatchEditModalProps {
  isOpen: boolean
  onClose: () => void
  selectedJobIds: string[]
  onSuccess: () => void
}

type EditField = 'caption' | 'hashtags' | 'schedule' | 'status'

export default function BatchEditModal({
  isOpen,
  onClose,
  selectedJobIds,
  onSuccess,
}: BatchEditModalProps) {
  const [activeField, setActiveField] = useState<EditField | null>(null)
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [status, setStatus] = useState<'PENDING' | 'DONE' | 'FAILED'>('PENDING')
  const [appendMode, setAppendMode] = useState(true) // For hashtags
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)

  if (!isOpen) return null

  const handleSave = async () => {
    if (!activeField) return

    setLoading(true)
    setResult(null)

    let successCount = 0
    let failCount = 0

    for (const jobId of selectedJobIds) {
      try {
        const updateData: Record<string, any> = {}

        switch (activeField) {
          case 'caption':
            if (caption.trim()) {
              updateData.caption = caption.trim()
            }
            break

          case 'hashtags':
            if (hashtags.trim()) {
              const newTags = hashtags.split(/[,\s#]+/).filter(Boolean).map(t => t.startsWith('#') ? t : `#${t}`)
              if (appendMode) {
                // Fetch current hashtags and append
                const jobRes = await fetch(`/api/tiktok/jobs/${jobId}`)
                if (jobRes.ok) {
                  const job = await jobRes.json()
                  const existing = job.hashtags || []
                  updateData.hashtags = [...existing, ...newTags.filter(t => !existing.includes(t))]
                }
              } else {
                updateData.hashtags = newTags
              }
            }
            break

          case 'schedule':
            if (scheduleDate && scheduleTime) {
              const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`)
              updateData.scheduledAt = scheduledAt.toISOString()
            }
            break

          case 'status':
            updateData.status = status
            if (status === 'PENDING') {
              updateData.error = null
            }
            break
        }

        if (Object.keys(updateData).length > 0) {
          const res = await fetch(`/api/tiktok/jobs/${jobId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          })

          if (res.ok) {
            successCount++
          } else {
            failCount++
          }
        }
      } catch (error) {
        console.error('Update error:', error)
        failCount++
      }
    }

    setResult({ success: successCount, failed: failCount })
    setLoading(false)

    if (successCount > 0) {
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    }
  }

  const fields = [
    { id: 'caption' as EditField, icon: Type, label: 'Caption', color: 'blue' },
    { id: 'hashtags' as EditField, icon: Hash, label: 'Hashtags', color: 'purple' },
    { id: 'schedule' as EditField, icon: Calendar, label: 'Schedule', color: 'green' },
    { id: 'status' as EditField, icon: Clock, label: 'Status', color: 'orange' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-black dark:text-white">Batch Edit</h3>
            <p className="text-sm text-slate-500">แก้ไข {selectedJobIds.length} Jobs พร้อมกัน</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Field Selection */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
            เลือกฟิลด์ที่ต้องการแก้ไข:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {fields.map(field => {
              const Icon = field.icon
              return (
                <button
                  key={field.id}
                  onClick={() => setActiveField(field.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    activeField === field.id
                      ? `border-${field.color}-500 bg-${field.color}-50 dark:bg-${field.color}-900/20`
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${
                    activeField === field.id ? `text-${field.color}-500` : 'text-slate-400'
                  }`} />
                  <span className="text-xs font-medium">{field.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Edit Form */}
        <div className="p-4 min-h-[150px]">
          {!activeField && (
            <div className="flex items-center justify-center h-[120px] text-slate-400">
              <p>เลือกฟิลด์ที่ต้องการแก้ไขด้านบน</p>
            </div>
          )}

          {activeField === 'caption' && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Caption ใหม่:
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="ใส่ caption สำหรับทุก job ที่เลือก..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-black dark:text-white h-24 resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                Caption นี้จะแทนที่ caption เดิมของทุก job
              </p>
            </div>
          )}

          {activeField === 'hashtags' && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Hashtags:
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#tiktok #review #shopping"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-black dark:text-white"
              />
              <div className="flex items-center gap-4 mt-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={appendMode}
                    onChange={() => setAppendMode(true)}
                    className="text-purple-500"
                  />
                  <span>เพิ่มต่อท้าย</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={!appendMode}
                    onChange={() => setAppendMode(false)}
                    className="text-purple-500"
                  />
                  <span>แทนที่ทั้งหมด</span>
                </label>
              </div>
            </div>
          )}

          {activeField === 'schedule' && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                ตั้งเวลาโพสต์:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">วันที่</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-black dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">เวลา</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-black dark:text-white"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                ⚠️ Jobs จะถูกตั้งเวลาเดียวกันทั้งหมด - ควรใช้ "Schedule All" สำหรับการตั้งเวลาอัตโนมัติ
              </p>
            </div>
          )}

          {activeField === 'status' && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                เปลี่ยนสถานะเป็น:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['PENDING', 'DONE', 'FAILED'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      status === s
                        ? s === 'PENDING'
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20'
                          : s === 'DONE'
                          ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20'
                          : 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {status === 'PENDING' && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Error message จะถูกลบเมื่อเปลี่ยนเป็น PENDING
                </p>
              )}
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className={`mx-4 mb-4 p-3 rounded-lg flex items-center gap-2 ${
            result.failed === 0
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}>
            <CheckCircle className="w-5 h-5" />
            <span>
              อัพเดตสำเร็จ {result.success} jobs
              {result.failed > 0 && `, ล้มเหลว ${result.failed}`}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={!activeField || loading}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                บันทึกทั้งหมด
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
