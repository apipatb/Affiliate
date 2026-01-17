'use client'

import { useState, useEffect } from 'react'
import { Link2, RefreshCw, LogIn, LogOut, CheckCircle, XCircle, AlertCircle, Loader2, ImageIcon } from 'lucide-react'

interface SessionStatus {
  supported: boolean
  loggedIn: boolean
  username?: string
  error?: string
}

interface ImageUpdateStatus {
  count: number
  products: Array<{ id: string; title: string }>
}

export default function ShopeeConnectPage() {
  const [status, setStatus] = useState<SessionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  // Image update states
  const [imageStatus, setImageStatus] = useState<ImageUpdateStatus | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateProgress, setUpdateProgress] = useState<string | null>(null)

  const checkSession = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/shopee/session')
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      setStatus({ supported: false, loggedIn: false, error: 'Failed to check session' })
    } finally {
      setLoading(false)
    }
  }

  const checkImageStatus = async () => {
    setImageLoading(true)
    try {
      const res = await fetch('/api/shopee/update-images')
      const data = await res.json()
      setImageStatus(data)
    } catch {
      setImageStatus(null)
    } finally {
      setImageLoading(false)
    }
  }

  const handleUpdateImages = async () => {
    setUpdateLoading(true)
    setUpdateProgress('กำลังดึงรูปจาก Shopee...')
    setMessage(null)

    try {
      const res = await fetch('/api/shopee/update-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 }), // Update 5 at a time
      })
      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        // Refresh count
        await checkImageStatus()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update images' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update images' })
    } finally {
      setUpdateLoading(false)
      setUpdateProgress(null)
    }
  }

  useEffect(() => {
    checkSession()
    checkImageStatus()
  }, [])

  const handleLogin = async () => {
    setActionLoading(true)
    setMessage({ type: 'info', text: 'กำลังเปิด browser... กรุณา login ที่หน้าต่าง browser ที่เปิดขึ้นมา' })

    try {
      const res = await fetch('/api/shopee/session', { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        await checkSession()
      } else {
        setMessage({ type: 'error', text: data.message || 'Login failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleLogout = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/shopee/session', { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'ออกจากระบบ Shopee สำเร็จ' })
        await checkSession()
      } else {
        setMessage({ type: 'error', text: data.message || 'Logout failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to logout' })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
          <Link2 className="w-8 h-8 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">เชื่อมต่อ Shopee Affiliate</h1>
          <p className="text-slate-600 dark:text-slate-400">จัดการ session สำหรับดึงรูปภาพสินค้า</p>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">สถานะการเชื่อมต่อ</h2>
          <button
            onClick={checkSession}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-50"
            title="Refresh status"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>กำลังตรวจสอบ...</span>
          </div>
        ) : status ? (
          <div className="space-y-4">
            {/* Support Status */}
            {!status.supported ? (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">ไม่รองรับบน Vercel</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    ฟีเจอร์นี้ใช้ได้เฉพาะเมื่อรัน local server เท่านั้น เนื่องจาก Playwright ไม่รองรับบน serverless
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Login Status */}
                <div className={`flex items-center gap-3 p-4 rounded-lg ${
                  status.loggedIn
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-slate-100 dark:bg-slate-700/50'
                }`}>
                  {status.loggedIn ? (
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      status.loggedIn
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      {status.loggedIn ? 'เชื่อมต่อแล้ว' : 'ยังไม่ได้เชื่อมต่อ'}
                    </p>
                    {status.username && (
                      <p className="text-sm text-green-700 dark:text-green-300">
                        บัญชี: {status.username}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {!status.loggedIn ? (
                    <button
                      onClick={handleLogin}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <LogIn className="w-5 h-5" />
                      )}
                      เชื่อมต่อ Shopee Affiliate
                    </button>
                  ) : (
                    <button
                      onClick={handleLogout}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <LogOut className="w-5 h-5" />
                      )}
                      ยกเลิกการเชื่อมต่อ
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-slate-500">ไม่สามารถตรวจสอบสถานะได้</p>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
            : message.type === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
        }`}>
          <p>{message.text}</p>
        </div>
      )}

      {/* Update Images Card */}
      {status?.loggedIn && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">อัพเดทรูปสินค้า</h2>
            </div>
            <button
              onClick={checkImageStatus}
              disabled={imageLoading}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${imageLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {imageLoading ? (
            <div className="flex items-center gap-3 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังตรวจสอบ...</span>
            </div>
          ) : imageStatus ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <p className="text-slate-700 dark:text-slate-300">
                  พบสินค้าที่ใช้รูป placeholder: <span className="font-bold text-blue-600 dark:text-blue-400">{imageStatus.count}</span> รายการ
                </p>
                {imageStatus.count > 0 && imageStatus.products.length > 0 && (
                  <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    <p>ตัวอย่าง:</p>
                    <ul className="list-disc list-inside mt-1">
                      {imageStatus.products.slice(0, 3).map((p) => (
                        <li key={p.id} className="truncate">{p.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {imageStatus.count > 0 && (
                <button
                  onClick={handleUpdateImages}
                  disabled={updateLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {updateProgress || 'กำลังอัพเดท...'}
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5" />
                      ดึงรูปจาก Shopee (5 รายการ)
                    </>
                  )}
                </button>
              )}

              {imageStatus.count === 0 && (
                <p className="text-green-600 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  สินค้าทั้งหมดมีรูปแล้ว
                </p>
              )}
            </div>
          ) : (
            <p className="text-slate-500">ไม่สามารถตรวจสอบได้</p>
          )}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">วิธีใช้งาน</h3>
        <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex gap-2">
            <span className="font-medium text-orange-600 dark:text-orange-400">1.</span>
            กดปุ่ม "เชื่อมต่อ Shopee Affiliate" - browser จะเปิดขึ้นมาอัตโนมัติ
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-orange-600 dark:text-orange-400">2.</span>
            Login เข้าบัญชี Shopee Affiliate ของคุณที่หน้าต่าง browser
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-orange-600 dark:text-orange-400">3.</span>
            เมื่อ login สำเร็จ (ระบบจะ redirect ไปหน้า dashboard) session จะถูกบันทึกอัตโนมัติ
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-orange-600 dark:text-orange-400">4.</span>
            ใช้งาน Import CSV หรือ ดึงรูป Shopee ได้เลย โดย session จะถูกใช้ซ้ำอัตโนมัติ
          </li>
        </ol>

        <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>หมายเหตุ:</strong> Session จะถูกเก็บไว้ในโฟลเดอร์ <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">.playwright-session</code>
            และจะคงอยู่จนกว่าจะกดยกเลิกการเชื่อมต่อ หรือ session หมดอายุจากฝั่ง Shopee
          </p>
        </div>
      </div>
    </div>
  )
}
