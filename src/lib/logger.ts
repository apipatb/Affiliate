/**
 * Structured Logger for TikTok Automation
 * Provides consistent logging across all modules
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogMeta {
  [key: string]: any
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  service: string
  message: string
  meta?: LogMeta
  error?: string
  stack?: string
}

function formatLog(entry: LogEntry): string {
  const { timestamp, level, service, message, meta, error } = entry
  const levelEmoji = {
    debug: '🔍',
    info: '📘',
    warn: '⚠️',
    error: '❌',
  }

  let output = `${levelEmoji[level]} [${timestamp}] [${service}] ${message}`

  if (meta && Object.keys(meta).length > 0) {
    output += ` | ${JSON.stringify(meta)}`
  }

  if (error) {
    output += ` | Error: ${error}`
  }

  return output
}

function createLogger(service: string) {
  const log = (level: LogLevel, message: string, meta?: LogMeta, error?: Error) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
      meta,
      error: error?.message,
      stack: error?.stack,
    }

    const formatted = formatLog(entry)

    switch (level) {
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(formatted)
        }
        break
      case 'info':
        console.log(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        // In production, you could send to external logging service here
        break
    }

    return entry
  }

  return {
    debug: (message: string, meta?: LogMeta) => log('debug', message, meta),
    info: (message: string, meta?: LogMeta) => log('info', message, meta),
    warn: (message: string, meta?: LogMeta) => log('warn', message, meta),
    error: (message: string, error?: Error, meta?: LogMeta) => log('error', message, meta, error),
  }
}

// Pre-configured loggers for different services
export const videoLogger = createLogger('VIDEO_GEN')
export const tiktokLogger = createLogger('TIKTOK_API')
export const schedulerLogger = createLogger('SCHEDULER')
export const pipelineLogger = createLogger('PIPELINE')
export const cronLogger = createLogger('CRON')

export { createLogger }
export type { LogLevel, LogMeta, LogEntry }
