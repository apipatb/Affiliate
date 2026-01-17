import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import {
  checkShopeeSession,
  openShopeeLogin,
  clearSession,
} from '@/lib/shopee-playwright-scraper'

// Force Node.js runtime (required for Playwright)
export const runtime = 'nodejs'

/**
 * GET /api/shopee/session
 * Check current Shopee session status
 */
export async function GET(request: NextRequest) {
  // Check admin auth
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  try {
    const session = await checkShopeeSession()
    return NextResponse.json({
      supported: true,
      ...session,
    })
  } catch (error) {
    console.error('[Session API] Error:', error)
    return NextResponse.json({
      supported: true,
      loggedIn: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * POST /api/shopee/session
 * Open browser for Shopee login
 */
export async function POST(request: NextRequest) {
  // Check admin auth
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  try {
    const result = await openShopeeLogin()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Session API] Login error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/shopee/session
 * Clear saved Shopee session (logout)
 */
export async function DELETE(request: NextRequest) {
  // Check admin auth
  const auth = await requireAuth(request)
  if (!auth.authorized) {
    return auth.response!
  }

  try {
    await clearSession()
    return NextResponse.json({
      success: true,
      message: 'Session cleared successfully',
    })
  } catch (error) {
    console.error('[Session API] Clear error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
