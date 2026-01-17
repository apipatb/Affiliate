// Platform configuration for affiliate links

export type Platform = 'SHOPEE' | 'LAZADA' | 'AMAZON' | 'ALIEXPRESS' | 'TIKTOK' | 'OTHER'

export interface PlatformConfig {
  name: string
  shortName: string
  color: string
  bgColor: string
  darkBgColor: string
  textColor: string
  icon: string // emoji or could be replaced with actual icon
  domain: string[]
}

export const PLATFORMS: Record<Platform, PlatformConfig> = {
  SHOPEE: {
    name: 'Shopee',
    shortName: 'Shopee',
    color: '#EE4D2D',
    bgColor: 'bg-[#EE4D2D]',
    darkBgColor: 'dark:bg-[#EE4D2D]',
    textColor: 'text-white',
    icon: '🛒',
    domain: ['shopee.co.th', 'shopee.com'],
  },
  LAZADA: {
    name: 'Lazada',
    shortName: 'Lazada',
    color: '#0F146D',
    bgColor: 'bg-[#0F146D]',
    darkBgColor: 'dark:bg-[#0F146D]',
    textColor: 'text-white',
    icon: '🛍️',
    domain: ['lazada.co.th', 'lazada.com'],
  },
  AMAZON: {
    name: 'Amazon',
    shortName: 'Amazon',
    color: '#FF9900',
    bgColor: 'bg-[#FF9900]',
    darkBgColor: 'dark:bg-[#FF9900]',
    textColor: 'text-black',
    icon: '📦',
    domain: ['amazon.com', 'amazon.co.jp', 'amazon.co.uk'],
  },
  ALIEXPRESS: {
    name: 'AliExpress',
    shortName: 'AliExp',
    color: '#E62E04',
    bgColor: 'bg-[#E62E04]',
    darkBgColor: 'dark:bg-[#E62E04]',
    textColor: 'text-white',
    icon: '🌏',
    domain: ['aliexpress.com'],
  },
  TIKTOK: {
    name: 'TikTok Shop',
    shortName: 'TikTok',
    color: '#000000',
    bgColor: 'bg-black',
    darkBgColor: 'dark:bg-black',
    textColor: 'text-white',
    icon: '🎵',
    domain: ['tiktok.com'],
  },
  OTHER: {
    name: 'อื่นๆ',
    shortName: 'อื่นๆ',
    color: '#6B7280',
    bgColor: 'bg-slate-500',
    darkBgColor: 'dark:bg-slate-600',
    textColor: 'text-white',
    icon: '🔗',
    domain: [],
  },
}

export function getPlatformConfig(platform: Platform | string): PlatformConfig {
  return PLATFORMS[platform as Platform] || PLATFORMS.OTHER
}

export function detectPlatformFromUrl(url: string): Platform {
  const lowerUrl = url.toLowerCase()

  for (const [platform, config] of Object.entries(PLATFORMS)) {
    if (config.domain.some(domain => lowerUrl.includes(domain))) {
      return platform as Platform
    }
  }

  return 'OTHER'
}
