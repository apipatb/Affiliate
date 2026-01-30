import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVideo, generateAIVideo } from '@/lib/video-generator'

// POST /api/tiktok/generate-video - Generate video for a job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const jobId = body.jobId || body.id
    const useAI = body.useAI || body.ai || false // Use AI-generated images
    const backgroundMusic = body.backgroundMusic || null // Optional: 'upbeat', 'chill', 'energetic', 'corporate'
    const musicVolume = body.musicVolume || 0.3 // 0.0 to 1.0
    const showTextOverlay = body.showTextOverlay || false // Show hook text on video
    const textStyle = body.textStyle || 'bold' // 'minimal', 'bold', 'neon', 'simple'

    // Watermark options
    const watermark = body.watermark || null // { enabled, type, imagePath, text, position, opacity, scale, margin }

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      )
    }

    // Get job from database
    const job = await prisma.tikTokJob.findUnique({
      where: { id: jobId }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if job has required data
    if (!useAI && !job.productImage) {
      return NextResponse.json(
        { error: 'Job is missing product image. Use useAI=true to generate images with AI.' },
        { status: 400 }
      )
    }

    if (!job.hook1 && !job.hook2 && !job.hook3) {
      return NextResponse.json(
        { error: 'Job is missing hook content. Please generate hooks first.' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is available for AI mode
    if (useAI && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured. Please add it to .env.local' },
        { status: 400 }
      )
    }

    // Update job status to PROCESSING
    await prisma.tikTokJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' }
    })

    try {
      let result

      if (useAI) {
        // Generate video with AI-generated images
        console.log(`Generating AI video for job ${jobId}...`)

        result = await generateAIVideo({
          productName: job.productName || 'Product',
          hook1: job.hook1 || '',
          hook2: job.hook2 || '',
          hook3: job.hook3 || '',
          ending: job.ending || '',
          numberOfImages: 4, // Generate 4 images for slideshow
        })
      } else {
        // Generate video with existing product image(s)
        console.log(`Generating video for job ${jobId}...`)

        // Use productImages from job if available
        let productImages: string[] = job.productImages || []

        // Fallback: Try to get multiple images from Product if productId matches
        if (productImages.length === 0 && job.productId) {
          try {
            // Check if we have a Product with this ID and get its media
            const product = await prisma.product.findUnique({
              where: { id: job.productId },
              include: {
                media: {
                  where: { type: 'IMAGE' },
                  orderBy: { order: 'asc' },
                  take: 5, // Max 5 images for slideshow
                }
              }
            })

            if (product) {
              // Collect all images: main image + media gallery
              if (product.imageUrl) {
                productImages.push(product.imageUrl)
              }
              if (product.media && product.media.length > 0) {
                productImages.push(...product.media.map((m: any) => m.url))
              }
              // Remove duplicates
              productImages = [...new Set(productImages)]
            }
          } catch (e) {
            console.log('Could not fetch product media, using single image')
          }
        }

        // Fallback to single image if no product images found
        if (productImages.length === 0 && job.productImage) {
          productImages = [job.productImage]
        }

        console.log(`Using ${productImages.length} image(s) for video:`, productImages)

        result = await generateVideo({
          jobId,
          productName: job.productName || 'Product',
          productImage: job.productImage || productImages[0],
          productImages: productImages.length > 1 ? productImages : undefined,
          hook1: job.hook1 || '',
          hook2: job.hook2 || '',
          hook3: job.hook3 || '',
          ending: job.ending || '',
          backgroundMusic: backgroundMusic ? `/audio/${backgroundMusic}.mp3` : undefined,
          musicVolume,
          showTextOverlay,
          textStyle,
          watermark,
        })
      }

      // Update job with video URL
      const updatedJob = await prisma.tikTokJob.update({
        where: { id: jobId },
        data: {
          videoUrl: result.videoPath,
          status: 'PENDING', // Back to pending, ready for posting
          error: null,
        }
      })

      return NextResponse.json({
        success: true,
        message: useAI ? 'AI Video generated successfully' : 'Video generated successfully',
        job: {
          id: updatedJob.id,
          videoUrl: updatedJob.videoUrl,
          duration: result.duration,
          aiGenerated: useAI,
        }
      })

    } catch (genError: any) {
      // Update job with error
      await prisma.tikTokJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: genError.message || 'Video generation failed',
        }
      })

      throw genError
    }

  } catch (error: any) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate video', details: error?.message },
      { status: 500 }
    )
  }
}

// GET /api/tiktok/generate-video - Check generation status or capabilities
export async function GET() {
  // Check if ffmpeg is available
  const { exec } = require('child_process')
  const { promisify } = require('util')
  const execAsync = promisify(exec)

  const hasOpenAI = !!process.env.OPENAI_API_KEY

  try {
    await execAsync('which ffmpeg')

    return NextResponse.json({
      available: true,
      capabilities: {
        ffmpeg: true,
        tts: true,
        aiImages: hasOpenAI,
        formats: ['mp4'],
        resolution: '1080x1920 (TikTok 9:16)',
        voices: ['th-TH-PremwadeeNeural (Female)', 'th-TH-NiwatNeural (Male)'],
        aiModel: hasOpenAI ? 'DALL-E 3' : 'Not configured',
      }
    })
  } catch {
    return NextResponse.json({
      available: false,
      error: 'FFmpeg is not installed on the server'
    })
  }
}
