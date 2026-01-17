'use client'

import { useEffect } from 'react'

interface AdBannerProps {
  slot: string
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal'
  style?: React.CSSProperties
  className?: string
}

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export default function AdBanner({
  slot,
  format = 'auto',
  style,
  className = ''
}: AdBannerProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({})
      }
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [])

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

  // Don't render if no client ID configured
  if (!clientId) {
    return (
      <div className={`bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-center text-slate-500 dark:text-slate-400 text-sm ${className}`}>
        <p>Ad Space</p>
        <p className="text-xs">(Configure NEXT_PUBLIC_ADSENSE_CLIENT_ID)</p>
      </div>
    )
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block', ...style }}
      data-ad-client={clientId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  )
}
