import { NextRequest, NextResponse } from 'next/server'
import { getAuthorizationUrl } from '@/lib/tiktok-api'
import { cookies } from 'next/headers'

/**
 * GET /api/tiktok/oauth/authorize
 * Redirects user to TikTok for OAuth authorization
 */
export async function GET(request: NextRequest) {
  try {
    // Generate a random state for CSRF protection
    const state = crypto.randomUUID()

    // Store state in a secure cookie for verification
    const cookieStore = await cookies()
    cookieStore.set('tiktok_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    })

    // Get the authorization URL
    const authUrl = getAuthorizationUrl(state)

    // Check if TikTok credentials are configured
    if (!process.env.TIKTOK_CLIENT_KEY || !process.env.TIKTOK_CLIENT_SECRET) {
      return NextResponse.json(
        {
          error: 'TikTok API credentials not configured',
          message: 'Please set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET environment variables',
        },
        { status: 500 }
      )
    }

    // Redirect to TikTok
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('OAuth authorize error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth', details: error.message },
      { status: 500 }
    )
  }
}
