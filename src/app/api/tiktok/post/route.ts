import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { postVideoToTikTok, getActiveAccount, checkDailyLimit } from '@/lib/tiktok-api'

/**
 * POST /api/tiktok/post
 * Manually trigger posting a job to TikTok
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, accountId } = body

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    // Get the job
    const job = await prisma.tikTokJob.findUnique({
      where: { id: jobId },
      include: { tiktokAccount: true },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Validate job has a video
    if (!job.videoUrl) {
      return NextResponse.json(
        { error: 'Job has no video. Generate a video first.' },
        { status: 400 }
      )
    }

    // Check if already posted
    if (job.status === 'DONE' && job.tiktokPostId) {
      return NextResponse.json(
        { error: 'Job already posted', postId: job.tiktokPostId },
        { status: 400 }
      )
    }

    // Get the TikTok account to use
    let targetAccountId = accountId || job.tiktokAccountId
    if (!targetAccountId) {
      const activeAccount = await getActiveAccount()
      if (!activeAccount) {
        return NextResponse.json(
          { error: 'No TikTok account connected. Please connect an account first.' },
          { status: 400 }
        )
      }
      targetAccountId = activeAccount.id
    }

    // Check daily limit
    const { canPost, remainingPosts } = await checkDailyLimit(targetAccountId)
    if (!canPost) {
      return NextResponse.json(
        {
          error: 'Daily post limit reached',
          remainingPosts,
          message: 'TikTok allows ~15 posts per day per account',
        },
        { status: 429 }
      )
    }

    // Update job status
    await prisma.tikTokJob.update({
      where: { id: jobId },
      data: {
        tiktokAccountId: targetAccountId,
        status: 'PROCESSING',
        progress: 10,
        progressStep: 'Initiating post to TikTok...',
      },
    })

    // Build caption with hashtags
    let caption = job.caption || job.productName || ''
    if (job.hashtags && job.hashtags.length > 0) {
      caption += '\n\n' + job.hashtags.map((h: string) => `#${h.replace(/^#/, '')}`).join(' ')
    }

    // Post to TikTok
    const result = await postVideoToTikTok(
      targetAccountId,
      jobId,
      job.videoUrl,
      caption,
      job.publishType || 'DIRECT_POST'
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Video posted to TikTok successfully',
        postId: result.postId,
        job: {
          id: jobId,
          status: 'DONE',
          postedAt: new Date(),
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: 'Failed to post video to TikTok',
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Failed to post to TikTok:', error)
    return NextResponse.json(
      { error: 'Failed to post to TikTok', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/tiktok/post
 * Get posting status for a job
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const job = await prisma.tikTokJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        progress: true,
        progressStep: true,
        tiktokPostId: true,
        postedAt: true,
        error: true,
        retryCount: true,
        tiktokAccount: {
          select: {
            id: true,
            displayName: true,
            tiktokUsername: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({ job })
  } catch (error: any) {
    console.error('Failed to get post status:', error)
    return NextResponse.json(
      { error: 'Failed to get post status', details: error.message },
      { status: 500 }
    )
  }
}
