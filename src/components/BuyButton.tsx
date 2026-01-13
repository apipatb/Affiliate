'use client'

import { ExternalLink } from 'lucide-react'

interface BuyButtonProps {
  productId: string
  affiliateUrl?: string // Keep for backwards compatibility but not used
}

export default function BuyButton({ productId }: BuyButtonProps) {
  // Use redirect route that tracks clicks and redirects to affiliate URL
  const buyUrl = `/products/${productId}/go`

  const handleClick = () => {
    // Open the redirect route which will track and redirect
    window.open(buyUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleClick}
      className="w-full btn-primary text-lg py-4 flex items-center justify-center gap-2"
    >
      <ExternalLink className="w-5 h-5" />
      ซื้อเลย
    </button>
  )
}
