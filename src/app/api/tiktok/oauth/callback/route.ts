import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getUserInfo } from '@/lib/tiktok-api'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

/**
 * GET /api/tiktok/oauth/callback
 * Handles OAuth callback from TikTok
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const successUrl = `${baseUrl}/admin/tiktok?connected=true`
  const errorUrl = `${baseUrl}/admin/tiktok?error=`

  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle TikTok error
    if (error) {
      console.error('TikTok OAuth error:', error, errorDescription)
      return NextResponse.redirect(`${errorUrl}${encodeURIComponent(errorDescription || error)}`)
    }

    // Validate required params
    if (!code || !state) {
      return NextResponse.redirect(`${errorUrl}${encodeURIComponent('Missing code or state parameter')}`)
    }

    // Verify state matches (CSRF protection)
    const cookieStore = await cookies()
    const storedState = cookieStore.get('tiktok_oauth_state')?.value

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(`${errorUrl}${encodeURIComponent('Invalid state parameter (CSRF protection)')}`)
    }

    // Clear the state cookie
    cookieStore.delete('tiktok_oauth_state')

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Get user info
    const userInfo = await getUserInfo(tokens.access_token)

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // Check if account already exists
    const existingAccount = await prisma.tikTokAccount.findUnique({
      where: { tiktokUserId: userInfo.open_id },
    })

    if (existingAccount) {
      // Update existing account
      await prisma.tikTokAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt,
          tokenScope: tokens.scope,
          tiktokUsername: userInfo.username,
          displayName: userInfo.display_name,
          avatarUrl: userInfo.avatar_url,
          isActive: true,
          updatedAt: new Date(),
        },
      })

      console.log(`Updated TikTok account: ${userInfo.display_name || userInfo.username}`)
    } else {
      // Create new account
      // Use a default userId (in a real app, this would come from your auth system)
      const userId = 'admin-' + crypto.randomUUID().slice(0, 8)

      await prisma.tikTokAccount.create({
        data: {
          userId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt,
          tokenScope: tokens.scope,
          tiktokUserId: userInfo.open_id,
          tiktokUsername: userInfo.username,
          displayName: userInfo.display_name,
          avatarUrl: userInfo.avatar_url,
          isActive: true,
          dailyPostCount: 0,
        },
      })

      console.log(`Created TikTok account: ${userInfo.display_name || userInfo.username}`)
    }

    // Redirect to admin page with success
    return NextResponse.redirect(successUrl)
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${errorUrl}${encodeURIComponent(error.message)}`)
  }
}
