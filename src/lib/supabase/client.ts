/**
 * Supabase Client Configuration
 *
 * This module provides Supabase client instances for both client-side and server-side usage.
 * Uses the @supabase/ssr package for Next.js integration with proper cookie handling.
 *
 * Note: Type-safe queries will be available once Supabase schema is deployed
 * and types are generated with `supabase gen types typescript`.
 */

import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

// Environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, 'public', any>

/**
 * Create a Supabase client for browser/client-side usage
 * Uses the anon key which respects Row Level Security (RLS)
 */
export function createBrowserSupabaseClient(): AnySupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is not configured')
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Create a Supabase client for server-side usage with service role
 * IMPORTANT: Only use this for server-side operations that need to bypass RLS
 * Never expose the service role key to the client
 */
export function createServerSupabaseClient(): AnySupabaseClient {
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
  }
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Create a Supabase client for API routes with proper cookie handling
 * This is the recommended way to handle auth in Next.js API routes
 */
export function createApiRouteClient(req: NextApiRequest, res: NextApiResponse): AnySupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is not configured')
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookies = req.cookies
        return Object.keys(cookies).map(name => ({
          name,
          value: cookies[name] || ''
        }))
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieParts: string[] = [`${name}=${value}`]

          if (options?.path) cookieParts.push(`Path=${options.path}`)
          if (options?.maxAge) cookieParts.push(`Max-Age=${options.maxAge}`)
          if (options?.domain) cookieParts.push(`Domain=${options.domain}`)
          if (options?.secure) cookieParts.push('Secure')
          if (options?.httpOnly) cookieParts.push('HttpOnly')
          if (options?.sameSite) cookieParts.push(`SameSite=${options.sameSite}`)

          const cookieString = cookieParts.join('; ')

          // Append to existing Set-Cookie headers
          const existingCookies = res.getHeader('Set-Cookie')
          const cookiesArray = Array.isArray(existingCookies)
            ? existingCookies
            : existingCookies
              ? [existingCookies as string]
              : []

          res.setHeader('Set-Cookie', [...cookiesArray, cookieString])
        })
      }
    }
  })
}

/**
 * Create a Supabase client for API routes (legacy - use createApiRouteClient instead)
 * Uses the anon key and expects auth token to be passed via cookies/headers
 */
export function createApiSupabaseClient(): AnySupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is not configured')
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Check if Supabase is configured
 * Useful for conditional features during development
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Export a singleton browser client for client-side components
let browserClient: ReturnType<typeof createBrowserSupabaseClient> | null = null

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient() can only be called on the client side')
  }

  if (!browserClient) {
    browserClient = createBrowserSupabaseClient()
  }

  return browserClient
}
