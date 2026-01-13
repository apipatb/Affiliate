import { NextRequest, NextResponse } from 'next/server'
import { authenticate, createSession } from '@/lib/auth'

// Rate limiting store (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

// Test environment bypass key (only works in development)
const TEST_BYPASS_KEY = 'testsprite-bypass-key-2024'

function shouldBypassRateLimit(request: NextRequest): boolean {
  // Only allow bypass in development mode with explicit header
  if (process.env.NODE_ENV === 'production') {
    return false
  }

  // Check for test bypass header (requires explicit opt-in)
  const bypassHeader = request.headers.get('x-test-bypass')
  if (bypassHeader === TEST_BYPASS_KEY) {
    return true
  }

  return false
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return ip
}

// Export for testing purposes - allows resetting rate limits
export function resetRateLimits(): void {
  loginAttempts.clear()
}

function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts?: number; lockoutEnds?: Date } {
  const now = Date.now()
  const attempts = loginAttempts.get(ip)

  if (!attempts) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }

  // Reset if lockout period has passed
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(ip)
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }

  // Check if locked out
  if (attempts.count >= MAX_ATTEMPTS) {
    const lockoutEnds = new Date(attempts.lastAttempt + LOCKOUT_DURATION)
    return { allowed: false, lockoutEnds }
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - attempts.count }
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const attempts = loginAttempts.get(ip)

  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
  } else {
    attempts.count++
    attempts.lastAttempt = now
  }
}

function clearFailedAttempts(ip: string): void {
  loginAttempts.delete(ip)
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const bypassRateLimit = shouldBypassRateLimit(request)

    // Check rate limiting (skip for test environment)
    if (!bypassRateLimit) {
      const rateLimit = checkRateLimit(ip)
      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: 'Too many login attempts. Please try again later.',
            lockoutEnds: rateLimit.lockoutEnds,
          },
          { status: 429 }
        )
      }
    }

    // Parse request body
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input format' },
        { status: 400 }
      )
    }

    // Authenticate user
    const result = await authenticate(email, password)

    if (!result.success || !result.user) {
      // Only record failed attempts if not bypassing rate limit
      if (!bypassRateLimit) {
        recordFailedAttempt(ip)
      }
      const remaining = bypassRateLimit ? MAX_ATTEMPTS : checkRateLimit(ip).remainingAttempts

      return NextResponse.json(
        {
          error: result.error || 'Authentication failed',
          remainingAttempts: remaining,
        },
        { status: 401 }
      )
    }

    // Clear failed attempts on successful login
    if (!bypassRateLimit) {
      clearFailedAttempts(ip)
    }

    // Create session
    await createSession(result.user.id, result.user.email, result.user.role)

    return NextResponse.json({
      success: true,
      user: {
        email: result.user.email,
        role: result.user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
