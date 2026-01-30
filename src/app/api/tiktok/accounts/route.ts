import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkDailyLimit } from '@/lib/tiktok-api'

/**
 * GET /api/tiktok/accounts
 * List all connected TikTok accounts
 */
export async function GET() {
  try {
    const accounts = await prisma.tikTokAccount.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tiktokUserId: true,
        tiktokUsername: true,
        displayName: true,
        avatarUrl: true,
        isActive: true,
        dailyPostCount: true,
        dailyPostResetAt: true,
        lastPostAt: true,
        tokenExpiresAt: true,
        tokenScope: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { jobs: true },
        },
      },
    })

    // Add daily limit info for each account
    const accountsWithLimits = await Promise.all(
      accounts.map(async (account: any) => {
        try {
          const { canPost, remainingPosts } = await checkDailyLimit(account.id)
          return {
            ...account,
            canPost,
            remainingPosts,
            jobCount: account._count.jobs,
          }
        } catch {
          return {
            ...account,
            canPost: false,
            remainingPosts: 0,
            jobCount: account._count.jobs,
          }
        }
      })
    )

    return NextResponse.json({
      accounts: accountsWithLimits,
      total: accounts.length,
      activeCount: accounts.filter((a: any) => a.isActive).length,
    })
  } catch (error: any) {
    console.error('Failed to fetch TikTok accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tiktok/accounts
 * Update account settings (activate/deactivate)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { accountId, isActive } = body

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
    }

    const account = await prisma.tikTokAccount.update({
      where: { id: accountId },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        tiktokUsername: true,
        displayName: true,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      account,
    })
  } catch (error: any) {
    console.error('Failed to update TikTok account:', error)
    return NextResponse.json(
      { error: 'Failed to update account', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tiktok/accounts
 * Disconnect a TikTok account
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
    }

    // Check if any jobs are using this account
    const jobCount = await prisma.tikTokJob.count({
      where: { tiktokAccountId: accountId },
    })

    // Remove account reference from jobs first
    if (jobCount > 0) {
      await prisma.tikTokJob.updateMany({
        where: { tiktokAccountId: accountId },
        data: { tiktokAccountId: null },
      })
    }

    // Delete the account
    await prisma.tikTokAccount.delete({
      where: { id: accountId },
    })

    return NextResponse.json({
      success: true,
      message: 'Account disconnected successfully',
      affectedJobs: jobCount,
    })
  } catch (error: any) {
    console.error('Failed to disconnect TikTok account:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect account', details: error.message },
      { status: 500 }
    )
  }
}
