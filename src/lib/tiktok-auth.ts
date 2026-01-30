/**
 * TikTok API Authentication Utilities
 * Provides API key validation and rate limiting for TikTok endpoints
 */

import { NextRequest, NextResponse } from 'next/server'

// API Key for external services (Extension, webhooks)
const TIKTOK_API_KEY = process.env.TIKTOK_INTERNAL_API_KEY

// Rate limiting store (in-memory, use Redis for production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 60 // 60 requests per minute

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: string,
  status: number = 500,
  details?: string
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      message: details,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Validate API key from request headers or query params
 * Used for external services like browser extension
 */
export function validateApiKey(request: NextRequest): { valid: boolean; error?: string } {
  // If no API key is configured, allow all requests (development mode)
  if (!TIKTOK_API_KEY) {
    return { valid: true }
  }

  // Check header first
  const headerKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')

  // Check query param as fallback
  const { searchParams } = new URL(request.url)
  const queryKey = searchParams.get('api_key')

  const providedKey = headerKey || queryKey

  if (!providedKey) {
    return { valid: false, error: 'API key required' }
  }

  if (providedKey !== TIKTOK_API_KEY) {
    return { valid: false, error: 'Invalid API key' }
  }

  return { valid: true }
}

/**
 * Simple rate limiting by IP
 */
export function checkRateLimit(request: NextRequest): { allowed: boolean; remaining: number } {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'

  const now = Date.now()
  const key = `rate:${ip}`

  let entry = rateLimitStore.get(key)

  // Reset if window expired
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW }
    rateLimitStore.set(key, entry)
  }

  entry.count++

  // Clean up old entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore) {
      if (now > v.resetAt) rateLimitStore.delete(k)
    }
  }

  return {
    allowed: entry.count <= RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
  }
}

/**
 * Middleware wrapper for protected TikTok API routes
 */
export function withTikTokAuth(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: { requireApiKey?: boolean; rateLimit?: boolean } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { requireApiKey = false, rateLimit = true } = options

    // Check rate limit
    if (rateLimit) {
      const { allowed, remaining } = checkRateLimit(request)
      if (!allowed) {
        return errorResponse('Rate limit exceeded', 429, `Try again in ${RATE_LIMIT_WINDOW / 1000} seconds`)
      }
    }

    // Check API key if required
    if (requireApiKey) {
      const { valid, error } = validateApiKey(request)
      if (!valid) {
        return errorResponse(error || 'Unauthorized', 401)
      }
    }

    // Call the actual handler
    return handler(request)
  }
}

/**
 * Logger for TikTok operations
 */
export const tikTokLogger = {
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(`[TikTok] ${message}`, data ? JSON.stringify(data) : '')
  },
  error: (message: string, error?: unknown) => {
    console.error(`[TikTok ERROR] ${message}`, error)
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(`[TikTok WARN] ${message}`, data ? JSON.stringify(data) : '')
  },
}
