import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

const execAsync = promisify(exec)

// POST /api/tiktok/thumbnail - Generate thumbnail from video
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoPath, jobId, timestamp = '00:00:01' } = body

    if (!videoPath && !jobId) {
      return NextResponse.json(
        { error: 'videoPath or jobId is required' },
        { status: 400 }
      )
    }

    let actualVideoPath = videoPath

    // If jobId provided, get video path from job
    if (jobId) {
      const job = await prisma.tikTokJob.findUnique({
        where: { id: jobId },
        select: { videoUrl: true },
      })

      if (!job?.videoUrl) {
        return NextResponse.json(
          { error: 'Job has no video' },
          { status: 400 }
        )
      }

      actualVideoPath = job.videoUrl
    }

    // Determine if video is local or remote
    const isLocalPath = actualVideoPath.startsWith('/') || actualVideoPath.startsWith('.')
    const isPublicPath = actualVideoPath.startsWith('/videos/')

    let inputPath: string
    if (isPublicPath) {
      inputPath = path.join(process.cwd(), 'public', actualVideoPath)
    } else if (isLocalPath) {
      inputPath = actualVideoPath
    } else {
      // Remote URL - need to download first or use directly
      inputPath = actualVideoPath
    }

    // Generate output filename
    const videoFilename = path.basename(actualVideoPath, path.extname(actualVideoPath))
    const thumbnailFilename = `${videoFilename}_thumb.jpg`
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails')

    // Ensure thumbnails directory exists
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true })
    }

    const outputPath = path.join(thumbnailsDir, thumbnailFilename)
    const publicUrl = `/thumbnails/${thumbnailFilename}`

    // Generate thumbnail using FFmpeg
    const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -ss ${timestamp} -vframes 1 -q:v 2 -vf "scale=480:-1" "${outputPath}"`

    console.log('Generating thumbnail:', ffmpegCmd)

    try {
      await execAsync(ffmpegCmd)
    } catch (ffmpegError: any) {
      console.error('FFmpeg error:', ffmpegError)
      return NextResponse.json(
        { error: 'Failed to generate thumbnail', details: ffmpegError.message },
        { status: 500 }
      )
    }

    // Verify thumbnail was created
    if (!fs.existsSync(outputPath)) {
      return NextResponse.json(
        { error: 'Thumbnail file was not created' },
        { status: 500 }
      )
    }

    // Get file size
    const stats = fs.statSync(outputPath)

    return NextResponse.json({
      success: true,
      thumbnail: {
        url: publicUrl,
        path: outputPath,
        filename: thumbnailFilename,
        size: stats.size,
        timestamp,
      },
    })
  } catch (error: any) {
    console.error('Thumbnail generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate thumbnail', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/tiktok/thumbnail - Get thumbnail for a video or check availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const videoPath = searchParams.get('videoPath')

    if (!jobId && !videoPath) {
      return NextResponse.json(
        { error: 'jobId or videoPath is required' },
        { status: 400 }
      )
    }

    let videoUrl: string | null = null

    if (jobId) {
      const job = await prisma.tikTokJob.findUnique({
        where: { id: jobId },
        select: { videoUrl: true },
      })
      videoUrl = job?.videoUrl ?? null
    } else {
      videoUrl = videoPath
    }

    if (!videoUrl) {
      return NextResponse.json({
        available: false,
        reason: 'No video found',
      })
    }

    // Check if thumbnail already exists
    const videoFilename = path.basename(videoUrl, path.extname(videoUrl))
    const thumbnailFilename = `${videoFilename}_thumb.jpg`
    const thumbnailPath = path.join(process.cwd(), 'public', 'thumbnails', thumbnailFilename)
    const publicUrl = `/thumbnails/${thumbnailFilename}`

    if (fs.existsSync(thumbnailPath)) {
      const stats = fs.statSync(thumbnailPath)
      return NextResponse.json({
        available: true,
        thumbnail: {
          url: publicUrl,
          filename: thumbnailFilename,
          size: stats.size,
        },
      })
    }

    return NextResponse.json({
      available: false,
      reason: 'Thumbnail not generated yet',
      videoUrl,
    })
  } catch (error: any) {
    console.error('Thumbnail check error:', error)
    return NextResponse.json(
      { error: 'Failed to check thumbnail', details: error.message },
      { status: 500 }
    )
  }
}
