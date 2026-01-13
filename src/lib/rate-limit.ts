// Simple in-memory rate limiter
// For production, consider using Redis or a dedicated rate limiting service

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 10 * 60 * 1000)

export interface RateLimitConfig {
  maxRequests: number // Maximum number of requests
  windowMs: number // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Rate limiter function
 * @param identifier Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param config Rate limit configuration
 * @returns Rate limit result
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  // No existing entry or entry expired
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime,
    })

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: resetTime,
    }
  }

  // Increment count
  entry.count++

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.resetTime,
    }
  }

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetTime,
  }
}

/**
 * Get client identifier from request
 * Uses IP address or forwarded IP
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare

  return (
    forwardedFor?.split(',')[0] ||
    realIp ||
    cfConnectingIp ||
    'unknown'
  )
}

/**
 * Rate limit presets
 */
export const RateLimitPresets = {
  // Strict: 10 requests per minute
  STRICT: { maxRequests: 10, windowMs: 60 * 1000 },
  // Moderate: 30 requests per minute
  MODERATE: { maxRequests: 30, windowMs: 60 * 1000 },
  // Generous: 100 requests per minute
  GENEROUS: { maxRequests: 100, windowMs: 60 * 1000 },
  // Login: 5 attempts per 15 minutes
  LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
}
