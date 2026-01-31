import OpenAI from 'openai'
import path from 'path'
import fs from 'fs/promises'

// Lazy initialization to avoid build-time errors when API key is not set
let openaiClient: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

interface GenerateImageOptions {
  productName: string
  hook: string
  style?: 'product-showcase' | 'lifestyle' | 'promotional' | 'minimal'
  aspectRatio?: '9:16' | '1:1' | '16:9'
}

interface GeneratedImage {
  url: string
  localPath?: string
  revisedPrompt?: string
}

/**
 * Generate product-focused prompt for DALL-E with presenter
 */
function createImagePrompt(options: GenerateImageOptions): string {
  const { productName, hook, style = 'product-showcase' } = options

  const stylePrompts = {
    'product-showcase': `Professional product photography: An attractive Asian woman presenter with friendly smile, holding and showcasing ${productName} towards the camera. Clean studio background with soft gradient. The presenter is dressed professionally, making eye contact with camera. Product clearly visible in her hands. High-end commercial photography style, studio lighting.`,

    'lifestyle': `Lifestyle photography: A young attractive Asian woman naturally using or demonstrating ${productName} in a modern, bright living space. She looks happy and satisfied with the product. Warm natural lighting, aspirational mood. The product and presenter are both in focus. Instagram-worthy aesthetic.`,

    'promotional': `Promotional image: An energetic Asian female presenter enthusiastically presenting ${productName}, pointing at it or holding it up proudly. Bright, vibrant colors, dynamic pose. She has a big genuine smile. Modern clean background with subtle color accents. Perfect for social media ads and TikTok.`,

    'minimal': `Elegant product presentation: A sophisticated Asian woman model elegantly holding ${productName} with both hands. Minimalist white/cream background, soft studio lighting. She has a subtle confident smile. The composition is clean with lots of negative space. High-end luxury brand aesthetic.`,
  }

  const basePrompt = stylePrompts[style]

  // Add context from the hook if it provides useful details
  const contextPrompt = hook
    ? `Context: ${hook.substring(0, 100)}. `
    : ''

  return `${basePrompt} ${contextPrompt}Vertical 9:16 aspect ratio suitable for TikTok/Instagram Reels. Photorealistic style. No text, watermarks, or logos.`
}

/**
 * Generate a single image using DALL-E 3
 */
export async function generateImage(options: GenerateImageOptions): Promise<GeneratedImage> {
  const prompt = createImagePrompt(options)

  try {
    const response = await getOpenAI().images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1792', // Vertical for TikTok (closest to 9:16)
      quality: 'standard',
      style: 'vivid',
    })

    const imageUrl = response.data?.[0]?.url
    const revisedPrompt = response.data?.[0]?.revised_prompt

    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E')
    }

    return {
      url: imageUrl,
      revisedPrompt,
    }
  } catch (error: any) {
    console.error('DALL-E generation error:', error)
    throw new Error(`Failed to generate image: ${error.message}`)
  }
}

/**
 * Generate multiple images for a video (different scenes with presenter)
 */
export async function generateVideoImages(options: {
  productName: string
  hooks: string[]
  styles?: ('product-showcase' | 'lifestyle' | 'promotional' | 'minimal')[]
}): Promise<GeneratedImage[]> {
  const { productName, hooks, styles } = options

  // Default styles: variety of presenter poses/scenes
  const defaultStyles: ('product-showcase' | 'lifestyle' | 'promotional' | 'minimal')[] = [
    'product-showcase',  // Scene 1: Presenter showing product
    'lifestyle',         // Scene 2: Presenter using product
    'promotional',       // Scene 3: Presenter excited about product
    'minimal',           // Scene 4: Elegant presentation
  ]

  const selectedStyles = styles || defaultStyles.slice(0, hooks.length)
  const images: GeneratedImage[] = []

  console.log(`\n🎨 Generating ${hooks.length} AI images with presenter...\n`)

  for (let i = 0; i < hooks.length; i++) {
    const style = selectedStyles[i % selectedStyles.length]
    const hook = hooks[i]

    console.log(`📸 Image ${i + 1}/${hooks.length}: ${style}`)

    try {
      const image = await generateImage({
        productName,
        hook,
        style,
      })
      images.push(image)
      console.log(`   ✅ Success!`)
    } catch (error: any) {
      console.error(`   ❌ Failed: ${error.message}`)
      // Continue with other images even if one fails
    }

    // Add delay between requests to avoid rate limiting
    if (i < hooks.length - 1) {
      console.log(`   ⏳ Waiting 2s before next image...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  console.log(`\n🎬 Generated ${images.length}/${hooks.length} images\n`)

  return images
}

/**
 * Download generated image to local file
 */
export async function downloadGeneratedImage(
  imageUrl: string,
  outputDir: string,
  filename?: string
): Promise<string> {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }

  const buffer = await response.arrayBuffer()

  await fs.mkdir(outputDir, { recursive: true })

  const finalFilename = filename || `generated-${Date.now()}.png`
  const outputPath = path.join(outputDir, finalFilename)

  await fs.writeFile(outputPath, Buffer.from(buffer))

  return outputPath
}

/**
 * Generate images and save them locally for video creation
 */
export async function generateAndSaveImages(options: {
  productName: string
  hooks: string[]
  outputDir: string
}): Promise<string[]> {
  const { productName, hooks, outputDir } = options

  const images = await generateVideoImages({
    productName,
    hooks,
  })

  const localPaths: string[] = []

  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    const localPath = await downloadGeneratedImage(
      image.url,
      outputDir,
      `scene-${i + 1}.png`
    )
    localPaths.push(localPath)
  }

  return localPaths
}
