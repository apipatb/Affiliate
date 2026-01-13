'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, FolderOpen, ArrowLeft, LogOut, User, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/admin/products', label: 'สินค้า', icon: Package },
  { href: '/admin/categories', label: 'หมวดหมู่', icon: FolderOpen },
]

interface UserSession {
  email: string
  role: string
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Don't show sidebar on login page
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    // Fetch session info
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated) {
            setUser(data.user)
          }
        }
      } catch (error) {
        console.error('Failed to fetch session:', error)
      }
    }

    if (!isLoginPage) {
      fetchSession()
    }
  }, [isLoginPage])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  // If on login page, just render children without sidebar
  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-slate-200 bg-white p-4 flex flex-col">
        {/* Back to site link */}
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้าเว็บไซต์
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-200 pt-4 mt-4">
          {user && (
            <div className="px-3 py-2 mb-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-black">{user.email}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            {isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8 bg-slate-50">
        {children}
      </main>
    </div>
  )
}
