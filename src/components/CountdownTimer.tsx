'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  endDate: Date
  compact?: boolean
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function CountdownTimer({ endDate, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const end = new Date(endDate).getTime()
      const difference = end - now

      if (difference <= 0) {
        setIsExpired(true)
        return null
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      }
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  if (isExpired || !timeLeft) {
    return null
  }

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-pulse">
        <Clock className="w-3 h-3" />
        {timeLeft.days > 0 && `${timeLeft.days}วัน `}
        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-red-500 via-pink-500 to-red-600 rounded-xl p-4 text-white shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-5 h-5" />
        <span className="text-sm font-bold">โปรโมชั่นหมดใน</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {timeLeft.days > 0 && (
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
            <div className="text-2xl font-extrabold">{timeLeft.days}</div>
            <div className="text-xs font-semibold opacity-90">วัน</div>
          </div>
        )}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
          <div className="text-2xl font-extrabold">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-xs font-semibold opacity-90">ชม.</div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
          <div className="text-2xl font-extrabold">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-xs font-semibold opacity-90">นาที</div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
          <div className="text-2xl font-extrabold">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-xs font-semibold opacity-90">วิ</div>
        </div>
      </div>
    </div>
  )
}
