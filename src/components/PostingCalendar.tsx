'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Play,
  X,
} from 'lucide-react'

interface TikTokJob {
  id: string
  productName?: string
  productImage?: string
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED'
  scheduledAt?: string
  postedAt?: string
  final_video?: string
  hooking?: string
  caption?: string
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  jobs: TikTokJob[]
}

const DAYS_OF_WEEK = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

const STATUS_COLORS = {
  PENDING: 'bg-yellow-500',
  PROCESSING: 'bg-blue-500',
  DONE: 'bg-green-500',
  FAILED: 'bg-red-500',
}

export default function PostingCalendar() {
  const [jobs, setJobs] = useState<TikTokJob[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedJob, setSelectedJob] = useState<TikTokJob | null>(null)
  const [rescheduleJob, setRescheduleJob] = useState<TikTokJob | null>(null)
  const [newScheduleTime, setNewScheduleTime] = useState('')

  // Fetch jobs with schedules
  const fetchJobs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tiktok/jobs?limit=1000')
      if (res.ok) {
        const data = await res.json()
        // Handle different response formats
        let jobsArray: TikTokJob[] = []
        if (Array.isArray(data)) {
          jobsArray = data
        } else if (data.data?.jobs) {
          jobsArray = data.data.jobs
        } else if (data.jobs) {
          jobsArray = data.jobs
        } else if (data.data && Array.isArray(data.data)) {
          jobsArray = data.data
        }

        // Filter jobs with schedule or posted date
        const scheduledJobs = jobsArray.filter((j: TikTokJob) => j.scheduledAt || j.postedAt)
        setJobs(scheduledJobs)
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days: CalendarDay[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)

      const dateStr = date.toISOString().split('T')[0]
      const dayJobs = jobs.filter(job => {
        const jobDate = job.scheduledAt || job.postedAt
        if (!jobDate) return false
        return new Date(jobDate).toISOString().split('T')[0] === dateStr
      })

      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        jobs: dayJobs,
      })
    }

    return days
  }, [currentDate, jobs])

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Reschedule job
  const handleReschedule = async () => {
    if (!rescheduleJob || !newScheduleTime) return

    try {
      const res = await fetch(`/api/tiktok/jobs/${rescheduleJob.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: new Date(newScheduleTime).toISOString() }),
      })

      if (res.ok) {
        alert('ตั้งเวลาใหม่สำเร็จ!')
        setRescheduleJob(null)
        setNewScheduleTime('')
        fetchJobs()
      } else {
        alert('ไม่สามารถตั้งเวลาใหม่ได้')
      }
    } catch (error) {
      console.error('Reschedule error:', error)
      alert('เกิดข้อผิดพลาด')
    }
  }

  // Stats
  const stats = useMemo(() => {
    const thisMonth = jobs.filter(j => {
      const d = new Date(j.scheduledAt || j.postedAt || '')
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()
    })

    return {
      total: thisMonth.length,
      pending: thisMonth.filter(j => j.status === 'PENDING').length,
      done: thisMonth.filter(j => j.status === 'DONE').length,
      failed: thisMonth.filter(j => j.status === 'FAILED').length,
    }
  }, [jobs, currentDate])

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          <span className="ml-3 text-slate-500">กำลังโหลด Calendar...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-black dark:text-white">Posting Calendar</h2>
              <p className="text-xs text-slate-500">ปฏิทินการโพสต์ TikTok</p>
            </div>
          </div>
          <button
            onClick={fetchJobs}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-black dark:text-white min-w-[180px] text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600"
            >
              วันนี้
            </button>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                รอโพสต์ {stats.pending}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                โพสต์แล้ว {stats.done}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                ล้มเหลว {stats.failed}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_OF_WEEK.map((day, i) => (
            <div
              key={day}
              className={`text-center text-xs font-medium py-2 ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`min-h-[100px] p-1 rounded-lg border transition-colors ${
                day.isToday
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                  : day.isCurrentMonth
                  ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  : 'border-transparent bg-slate-50 dark:bg-slate-900/50'
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${
                !day.isCurrentMonth ? 'text-slate-300 dark:text-slate-600' :
                day.isToday ? 'text-pink-500' :
                day.date.getDay() === 0 ? 'text-red-500' :
                day.date.getDay() === 6 ? 'text-blue-500' :
                'text-slate-700 dark:text-slate-300'
              }`}>
                {day.date.getDate()}
              </div>

              {/* Jobs */}
              <div className="space-y-1">
                {day.jobs.slice(0, 3).map(job => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-transform hover:scale-105 ${
                      job.status === 'DONE'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : job.status === 'FAILED'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : job.status === 'PROCESSING'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {job.status === 'DONE' ? <CheckCircle className="w-2.5 h-2.5" /> :
                       job.status === 'FAILED' ? <XCircle className="w-2.5 h-2.5" /> :
                       <Clock className="w-2.5 h-2.5" />}
                      {new Date(job.scheduledAt || job.postedAt || '').toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="block truncate">{job.productName || 'Untitled'}</span>
                  </button>
                ))}
                {day.jobs.length > 3 && (
                  <div className="text-[10px] text-slate-400 text-center">
                    +{day.jobs.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-black dark:text-white">รายละเอียด Job</h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Product Info */}
              <div className="flex items-center gap-3">
                {selectedJob.productImage && (
                  <Image
                    src={selectedJob.productImage}
                    alt=""
                    width={60}
                    height={60}
                    className="rounded-lg object-cover"
                  />
                )}
                <div>
                  <h4 className="font-medium text-black dark:text-white">
                    {selectedJob.productName || 'Untitled'}
                  </h4>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedJob.status === 'DONE'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : selectedJob.status === 'FAILED'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {selectedJob.status}
                  </span>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">ตั้งเวลาโพสต์:</span>
                  <span className="font-medium text-black dark:text-white">
                    {selectedJob.scheduledAt
                      ? new Date(selectedJob.scheduledAt).toLocaleString('th-TH')
                      : '-'}
                  </span>
                </div>
                {selectedJob.postedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">โพสต์เมื่อ:</span>
                    <span className="font-medium text-green-600">
                      {new Date(selectedJob.postedAt).toLocaleString('th-TH')}
                    </span>
                  </div>
                )}
              </div>

              {/* Hook Preview */}
              {selectedJob.hooking && (
                <div>
                  <label className="text-xs text-slate-500">Hook:</label>
                  <p className="text-sm text-black dark:text-white line-clamp-2">
                    {selectedJob.hooking}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {selectedJob.final_video && (
                  <a
                    href={selectedJob.final_video}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  >
                    <Eye className="w-4 h-4" />
                    ดูวิดีโอ
                  </a>
                )}
                {selectedJob.status === 'PENDING' && (
                  <button
                    onClick={() => {
                      setRescheduleJob(selectedJob)
                      setSelectedJob(null)
                      if (selectedJob.scheduledAt) {
                        const d = new Date(selectedJob.scheduledAt)
                        setNewScheduleTime(d.toISOString().slice(0, 16))
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                    เปลี่ยนเวลา
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full shadow-2xl">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-black dark:text-white">เปลี่ยนเวลาโพสต์</h3>
              <button
                onClick={() => setRescheduleJob(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  เวลาโพสต์ใหม่:
                </label>
                <input
                  type="datetime-local"
                  value={newScheduleTime}
                  onChange={(e) => setNewScheduleTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-black dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setRescheduleJob(null)}
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleReschedule}
                  className="flex-1 px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
