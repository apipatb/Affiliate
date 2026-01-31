import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVideo, generateAIVideo, generateVeo3Video } from '@/lib/video-generator'

// Validation constants
const MAX_HOOK_LENGTH = 2000
const MAX_CAPTION_LENGTH = 2200
const VALID_TEXT_STYLES = ['minimal', 'bold', 'neon', 'simple']
const VALID_MUSIC_OPTIONS = ['upbeat', 'chill', 'energetic', 'corporate', null, '']

/**
 * Validate image URL to prevent SSRF
 */
function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    // Block internal/private IPs
    const hostname = parsed.hostname.toLowerCase()
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
      return false
    }
    return true
  } catch {
    return false
  }
}

// POST /api/tiktok/generate-video - Generate video for a job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const jobId = body.jobId || body.id
    const useAI = body.useAI || body.ai || false // Use AI-generated images (DALL-E 3)
    const useVeo3 = body.useVeo3 || body.veo3 || false // Use Google Veo 3 AI video
    const backgroundMusic = body.backgroundMusic || null // Optional: 'upbeat', 'chill', 'energetic', 'corporate'
    const musicVolume = body.musicVolume || 0.3 // 0.0 to 1.0
    const showTextOverlay = body.showTextOverlay || false // Show hook text on video
    const textStyle = body.textStyle || 'bold' // 'minimal', 'bold', 'neon', 'simple'
    const aspectRatio = body.aspectRatio || '9:16' // '16:9' or '9:16' (for Veo 3)

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

    // Check if Google Gemini API key is available for Veo 3
    if (useVeo3 && !process.env.GOOGLE_GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY is not configured. Please add it to .env.local' },
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

      if (useVeo3) {
        // Generate video with Google Veo 3 AI
        console.log(`Generating Veo 3 AI video for job ${jobId}...`)

        result = await generateVeo3Video({
          jobId,
          productName: job.productName || 'Product',
          hook1: job.hook1 || '',
          hook2: job.hook2 || '',
          hook3: job.hook3 || '',
          ending: job.ending || '',
          aspectRatio: aspectRatio as '16:9' | '9:16',
        })
      } else if (useAI) {
        // Generate video with AI-generated images (DALL-E 3)
        console.log(`Generating DALL-E 3 video for job ${jobId}...`)

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
          status: 'DONE', // Video generated successfully
          error: null,
        }
      })

      // If job has internalProductId, save video to Product's media gallery
      if (job.internalProductId) {
        try {
          await prisma.productMedia.create({
            data: {
              productId: job.internalProductId,
              url: result.videoPath,
              type: 'VIDEO',
              order: 99, // Add at end
            }
          })
          console.log(`📹 Video saved to product ${job.internalProductId} media gallery`)
        } catch (e) {
          console.log('Could not save video to product media:', e)
          // Don't fail the whole operation if this fails
        }
      }

      // Determine generation method for response
      const generationMethod = useVeo3 ? 'veo3' : useAI ? 'dalle3' : 'ffmpeg'
      const messageMap = {
        veo3: 'Veo 3 AI Video generated successfully',
        dalle3: 'DALL-E 3 AI Video generated successfully',
        ffmpeg: 'Video generated successfully',
      }

      return NextResponse.json({
        success: true,
        message: messageMap[generationMethod],
        job: {
          id: updatedJob.id,
          videoUrl: updatedJob.videoUrl,
          duration: result.duration,
          generationMethod,
          aiGenerated: useAI || useVeo3,
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
  const hasGemini = !!(process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY)

  let hasFFmpeg = false
  try {
    await execAsync('which ffmpeg')
    hasFFmpeg = true
  } catch {
    // FFmpeg not available - that's OK for Veo3
  }

  // Available if either FFmpeg (for local generation) or Gemini (for Veo3) is available
  const isAvailable = hasFFmpeg || hasGemini

  return NextResponse.json({
    available: isAvailable,
    capabilities: {
      ffmpeg: hasFFmpeg,
      tts: hasFFmpeg,
      aiImages: hasOpenAI,
      veo3: hasGemini,
      formats: ['mp4'],
      resolution: '1080x1920 (TikTok 9:16)',
      voices: hasFFmpeg ? ['th-TH-PremwadeeNeural (Female)', 'th-TH-NiwatNeural (Male)'] : [],
      aiModels: {
        dalle3: hasOpenAI ? 'Available' : 'Not configured (OPENAI_API_KEY)',
        veo3: hasGemini ? 'Available' : 'Not configured (GOOGLE_GEMINI_API_KEY)',
      },
    },
    usage: {
      ffmpeg: hasFFmpeg ? 'POST with { jobId, useAI: false } - Uses product images' : 'Not available (no FFmpeg)',
      dalle3: hasOpenAI && hasFFmpeg ? 'POST with { jobId, useAI: true } - AI generates images' : 'Not available',
      veo3: hasGemini ? 'POST with { jobId, useVeo3: true } - AI generates full video (Recommended)' : 'Not configured',
    },
    recommended: hasGemini ? 'veo3' : (hasFFmpeg ? 'ffmpeg' : null),
    note: !hasFFmpeg && hasGemini ? 'FFmpeg not available on server. Use Veo3 for video generation.' : undefined,
  })
}
