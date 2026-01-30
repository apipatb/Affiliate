import { NextRequest } from 'next/server'
import {
  successResponse,
  errorResponse,
  tikTokLogger,
} from '@/lib/tiktok-auth'
import {
  sendLineNotification,
  sendDiscordNotification,
} from '@/lib/tiktok-auto-pipeline'

interface WebhookTestRequest {
  platform: 'line' | 'discord' | 'all'
  message?: string
}

/**
 * GET /api/tiktok/webhook
 * Check webhook configuration status
 */
export async function GET() {
  const lineConfigured = !!process.env.LINE_NOTIFY_TOKEN
  const discordConfigured = !!process.env.DISCORD_WEBHOOK_URL

  return successResponse({
    webhooks: {
      line: {
        configured: lineConfigured,
        url: 'https://notify-api.line.me/api/notify',
      },
      discord: {
        configured: discordConfigured,
      },
    },
    status: lineConfigured || discordConfigured ? 'ready' : 'not_configured',
    instructions: !lineConfigured && !discordConfigured ? {
      line: 'Set LINE_NOTIFY_TOKEN in .env.local (get from https://notify-bot.line.me/)',
      discord: 'Set DISCORD_WEBHOOK_URL in .env.local (create webhook in Discord channel settings)',
    } : undefined,
  })
}

/**
 * POST /api/tiktok/webhook
 * Test webhook notifications
 */
export async function POST(request: NextRequest) {
  try {
    let body: WebhookTestRequest
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 400)
    }

    const { platform = 'all', message = '🧪 ทดสอบการแจ้งเตือนจาก TikTok Auto Bot' } = body

    const results: { line?: boolean; discord?: boolean } = {}

    if (platform === 'line' || platform === 'all') {
      results.line = await sendLineNotification(message)
    }

    if (platform === 'discord' || platform === 'all') {
      results.discord = await sendDiscordNotification(message, {
        title: 'Test Notification',
        color: 0x00ff00,
      })
    }

    const anySuccess = Object.values(results).some(r => r === true)

    if (anySuccess) {
      return successResponse(results, 'Test notification sent')
    } else {
      return errorResponse('All notifications failed', 400, 'Check webhook configuration')
    }
  } catch (error: any) {
    tikTokLogger.error('Webhook test failed', error)
    return errorResponse('Failed to send notification', 500, error?.message)
  }
}
