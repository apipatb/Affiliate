import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import fsSync from 'fs'
import os from 'os'
import { generateVideoImages, downloadGeneratedImage } from './image-generator'
import { prisma } from './prisma'
import { GoogleGenAI } from '@google/genai'

const execAsync = promisify(exec)

/**
 * Update job progress in database
 */
async function updateJobProgress(jobId: string | undefined, progress: number, progressStep: string) {
  if (!jobId) return

  try {
    await prisma.tikTokJob.update({
      where: { id: jobId },
      data: { progress, progressStep },
    })
    console.log(`📊 Progress: ${progress}% - ${progressStep}`)
  } catch (e) {
    // Ignore progress update errors
  }
}

/**
 * Generate ASS subtitle file for text overlay
 * ASS format supports Thai text and styling
 */
async function generateSubtitleFile(
  hooks: string[],
  duration: number,
  outputPath: string,
  style: 'minimal' | 'bold' | 'neon' | 'simple' = 'bold'
): Promise<string> {
  const hookDuration = duration / hooks.filter(Boolean).length
  const validHooks = hooks.filter(Boolean)

  // ASS style definitions
  const styles: Record<string, string> = {
    minimal: 'Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,0,2,30,30,30,1',
    bold: 'Style: Default,Arial,56,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,-1,0,0,100,100,0,0,1,3,0,2,30,30,30,1',
    neon: 'Style: Default,Arial,52,&H0000FF00,&H000000FF,&H00FFFFFF,&H80000000,-1,0,0,0,100,100,0,0,3,2,0,2,30,30,30,1',
    simple: 'Style: Default,Arial,44,&H0000FFFF,&H000000FF,&H00000000,&H80000000,-1,-1,0,0,100,100,0,0,1,2,0,2,30,30,30,1',
  }

  // Build ASS content
  let assContent = `[Script Info]
Title: TikTok Video Subtitles
ScriptType: v4.00+
PlayDepth: 0
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styles[style]}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  // Add each hook as a dialogue event
  let currentTime = 0
  validHooks.forEach((hook, i) => {
    const startTime = formatAssTime(currentTime)
    const endTime = formatAssTime(currentTime + hookDuration - 0.1)

    // Clean text for ASS format
    const cleanText = hook.replace(/\n/g, '\\N').replace(/,/g, '，')

    assContent += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${cleanText}\n`
    currentTime += hookDuration
  })

  await fs.writeFile(outputPath, assContent, 'utf-8')
  return outputPath
}

function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const cs = Math.floor((seconds % 1) * 100)
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`
}

/**
 * Generate FFmpeg filter for watermark overlay
 */
function generateWatermarkFilter(options: WatermarkOptions, inputLabel: string = '[v]'): { filter: string, outputLabel: string, requiresInput: boolean } {
  if (!options.enabled) {
    return { filter: '', outputLabel: inputLabel, requiresInput: false }
  }

  const opacity = options.opacity ?? 0.7
  const scale = options.scale ?? 0.15
  const margin = options.margin ?? 30

  const pos = WATERMARK_POSITIONS[options.position]
  const x = pos.x.replace(/margin/g, margin.toString())
  const y = pos.y.replace(/margin/g, margin.toString())

  if (options.type === 'image' && options.imagePath) {
    // Image watermark - scale to percentage of video width, then overlay
    const filter = `${inputLabel}[wm];[wm][logo]overlay=${x}:${y}:format=auto,format=yuv420p[vout]`
    return { filter, outputLabel: '[vout]', requiresInput: true }
  } else if (options.type === 'text' && options.text) {
    // Text watermark using drawtext
    const escapedText = options.text.replace(/'/g, "\\'").replace(/:/g, "\\:")
    const filter = `${inputLabel}drawtext=text='${escapedText}':fontsize=36:fontcolor=white@${opacity}:x=${x}:y=${y}:shadowcolor=black@0.5:shadowx=2:shadowy=2[vout]`
    return { filter, outputLabel: '[vout]', requiresInput: false }
  }

  return { filter: '', outputLabel: inputLabel, requiresInput: false }
}

interface VideoGeneratorOptions {
  jobId?: string // Job ID for progress tracking
  productName: string
  productImage: string
  productImages?: string[] // Multiple images for slideshow
  hook1: string
  hook2: string
  hook3: string
  ending: string
  outputPath?: string
  backgroundMusic?: string // Path to background music file
  musicVolume?: number // 0.0 to 1.0 (default 0.3)
  showTextOverlay?: boolean // Show hook text on video
  textStyle?: 'minimal' | 'bold' | 'neon' | 'simple' // Text style
  watermark?: WatermarkOptions // Watermark/logo options
}

// Watermark options
interface WatermarkOptions {
  enabled: boolean
  type: 'image' | 'text'
  imagePath?: string // Path to logo image (PNG with transparency)
  text?: string // Text watermark
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  opacity?: number // 0.0 to 1.0 (default 0.7)
  scale?: number // Scale factor for logo (default 0.15 = 15% of video width)
  margin?: number // Margin from edge in pixels (default 30)
}

// Watermark position presets
export const WATERMARK_POSITIONS = {
  'top-left': { x: 'margin', y: 'margin' },
  'top-right': { x: 'W-w-margin', y: 'margin' },
  'bottom-left': { x: 'margin', y: 'H-h-margin' },
  'bottom-right': { x: 'W-w-margin', y: 'H-h-margin' },
  'center': { x: '(W-w)/2', y: '(H-h)/2' },
} as const

// Text overlay styles
export const TEXT_STYLES = {
  minimal: {
    fontsize: 48,
    fontcolor: 'white',
    shadowcolor: 'black',
    shadowx: 2,
    shadowy: 2,
    box: 0,
  },
  bold: {
    fontsize: 56,
    fontcolor: 'white',
    shadowcolor: 'black',
    shadowx: 3,
    shadowy: 3,
    box: 1,
    boxcolor: 'black@0.5',
    boxborderw: 10,
  },
  neon: {
    fontsize: 52,
    fontcolor: '#00ff00',
    shadowcolor: '#00ff00',
    shadowx: 0,
    shadowy: 0,
    borderw: 2,
    bordercolor: 'white',
  },
  simple: {
    fontsize: 44,
    fontcolor: 'yellow',
    shadowcolor: 'black',
    shadowx: 2,
    shadowy: 2,
    box: 1,
    boxcolor: 'black@0.7',
    boxborderw: 8,
  }
} as const

// Available background music tracks
export const BACKGROUND_MUSIC = {
  upbeat: '/audio/upbeat.mp3',
  chill: '/audio/chill.mp3',
  energetic: '/audio/energetic.mp3',
  corporate: '/audio/corporate.mp3',
  none: null
} as const

interface GeneratedVideo {
  videoPath: string
  audioPath: string
  duration: number
  thumbnailPath?: string
}

/**
 * Generate thumbnail from video
 */
async function generateThumbnail(videoPath: string, timestamp: string = '00:00:01'): Promise<string | null> {
  try {
    const fullVideoPath = path.join(process.cwd(), 'public', videoPath)
    const videoFilename = path.basename(videoPath, path.extname(videoPath))
    const thumbnailFilename = `${videoFilename}_thumb.jpg`
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails')

    // Ensure thumbnails directory exists
    if (!fsSync.existsSync(thumbnailsDir)) {
      fsSync.mkdirSync(thumbnailsDir, { recursive: true })
    }

    const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename)
    const publicUrl = `/thumbnails/${thumbnailFilename}`

    // Generate thumbnail at 1 second mark
    const ffmpegCmd = `ffmpeg -y -i "${fullVideoPath}" -ss ${timestamp} -vframes 1 -q:v 2 -vf "scale=480:-1" "${thumbnailPath}"`

    await execAsync(ffmpegCmd)

    if (fsSync.existsSync(thumbnailPath)) {
      console.log(`🖼️ Thumbnail generated: ${publicUrl}`)
      return publicUrl
    }

    return null
  } catch (e) {
    console.log('⚠️ Could not generate thumbnail:', e)
    return null
  }
}

// Thai TTS voice options from edge-tts
const THAI_VOICE = process.env.TTS_VOICE || 'th-TH-PremwadeeNeural' // Female Thai voice
// Alternative: 'th-TH-NiwatNeural' for male voice

// Path to edge-tts (Python) - auto-detect or use environment variable
const EDGE_TTS_PATH = process.env.EDGE_TTS_PATH || 'edge-tts'

/**
 * Generate TTS audio from text using edge-tts
 * Falls back to silent audio if edge-tts is not available
 */
export async function generateTTS(text: string, outputPath: string): Promise<string> {
  // Escape special characters for shell
  const sanitizedText = text
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .replace(/`/g, "'")
    .slice(0, 5000) // Limit text length to prevent command line issues

  // Try edge-tts first
  const command = `${EDGE_TTS_PATH} --voice "${THAI_VOICE}" --text "${sanitizedText}" --write-media "${outputPath}"`

  try {
    await execAsync(command, { timeout: 120000 })
    return outputPath
  } catch (error: any) {
    console.error('TTS generation error:', error)

    // Fallback: try with 'python -m edge_tts' if direct command fails
    try {
      const fallbackCommand = `python3 -m edge_tts --voice "${THAI_VOICE}" --text "${sanitizedText}" --write-media "${outputPath}"`
      await execAsync(fallbackCommand, { timeout: 120000 })
      return outputPath
    } catch (fallbackError: any) {
      console.error('TTS fallback also failed:', fallbackError)
      throw new Error(`Failed to generate TTS: ${error.message}. Fallback: ${fallbackError.message}`)
    }
  }
}

/**
 * Get audio duration using ffprobe
 */
export async function getAudioDuration(audioPath: string): Promise<number> {
  const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`

  try {
    const { stdout } = await execAsync(command)
    return parseFloat(stdout.trim())
  } catch (error: any) {
    console.error('ffprobe error:', error)
    return 5 // Default 5 seconds
  }
}

/**
 * Download image from URL to local file
 */
export async function downloadImage(url: string, outputPath: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }

  const buffer = await response.arrayBuffer()
  await fs.writeFile(outputPath, Buffer.from(buffer))
  return outputPath
}

/**
 * Generate video with image(s) and TTS audio
 * Supports single image or multiple images (slideshow)
 * Includes variety of Ken Burns effects for dynamic motion
 */
export async function generateVideo(options: VideoGeneratorOptions): Promise<GeneratedVideo> {
  const {
    jobId,
    productName,
    productImage,
    productImages,
    hook1,
    hook2,
    hook3,
    ending,
    backgroundMusic,
    musicVolume = 0.3,
    showTextOverlay = false,
    textStyle = 'bold',
    watermark,
  } = options

  // Start progress tracking
  await updateJobProgress(jobId, 5, 'เริ่มต้นสร้างวิดีโอ...')

  // Create temp directory for working files
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tiktok-video-'))

  try {
    // Collect all images (use productImages array or single productImage)
    const allImages = productImages && productImages.length > 0
      ? productImages
      : [productImage]

    // 1. Download all product images
    console.log(`📸 Downloading ${allImages.length} product image(s)...`)
    await updateJobProgress(jobId, 10, `กำลังดาวน์โหลดรูป ${allImages.length} รูป...`)
    const localImages: string[] = []
    for (let i = 0; i < allImages.length; i++) {
      const imagePath = path.join(tempDir, `product-${i}.jpg`)
      await downloadImage(allImages[i], imagePath)
      localImages.push(imagePath)
      await updateJobProgress(jobId, 10 + Math.round((i + 1) / allImages.length * 10), `ดาวน์โหลดรูป ${i + 1}/${allImages.length}`)
    }

    // 2. Generate TTS audio for all hooks combined
    console.log('🔊 Generating TTS audio...')
    await updateJobProgress(jobId, 25, 'กำลังสร้างเสียงพากย์ (TTS)...')
    const fullScript = [hook1, hook2, hook3, ending].filter(Boolean).join(' ')
    const voicePath = path.join(tempDir, 'voice.mp3')
    await generateTTS(fullScript, voicePath)

    // 3. Get audio duration
    const audioDuration = await getAudioDuration(voicePath)
    console.log(`⏱️ Audio duration: ${audioDuration}s`)

    // 4. Mix background music if provided
    let audioPath = voicePath
    if (backgroundMusic) {
      console.log('🎵 Mixing background music...')
      await updateJobProgress(jobId, 35, 'กำลังผสมเพลงพื้นหลัง...')
      const musicPath = path.join(process.cwd(), 'public', backgroundMusic)
      const mixedPath = path.join(tempDir, 'mixed.mp3')

      try {
        // Mix voice (louder) with music (softer)
        const mixCommand = `ffmpeg -y -i "${voicePath}" -i "${musicPath}" -filter_complex "[0:a]volume=1.0[voice];[1:a]volume=${musicVolume},aloop=loop=-1:size=2e+09[music];[voice][music]amix=inputs=2:duration=shortest:dropout_transition=2[out]" -map "[out]" -t ${audioDuration} "${mixedPath}"`
        await execAsync(mixCommand, { timeout: 60000 })
        audioPath = mixedPath
        console.log('✅ Music mixed successfully')
      } catch (e) {
        console.log('⚠️ Could not mix music, using voice only')
      }
    }

    // 5. Generate video with FFmpeg
    console.log('🎬 Generating video...')
    await updateJobProgress(jobId, 45, 'กำลังสร้างวิดีโอ (FFmpeg)...')
    const outputDir = path.join(process.cwd(), 'public', 'videos')
    await fs.mkdir(outputDir, { recursive: true })

    const videoFilename = `tiktok-${Date.now()}.mp4`
    const videoPath = path.join(outputDir, videoFilename)

    const fps = 30

    if (localImages.length === 1) {
      // Single image: use Ken Burns effect
      const totalFrames = Math.ceil(audioDuration * fps)

      // Ken Burns: zoom from 1.0 to 1.5 with center focus
      const ffmpegCommand = `ffmpeg -y \
        -loop 1 -i "${localImages[0]}" \
        -i "${audioPath}" \
        -filter_complex "
          [0:v]scale=8000:-1,
          zoompan=z='min(zoom+0.0015,1.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=1080x1920:fps=${fps},
          setsar=1
          [v]" \
        -map "[v]" -map 1:a \
        -c:v libx264 -preset fast -crf 23 \
        -c:a aac -b:a 128k \
        -t ${audioDuration} \
        -pix_fmt yuv420p \
        -shortest \
        "${videoPath}"`

      await execAsync(ffmpegCommand, { timeout: 300000 })
    } else {
      // Multiple images: create slideshow with varied Ken Burns effects
      const imageDuration = audioDuration / localImages.length
      const framesPerImage = Math.ceil(imageDuration * fps)

      // Ken Burns effect variations for each image
      const kenBurnsEffects = [
        // Zoom in from center
        `zoompan=z='min(zoom+0.002,1.4)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${framesPerImage}:s=1080x1920:fps=${fps}`,
        // Zoom out from center
        `zoompan=z='if(eq(on,1),1.4,max(zoom-0.002,1.0))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${framesPerImage}:s=1080x1920:fps=${fps}`,
        // Pan left to right with slight zoom
        `zoompan=z='min(zoom+0.001,1.2)':x='if(eq(on,1),0,min(x+2,iw-iw/zoom))':y='ih/2-(ih/zoom/2)':d=${framesPerImage}:s=1080x1920:fps=${fps}`,
        // Pan right to left with slight zoom
        `zoompan=z='min(zoom+0.001,1.2)':x='if(eq(on,1),iw,max(x-2,0))':y='ih/2-(ih/zoom/2)':d=${framesPerImage}:s=1080x1920:fps=${fps}`,
      ]

      // Build filter complex for multiple images
      const inputs = localImages.map((img, i) => `-loop 1 -t ${imageDuration} -i "${img}"`).join(' ')

      const filters = localImages.map((_, i) => {
        const effect = kenBurnsEffects[i % kenBurnsEffects.length]
        return `[${i}:v]scale=4000:-1,${effect},setsar=1[v${i}]`
      }).join('; ')

      const concat = localImages.map((_, i) => `[v${i}]`).join('') + `concat=n=${localImages.length}:v=1:a=0[outv]`

      const ffmpegCommand = `ffmpeg -y \
        ${inputs} \
        -i "${audioPath}" \
        -filter_complex "${filters}; ${concat}" \
        -map "[outv]" -map ${localImages.length}:a \
        -c:v libx264 -preset fast -crf 23 \
        -c:a aac -b:a 128k \
        -t ${audioDuration} \
        -pix_fmt yuv420p \
        -shortest \
        "${videoPath}"`

      await execAsync(ffmpegCommand, { timeout: 300000 })
    }

    console.log('✅ Video generated successfully!')

    // 6. Add text overlay if enabled
    await updateJobProgress(jobId, 70, 'สร้างวิดีโอพื้นฐานเสร็จ...')
    let finalVideoPath = videoPath
    if (showTextOverlay) {
      console.log('📝 Adding text overlay...')
      await updateJobProgress(jobId, 75, 'กำลังเพิ่มข้อความ Subtitle...')
      try {
        const subtitlePath = path.join(tempDir, 'subtitles.ass')
        await generateSubtitleFile([hook1, hook2, hook3, ending], audioDuration, subtitlePath, textStyle)

        const videoWithTextPath = path.join(outputDir, `tiktok-text-${Date.now()}.mp4`)

        // Burn subtitles into video
        const subtitleCommand = `ffmpeg -y -i "${videoPath}" -vf "ass=${subtitlePath}" -c:a copy "${videoWithTextPath}"`
        await execAsync(subtitleCommand, { timeout: 300000 })

        // Remove original video without text
        await fs.unlink(videoPath)
        finalVideoPath = videoWithTextPath

        console.log('✅ Text overlay added!')
      } catch (e) {
        console.log('⚠️ Could not add text overlay:', e)
      }
    }

    // 7. Add watermark if enabled
    if (watermark?.enabled) {
      console.log('🏷️ Adding watermark...')
      await updateJobProgress(jobId, 85, 'กำลังเพิ่ม Watermark...')
      try {
        const videoWithWatermarkPath = path.join(outputDir, `tiktok-wm-${Date.now()}.mp4`)

        if (watermark.type === 'image' && watermark.imagePath) {
          // Image watermark
          const logoPath = path.join(process.cwd(), 'public', watermark.imagePath)
          const scale = watermark.scale ?? 0.15
          const opacity = watermark.opacity ?? 0.7
          const margin = watermark.margin ?? 30
          const pos = WATERMARK_POSITIONS[watermark.position]
          const x = pos.x.replace(/margin/g, margin.toString())
          const y = pos.y.replace(/margin/g, margin.toString())

          const watermarkCommand = `ffmpeg -y -i "${finalVideoPath}" -i "${logoPath}" -filter_complex "[1:v]scale=iw*${scale}:-1,format=rgba,colorchannelmixer=aa=${opacity}[logo];[0:v][logo]overlay=${x}:${y}" -c:a copy "${videoWithWatermarkPath}"`
          await execAsync(watermarkCommand, { timeout: 300000 })
        } else if (watermark.type === 'text' && watermark.text) {
          // Text watermark
          const escapedText = watermark.text.replace(/'/g, "\\'").replace(/:/g, "\\:")
          const opacity = watermark.opacity ?? 0.7
          const margin = watermark.margin ?? 30
          const pos = WATERMARK_POSITIONS[watermark.position]
          const x = pos.x.replace(/margin/g, margin.toString())
          const y = pos.y.replace(/margin/g, margin.toString())

          const watermarkCommand = `ffmpeg -y -i "${finalVideoPath}" -vf "drawtext=text='${escapedText}':fontsize=36:fontcolor=white@${opacity}:x=${x}:y=${y}:shadowcolor=black@0.5:shadowx=2:shadowy=2" -c:a copy "${videoWithWatermarkPath}"`
          await execAsync(watermarkCommand, { timeout: 300000 })
        }

        // Remove previous video
        await fs.unlink(finalVideoPath)
        finalVideoPath = videoWithWatermarkPath

        console.log('✅ Watermark added!')
      } catch (e) {
        console.log('⚠️ Could not add watermark:', e)
      }
    }

    // Return public URL path
    const publicVideoPath = `/videos/${path.basename(finalVideoPath)}`
    await updateJobProgress(jobId, 95, 'กำลังสร้าง Thumbnail...')

    // Generate thumbnail
    const thumbnailPath = await generateThumbnail(publicVideoPath)

    await updateJobProgress(jobId, 98, 'กำลังทำความสะอาดไฟล์ชั่วคราว...')

    // Cleanup temp files
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (e) {
      // Ignore cleanup errors
    }

    return {
      videoPath: publicVideoPath,
      audioPath: audioPath,
      duration: audioDuration,
      thumbnailPath: thumbnailPath || undefined
    }

  } catch (error) {
    // Cleanup on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error
  }
}

/**
 * Generate video with multiple images (slideshow style)
 */
export async function generateSlideshowVideo(options: {
  images: string[]
  texts: string[]
  audioText: string
  outputFilename?: string
}): Promise<GeneratedVideo> {
  const { images, texts, audioText, outputFilename } = options

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tiktok-slideshow-'))

  try {
    // 1. Download all images
    console.log('Downloading images...')
    const localImages: string[] = []
    for (let i = 0; i < images.length; i++) {
      const imagePath = path.join(tempDir, `image${i}.jpg`)
      await downloadImage(images[i], imagePath)
      localImages.push(imagePath)
    }

    // 2. Generate TTS audio
    console.log('Generating TTS audio...')
    const audioPath = path.join(tempDir, 'voice.mp3')
    await generateTTS(audioText, audioPath)

    // 3. Get audio duration
    const audioDuration = await getAudioDuration(audioPath)
    const imageDuration = audioDuration / localImages.length

    // 4. Create concat file for images
    const concatFile = path.join(tempDir, 'concat.txt')
    const concatContent = localImages
      .map(img => `file '${img}'\nduration ${imageDuration}`)
      .join('\n')
    // Add last image again (ffmpeg concat demuxer quirk)
    const fullConcatContent = concatContent + `\nfile '${localImages[localImages.length - 1]}'`
    await fs.writeFile(concatFile, fullConcatContent)

    // 5. Generate video
    const outputDir = path.join(process.cwd(), 'public', 'videos')
    await fs.mkdir(outputDir, { recursive: true })

    const videoFilename = outputFilename || `slideshow-${Date.now()}.mp4`
    const videoPath = path.join(outputDir, videoFilename)

    // Slideshow with zoom effect on each image
    const fps = 30
    const framesPerImage = Math.ceil(imageDuration * fps)

    const ffmpegCommand = `ffmpeg -y \
      -f concat -safe 0 -i "${concatFile}" \
      -i "${audioPath}" \
      -filter_complex "
        [0:v]scale=8000:-1,
        zoompan=z='min(zoom+0.002,1.3)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${framesPerImage}:s=1080x1920:fps=${fps},
        setsar=1
        [v]" \
      -map "[v]" -map 1:a \
      -c:v libx264 -preset fast -crf 23 \
      -c:a aac -b:a 128k \
      -t ${audioDuration} \
      -pix_fmt yuv420p \
      -shortest \
      "${videoPath}"`

    await execAsync(ffmpegCommand, { timeout: 300000 })

    const publicVideoPath = `/videos/${videoFilename}`

    // Generate thumbnail
    const thumbnailPath = await generateThumbnail(publicVideoPath)

    // Cleanup
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (e) {
      // Ignore cleanup errors
    }

    return {
      videoPath: publicVideoPath,
      audioPath: audioPath,
      duration: audioDuration,
      thumbnailPath: thumbnailPath || undefined
    }

  } catch (error) {
    // Cleanup on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error
  }
}

/**
 * Generate video with AI-generated images (DALL-E 3)
 * Creates multiple scenes with different image styles
 */
export async function generateAIVideo(options: {
  productName: string
  hook1: string
  hook2: string
  hook3: string
  ending: string
  numberOfImages?: number
}): Promise<GeneratedVideo> {
  const {
    productName,
    hook1,
    hook2,
    hook3,
    ending,
    numberOfImages = 4,
  } = options

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tiktok-ai-video-'))

  try {
    // 1. Generate TTS audio first to know the duration
    console.log('Generating TTS audio...')
    const fullScript = [hook1, hook2, hook3, ending].filter(Boolean).join(' ')
    const audioPath = path.join(tempDir, 'voice.mp3')
    await generateTTS(fullScript, audioPath)

    const audioDuration = await getAudioDuration(audioPath)
    console.log(`Audio duration: ${audioDuration}s`)

    // 2. Generate AI images using DALL-E 3
    console.log(`Generating ${numberOfImages} AI images...`)
    const hooks = [hook1, hook2, hook3, ending].filter(Boolean).slice(0, numberOfImages)

    const aiImages = await generateVideoImages({
      productName,
      hooks,
    })

    if (aiImages.length === 0) {
      throw new Error('Failed to generate any AI images')
    }

    // 3. Download images to temp directory
    console.log('Downloading generated images...')
    const localImages: string[] = []
    for (let i = 0; i < aiImages.length; i++) {
      const imagePath = path.join(tempDir, `scene-${i + 1}.png`)
      await downloadGeneratedImage(aiImages[i].url, tempDir, `scene-${i + 1}.png`)
      localImages.push(imagePath)
    }

    // 4. Calculate timing
    const imageDuration = audioDuration / localImages.length
    const fps = 30
    const framesPerImage = Math.ceil(imageDuration * fps)

    // 5. Create concat file for slideshow
    const concatFile = path.join(tempDir, 'concat.txt')
    const concatContent = localImages
      .map(img => `file '${img}'\nduration ${imageDuration}`)
      .join('\n')
    const fullConcatContent = concatContent + `\nfile '${localImages[localImages.length - 1]}'`
    await fs.writeFile(concatFile, fullConcatContent)

    // 6. Generate video with Ken Burns effect
    console.log('Generating video with AI images...')
    const outputDir = path.join(process.cwd(), 'public', 'videos')
    await fs.mkdir(outputDir, { recursive: true })

    const videoFilename = `tiktok-ai-${Date.now()}.mp4`
    const videoPath = path.join(outputDir, videoFilename)

    // FFmpeg: slideshow with zoom animation
    const ffmpegCommand = `ffmpeg -y \
      -f concat -safe 0 -i "${concatFile}" \
      -i "${audioPath}" \
      -filter_complex "
        [0:v]scale=2048:-1,
        zoompan=z='min(zoom+0.001,1.2)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${framesPerImage}:s=1080x1920:fps=${fps},
        setsar=1
        [v]" \
      -map "[v]" -map 1:a \
      -c:v libx264 -preset fast -crf 23 \
      -c:a aac -b:a 128k \
      -t ${audioDuration} \
      -pix_fmt yuv420p \
      -shortest \
      "${videoPath}"`

    await execAsync(ffmpegCommand, { timeout: 600000 })

    const publicVideoPath = `/videos/${videoFilename}`

    // Generate thumbnail
    const thumbnailPath = await generateThumbnail(publicVideoPath)

    // Cleanup
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (e) {
      // Ignore cleanup errors
    }

    return {
      videoPath: publicVideoPath,
      audioPath: audioPath,
      duration: audioDuration,
      thumbnailPath: thumbnailPath || undefined
    }

  } catch (error) {
    // Cleanup on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error
  }
}

/**
 * Generate video using Google Veo 3
 * Creates high-quality AI video from text prompt
 */
export async function generateVeo3Video(options: {
  jobId?: string
  productName: string
  hook1: string
  hook2: string
  hook3: string
  ending: string
  aspectRatio?: '16:9' | '9:16' // Default 9:16 for TikTok
}): Promise<GeneratedVideo> {
  const {
    jobId,
    productName,
    hook1,
    hook2,
    hook3,
    ending,
    aspectRatio = '9:16',
  } = options

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY is not configured. Please add it to .env.local')
  }

  await updateJobProgress(jobId, 5, 'เริ่มสร้างวิดีโอด้วย Veo 3...')

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tiktok-veo3-'))

  try {
    // Initialize Google GenAI client
    const ai = new GoogleGenAI({ apiKey })

    // Create compelling video prompt
    const videoPrompt = createVeo3Prompt({
      productName,
      hooks: [hook1, hook2, hook3, ending].filter(Boolean),
      aspectRatio,
    })

    console.log('🎬 Veo 3 Prompt:', videoPrompt)
    await updateJobProgress(jobId, 10, 'กำลังส่งคำขอไปยัง Veo 3...')

    // Generate video using Veo 3.1
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: videoPrompt,
      config: {
        aspectRatio: aspectRatio,
        numberOfVideos: 1,
      },
    })

    // Poll for completion
    let pollCount = 0
    const maxPolls = 60 // Max 10 minutes (10s * 60)
    await updateJobProgress(jobId, 15, 'กำลังรอ Veo 3 สร้างวิดีโอ...')

    while (!operation.done && pollCount < maxPolls) {
      pollCount++
      const progress = Math.min(15 + (pollCount / maxPolls) * 60, 75)
      await updateJobProgress(jobId, Math.round(progress), `Veo 3 กำลังสร้างวิดีโอ... (${pollCount * 10}s)`)

      console.log(`⏳ Waiting for Veo 3... (${pollCount * 10}s)`)
      await new Promise((resolve) => setTimeout(resolve, 10000))

      operation = await ai.operations.getVideosOperation({ operation })
    }

    if (!operation.done) {
      throw new Error('Veo 3 video generation timed out after 10 minutes')
    }

    // Check for errors
    if (!operation.response?.generatedVideos?.length) {
      throw new Error('Veo 3 did not generate any video')
    }

    await updateJobProgress(jobId, 80, 'ดาวน์โหลดวิดีโอจาก Veo 3...')

    // Download the generated video
    const generatedVideo = operation.response.generatedVideos[0]
    if (!generatedVideo?.video) {
      throw new Error('Veo 3 returned empty video')
    }
    const veo3VideoPath = path.join(tempDir, 'veo3-raw.mp4')

    await ai.files.download({
      file: generatedVideo.video,
      downloadPath: veo3VideoPath,
    })

    console.log('✅ Veo 3 video downloaded')

    // Get video duration
    const videoDuration = await getVideoDuration(veo3VideoPath)

    // Move to public folder
    await updateJobProgress(jobId, 90, 'กำลังบันทึกวิดีโอ...')
    const outputDir = path.join(process.cwd(), 'public', 'videos')
    await fs.mkdir(outputDir, { recursive: true })

    const videoFilename = `tiktok-veo3-${Date.now()}.mp4`
    const finalVideoPath = path.join(outputDir, videoFilename)

    await fs.copyFile(veo3VideoPath, finalVideoPath)

    const publicVideoPath = `/videos/${videoFilename}`

    // Generate thumbnail
    await updateJobProgress(jobId, 95, 'กำลังสร้าง Thumbnail...')
    const thumbnailPath = await generateThumbnail(publicVideoPath)

    // Cleanup temp files
    await updateJobProgress(jobId, 98, 'กำลังทำความสะอาดไฟล์ชั่วคราว...')
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (e) {
      // Ignore cleanup errors
    }

    console.log('✅ Veo 3 video generated successfully!')

    return {
      videoPath: publicVideoPath,
      audioPath: '', // Veo 3 includes audio
      duration: videoDuration,
      thumbnailPath: thumbnailPath || undefined,
    }

  } catch (error) {
    // Cleanup on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error
  }
}

/**
 * Get video duration using ffprobe
 */
async function getVideoDuration(videoPath: string): Promise<number> {
  const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`

  try {
    const { stdout } = await execAsync(command)
    return parseFloat(stdout.trim())
  } catch (error: any) {
    console.error('ffprobe error:', error)
    return 8 // Default 8 seconds for Veo 3
  }
}

/**
 * Create optimized prompt for Veo 3
 */
function createVeo3Prompt(options: {
  productName: string
  hooks: string[]
  aspectRatio: '16:9' | '9:16'
}): string {
  const { productName, hooks, aspectRatio } = options

  // Combine hooks into a compelling narrative
  const narrative = hooks.join(' ')

  // Determine video style based on aspect ratio
  const orientation = aspectRatio === '9:16' ? 'vertical portrait' : 'horizontal landscape'

  // Create cinematic prompt
  const prompt = `
Create a ${orientation} video advertisement for "${productName}".

Scene description: ${narrative}

Style requirements:
- High-quality, cinematic product showcase
- Smooth camera movements with subtle Ken Burns effect
- Professional lighting with soft shadows
- Modern, clean aesthetic suitable for social media
- Focus on the product with elegant transitions
- Upbeat, engaging mood

Technical: Sharp focus, professional color grading, 4K quality appearance.
`.trim()

  return prompt
}
