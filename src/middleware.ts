import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_COOKIE_NAME = 'admin_jwt_session'

// Ensure JWT_SECRET is set (required for security)
if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is not set. Please add it to your .env file. ' +
    'Generate a secure secret with: openssl rand -base64 32'
  )
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

// Routes that require authentication
const PROTECTED_ROUTES = ['/admin']
// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ['/admin/login']

async function verifySession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    // Check if token is expired
    const expiresAt = new Date(payload.expiresAt as string)
    if (expiresAt < new Date()) {
      return false
    }

    // Check if user has admin role
    if (payload.role !== 'ADMIN') {
      return false
    }

    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get session token from cookie
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  // Check if the route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname.startsWith(route) && !AUTH_ROUTES.includes(pathname)
  )

  // Check if it's an auth route (login page)
  const isAuthRoute = AUTH_ROUTES.includes(pathname)

  // Verify session if token exists
  const isAuthenticated = token ? await verifySession(token) : false

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/admin/login', request.url)
    // Add redirect parameter to return after login
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
