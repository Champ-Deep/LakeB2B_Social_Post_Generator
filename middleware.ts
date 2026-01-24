/**
 * Next.js Middleware
 *
 * Simplified middleware that passes through requests.
 * Better-Auth handles session management internally via cookies.
 *
 * This middleware can be extended for:
 * - Protected route redirects
 * - Custom logging
 * - Request modification
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Simply pass through all requests
  // Better-Auth handles session cookies automatically
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
}

// Configure which routes should use this middleware
// Exclude static files, images, and other assets
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (svg, png, jpg, jpeg, gif, webp, ico)
     * - api/images (local image serving)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
