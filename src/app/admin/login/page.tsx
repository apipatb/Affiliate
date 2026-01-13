'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ')
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts)
        }
        return
      }

      // Successful login - redirect to admin dashboard
      router.push('/admin')
      router.refresh()
    } catch {
      setError('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Back to site */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไปหน้าเว็บไซต์
        </Link>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-black">เข้าสู่ระบบผู้ดูแล</h1>
            <p className="text-sm text-slate-600 mt-2">
              ลงชื่อเข้าใช้เพื่อเข้าถึงแผงควบคุม
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-600">{error}</p>
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    เหลือ {remainingAttempts} ครั้ง
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-black">
                อีเมล
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow text-black"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-black">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านของคุณ"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow text-black"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </form>

        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-600 mt-6">
          พื้นที่หวงห้าม ห้ามเข้าโดยไม่ได้รับอนุญาต
        </p>
      </div>
    </div>
  )
}
