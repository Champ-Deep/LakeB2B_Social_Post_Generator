/**
 * Supabase Auth Utilities
 *
 * Helper functions for server-side authentication with Supabase.
 * Used in API routes to verify user sessions.
 */

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { User } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const JWT_SECRET = process.env.JWT_SECRET || 'lakeb2b-secret-key-2024'

/**
 * Auth result returned from session verification
 */
export interface AuthResult {
  authenticated: boolean
  user?: {
    id: string
    email: string
    name: string
  }
  supabaseUser?: User
  error?: string
}

/**
 * Create a Supabase admin client for server-side auth operations
 */
function createAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase configuration is missing')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Create a Supabase client for API routes with cookie reading
 * This is used for session verification (read-only cookie access)
 */
function createApiClient(req: NextApiRequest) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookies = req.cookies
        return Object.keys(cookies).map(name => ({
          name,
          value: cookies[name] || ''
        }))
      },
      setAll() {
        // We don't need to set cookies for verification
        // The middleware handles cookie refresh
      }
    }
  })
}

/**
 * Check for LakeB2B custom JWT token (email/password login)
 */
function getLakeB2BToken(req: NextApiRequest): string | null {
  // Check cookie
  if (req.cookies['lakeb2b_token']) {
    return req.cookies['lakeb2b_token']
  }

  // Check Authorization header
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      if (decoded.userId?.startsWith('lakeb2b-')) {
        return token
      }
    } catch {
      // Not a LakeB2B token
    }
  }

  return null
}

/**
 * Verify LakeB2B custom JWT token
 */
function verifyLakeB2BToken(token: string): AuthResult {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string
      email: string
      name: string
    }

    return {
      authenticated: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name
      }
    }
  } catch (error) {
    return {
      authenticated: false,
      error: 'Invalid or expired token'
    }
  }
}

/**
 * Get user session from request
 * Verifies the access token and returns user info
 * Supports both Supabase OAuth tokens and custom LakeB2B JWT tokens
 *
 * Note: This function relies on the middleware to have refreshed the session.
 * The middleware (middleware.ts) runs on every request and ensures cookies are up-to-date.
 */
export async function getSessionFromRequest(req: NextApiRequest): Promise<AuthResult> {
  try {
    // Log available cookies for debugging (in development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth] Available cookies:', Object.keys(req.cookies))
    }

    // 1. Check for LakeB2B custom JWT token first (email/password login)
    const lakeb2bToken = getLakeB2BToken(req)
    if (lakeb2bToken) {
      return verifyLakeB2BToken(lakeb2bToken)
    }

    // 2. Use Supabase SSR client to get the session from cookies
    // The middleware has already refreshed the session if needed
    const supabase = createApiClient(req)
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Supabase getUser error:', error?.message || 'No user found')
      }
      return {
        authenticated: false,
        error: error?.message || 'No authentication token provided'
      }
    }

    // Map to our user interface
    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
      },
      supabaseUser: user
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication error'
    console.error('[Auth] getSessionFromRequest error:', message)
    return {
      authenticated: false,
      error: message
    }
  }
}

/**
 * Middleware helper to require authentication
 * Returns 401 if not authenticated
 */
export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthResult & { authenticated: true } | null> {
  const authResult = await getSessionFromRequest(req)

  if (!authResult.authenticated) {
    res.status(401).json({
      error: 'Authentication required',
      message: authResult.error || 'Please log in to access this resource',
      code: 'UNAUTHORIZED'
    })
    return null
  }

  return authResult as AuthResult & { authenticated: true }
}

/**
 * Create or update user profile on first login
 */
export async function ensureUserProfile(userId: string, email: string, name?: string) {
  try {
    const supabase = createAdminClient()

    // Check if profile exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existing) {
      // Create new profile
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: email,
          name: name || email.split('@')[0],
          total_points: 0,
          level: 1,
          generation_count: 0,
          achievements: []
        })

      if (error) {
        console.error('Error creating user profile:', error)
      }
    }
  } catch (error) {
    console.error('Error ensuring user profile:', error)
  }
}

/**
 * Get LinkedIn OAuth URL for connecting accounts
 */
export function getLinkedInAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  if (!clientId) {
    throw new Error('LINKEDIN_CLIENT_ID is not configured')
  }

  const scopes = ['openid', 'profile', 'email', 'w_member_social']
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: state,
    scope: scopes.join(' ')
  })

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
}
