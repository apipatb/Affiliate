'use client'

import { Zap, ExternalLink } from 'lucide-react'
import { getPlatformConfig, type Platform } from '@/lib/platforms'

interface BuyButtonProps {
  productId: string
  platform?: Platform | string
  affiliateUrl?: string // Keep for backwards compatibility but not used
}

export default function BuyButton({ productId, platform = 'SHOPEE' }: BuyButtonProps) {
  // Use redirect route that tracks clicks and redirects to affiliate URL
  const buyUrl = `/products/${productId}/go`
  const platformConfig = getPlatformConfig(platform)

  const handleClick = () => {
    // Open the redirect route which will track and redirect
    window.open(buyUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-3">
      {/* Main CTA Button */}
      <button
        onClick={handleClick}
        className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white font-extrabold text-xl py-5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-orange-500/50 hover:shadow-3xl hover:shadow-orange-600/60 transition-all transform hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden"
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

        <Zap className="w-6 h-6 fill-white animate-pulse relative z-10" />
        <span className="relative z-10">ซื้อเลยที่ {platformConfig.name}</span>
        <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
      </button>

      {/* Info text */}
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        คลิกเพื่อไปยังหน้าสินค้าบน {platformConfig.name}
      </p>
    </div>
  )
}
