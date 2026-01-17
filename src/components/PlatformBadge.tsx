'use client'

import { getPlatformConfig, type Platform } from '@/lib/platforms'

interface PlatformBadgeProps {
  platform: Platform | string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export default function PlatformBadge({
  platform,
  size = 'sm',
  showIcon = true,
  className = '',
}: PlatformBadgeProps) {
  const config = getPlatformConfig(platform)

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full ${config.bgColor} ${config.textColor} ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: config.color }}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{size === 'sm' ? config.shortName : config.name}</span>
    </span>
  )
}
