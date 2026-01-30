'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Link2,
  Link2Off,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Calendar,
  AlertCircle,
  TrendingUp,
  Loader2
} from 'lucide-react'

interface TikTokAccount {
  id: string
  tiktokUserId: string
  tiktokUsername: string | null
  displayName: string | null
  avatarUrl: string | null
  isActive: boolean
  dailyPostCount: number
  dailyPostResetAt: string | null
  lastPostAt: string | null
  tokenExpiresAt: string
  canPost: boolean
  remainingPosts: number
  jobCount: number
}

interface SchedulerStats {
  pendingJobs: number
  processingJobs: number
  todayPosted: number
  failedJobs: number
  upcomingJobs: { id: string; scheduledAt: string; productName: string }[]
}

export default function TikTokAccountManager() {
  const [accounts, setAccounts] = useState<TikTokAccount[]>([])
  const [stats, setStats] = useState<SchedulerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [triggeringScheduler, setTriggeringScheduler] = useState(false)

  useEffect(() => {
    fetchAccounts()
    fetchSchedulerStats()

    // Check for connection result from URL params
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'true') {
      alert('TikTok account connected successfully!')
      // Clean URL
      window.history.replaceState({}, '', '/admin/tiktok')
      fetchAccounts()
    } else if (params.get('error')) {
      alert(`Connection error: ${params.get('error')}`)
      window.history.replaceState({}, '', '/admin/tiktok')
    }
  }, [])

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/tiktok/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts)
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSchedulerStats = async () => {
    try {
      const res = await fetch('/api/tiktok/scheduler')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch scheduler stats:', error)
    }
  }

  const handleConnect = () => {
    setConnecting(true)
    // Redirect to OAuth authorization
    window.location.href = '/api/tiktok/oauth/authorize'
  }

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this TikTok account?')) return

    try {
      const res = await fetch(`/api/tiktok/accounts?accountId=${accountId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setAccounts(accounts.filter(a => a.id !== accountId))
      } else {
        const data = await res.json()
        alert(`Failed to disconnect: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  const handleToggleActive = async (accountId: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/tiktok/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, isActive: !isActive })
      })
      if (res.ok) {
        setAccounts(accounts.map(a =>
          a.id === accountId ? { ...a, isActive: !isActive } : a
        ))
      }
    } catch (error) {
      console.error('Failed to toggle account:', error)
    }
  }

  const handleTriggerScheduler = async () => {
    if (!confirm('Run the scheduler now? This will post any due scheduled jobs.')) return

    setTriggeringScheduler(true)
    try {
      const res = await fetch('/api/cron/tiktok-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const data = await res.json()

      if (data.success) {
        alert(`Scheduler completed: ${data.successCount} succeeded, ${data.failedCount} failed, ${data.skippedCount} skipped`)
        fetchSchedulerStats()
      } else {
        alert(`Scheduler error: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to trigger scheduler:', error)
      alert('Failed to trigger scheduler')
    } finally {
      setTriggeringScheduler(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      {/* Connected Accounts Section */}
      <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl p-4 border border-pink-200 dark:border-pink-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-pink-500" />
            <span className="font-semibold text-black dark:text-white">TikTok Accounts</span>
            <span className="text-sm text-slate-500">({accounts.length} connected)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAccounts}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
            >
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Connect TikTok
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No TikTok accounts connected</p>
            <p className="text-sm">Connect an account to enable auto-posting</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {accounts.map(account => (
              <div
                key={account.id}
                className={`flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border ${
                  account.isActive
                    ? 'border-green-200 dark:border-green-800'
                    : 'border-slate-200 dark:border-slate-700 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  {account.avatarUrl ? (
                    <img
                      src={account.avatarUrl}
                      alt={account.displayName || ''}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                      <User className="w-5 h-5 text-pink-500" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-black dark:text-white">
                        {account.displayName || account.tiktokUsername || 'TikTok User'}
                      </span>
                      {account.isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    {account.tiktokUsername && (
                      <span className="text-sm text-slate-500">@{account.tiktokUsername}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Daily Post Counter */}
                  <div className="text-center">
                    <div className="text-lg font-bold text-black dark:text-white">
                      {account.remainingPosts}
                    </div>
                    <div className="text-xs text-slate-500">posts left today</div>
                  </div>

                  {/* Jobs Count */}
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {account.jobCount}
                    </div>
                    <div className="text-xs text-slate-500">total jobs</div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(account.id, account.isActive)}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        account.isActive
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {account.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDisconnect(account.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                      title="Disconnect"
                    >
                      <Link2Off className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduler Stats */}
      {stats && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-black dark:text-white">Scheduler Status</span>
            </div>
            <button
              onClick={handleTriggerScheduler}
              disabled={triggeringScheduler}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {triggeringScheduler ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Run Now
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingJobs}</div>
              <div className="text-xs text-slate-500">Pending</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Loader2 className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{stats.processingJobs}</div>
              <div className="text-xs text-slate-500">Processing</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{stats.todayPosted}</div>
              <div className="text-xs text-slate-500">Posted Today</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-5 h-5 mx-auto mb-1 text-red-600" />
              <div className="text-2xl font-bold text-red-600">{stats.failedJobs}</div>
              <div className="text-xs text-slate-500">Failed</div>
            </div>
          </div>

          {/* Upcoming Jobs */}
          {stats.upcomingJobs.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Upcoming Posts
              </h4>
              <div className="space-y-2">
                {stats.upcomingJobs.map(job => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm"
                  >
                    <span className="text-black dark:text-white truncate flex-1">
                      {job.productName || job.id}
                    </span>
                    <span className="text-slate-500 ml-2">
                      {formatDate(job.scheduledAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <p className="text-xs text-slate-500">
              <span className="font-medium">Cron Schedule:</span> Every 5 minutes
              <br />
              <span className="font-medium">Max Retries:</span> 3 attempts with exponential backoff
              <br />
              <span className="font-medium">Daily Limit:</span> ~15 posts per account
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
