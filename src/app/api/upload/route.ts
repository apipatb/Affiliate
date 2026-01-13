import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { requireAuth } from '@/lib/auth'
import { rateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/rate-limit'

// File validation config
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]

export async function POST(request: NextRequest) {
    // Check authentication
    const auth = await requireAuth(request)
    if (!auth.authorized) {
        return auth.response!
    }

    // Rate limiting (stricter for file uploads)
    const identifier = getClientIdentifier(request)
    const rateLimitResult = rateLimit(identifier, RateLimitPresets.STRICT)
    if (!rateLimitResult.success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    error: 'Invalid file type',
                    message: 'Only images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM) are allowed',
                    allowedTypes: ALLOWED_TYPES
                },
                { status: 400 }
            )
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    error: 'File too large',
                    message: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
                    maxSize: MAX_FILE_SIZE
                },
                { status: 400 }
            )
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Create safe filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const fileExt = path.extname(file.name)
        const safeBasename = file.name
            .replace(fileExt, '')
            .replace(/[^a-zA-Z0-9-_]/g, '-')
            .substring(0, 50)
        const filename = `${uniqueSuffix}-${safeBasename}${fileExt}`
        const uploadDir = path.join(process.cwd(), 'public', 'uploads')
        const filePath = path.join(uploadDir, filename)

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true })

        // Save file
        await writeFile(filePath, buffer)

        // Return the public URL with media type
        const url = `/uploads/${filename}`
        const mediaType = ALLOWED_IMAGE_TYPES.includes(file.type) ? 'IMAGE' : 'VIDEO'

        return NextResponse.json({ url, mediaType, size: file.size, type: file.type })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        )
    }
}
