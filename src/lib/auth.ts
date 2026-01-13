import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

// Configuration
const SALT_ROUNDS = 12

// Ensure JWT_SECRET is set (required for security)
if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is not set. Please add it to your .env file. ' +
    'Generate a secure secret with: openssl rand -base64 32'
  )
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const SESSION_COOKIE_NAME = 'admin_jwt_session'
const SESSION_DURATION = 60 * 60 * 24 * 7 // 7 days in seconds

// Types
export interface SessionPayload {
  userId: string
  email: string
  role: string
  expiresAt: Date
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// JWT utilities
export async function createToken(payload: Omit<SessionPayload, 'expiresAt'>): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000)

  return new SignJWT({ ...payload, expiresAt: expiresAt.toISOString() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    // Check if token is expired
    const expiresAt = new Date(payload.expiresAt as string)
    if (expiresAt < new Date()) {
      return null
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      expiresAt,
    }
  } catch {
    return null
  }
}

// Session management
export async function createSession(userId: string, email: string, role: string): Promise<void> {
  const token = await createToken({ userId, email, role })
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  return verifyToken(token)
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

// Authentication
export async function authenticate(email: string, password: string): Promise<{
  success: boolean
  error?: string
  user?: { id: string; email: string; role: string }
}> {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  })

  if (!user) {
    // Use generic error to prevent email enumeration
    return { success: false, error: 'Invalid email or password' }
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password)

  if (!isValid) {
    return { success: false, error: 'Invalid email or password' }
  }

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    return { success: false, error: 'Access denied. Admin privileges required.' }
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  }
}

// Middleware helper for edge runtime
export async function verifyTokenFromString(token: string): Promise<SessionPayload | null> {
  return verifyToken(token)
}

// API Route Authentication Helper
export async function requireAuth(request: Request): Promise<{
  authorized: boolean
  session?: SessionPayload
  response?: Response
}> {
  try {
    // Get token from cookies
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
      return {
        authorized: false,
        response: Response.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        ),
      }
    }

    // Parse session cookie
    const cookies = cookieHeader.split(';').map(c => c.trim())
    const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_COOKIE_NAME}=`))

    if (!sessionCookie) {
      return {
        authorized: false,
        response: Response.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        ),
      }
    }

    const token = sessionCookie.split('=')[1]
    const session = await verifyToken(token)

    if (!session) {
      return {
        authorized: false,
        response: Response.json(
          { error: 'Unauthorized', message: 'Invalid or expired session' },
          { status: 401 }
        ),
      }
    }

    // Check admin role
    if (session.role !== 'ADMIN') {
      return {
        authorized: false,
        response: Response.json(
          { error: 'Forbidden', message: 'Admin privileges required' },
          { status: 403 }
        ),
      }
    }

    return {
      authorized: true,
      session,
    }
  } catch (error) {
    return {
      authorized: false,
      response: Response.json(
        { error: 'Internal Server Error', message: 'Authentication check failed' },
        { status: 500 }
      ),
    }
  }
}
