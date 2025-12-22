/**
 * Next.js Middleware for Supabase Session Management
 *
 * This middleware runs on every request (except static files) and:
 * 1. Creates a Supabase client with proper cookie handling
 * 2. Refreshes the session if needed (updates cookies automatically)
 * 3. Ensures session cookies are synced between client and server
 *
 * This is essential for Supabase OAuth to work correctly with Next.js API routes.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create a response object that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Skip middleware for requests without Supabase config
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  try {
    // Create a Supabase client with cookie handling for middleware
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update cookies in the request (for downstream handlers)
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          // Create a new response with updated headers
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })

          // Set cookies in the response (for the browser)
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    // Refresh the session - this is important!
    // It will automatically update cookies if the session is refreshed
    await supabase.auth.getUser()
  } catch (error) {
    // Log error but don't block the request
    console.error('[Middleware] Supabase session refresh error:', error)
  }

  return response
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
