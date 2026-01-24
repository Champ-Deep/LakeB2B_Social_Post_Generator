/**
 * Auth Middleware Utilities
 *
 * Server-side authentication utilities for API routes.
 * Replaces the Supabase auth helper functions with Better-Auth equivalents.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { auth } from './auth'
import { prisma } from '../db/client'

/**
 * Auth result returned from session verification
 * Matches the interface from the old Supabase auth
 */
export interface AuthResult {
  authenticated: boolean
  user?: {
    id: string
    email: string
    name: string
  }
  error?: string
}

/**
 * Convert Next.js API request headers to standard Headers object
 */
function getHeaders(req: NextApiRequest): Headers {
  const headers = new Headers()

  // Copy relevant headers
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v))
      } else {
        headers.set(key, value)
      }
    }
  })

  // Add cookies as Cookie header
  if (req.cookies) {
    const cookieString = Object.entries(req.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')
    if (cookieString) {
      headers.set('cookie', cookieString)
    }
  }

  return headers
}

/**
 * Get user session from API request
 * Verifies the session and returns user info
 *
 * This is the main replacement for the old Supabase getSessionFromRequest
 */
export async function getSessionFromRequest(req: NextApiRequest): Promise<AuthResult> {
  try {
    // Log available cookies for debugging (in development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth] Available cookies:', Object.keys(req.cookies || {}))
    }

    // Get session using Better-Auth
    const headers = getHeaders(req)
    const session = await auth.api.getSession({
      headers,
    })

    if (!session?.user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] No session found')
      }
      return {
        authenticated: false,
        error: 'No authentication token provided',
      }
    }

    // Return user info
    return {
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || session.user.email?.split('@')[0] || 'User',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication error'
    console.error('[Auth] getSessionFromRequest error:', message)
    return {
      authenticated: false,
      error: message,
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
): Promise<(AuthResult & { authenticated: true }) | null> {
  const authResult = await getSessionFromRequest(req)

  if (!authResult.authenticated) {
    res.status(401).json({
      error: 'Authentication required',
      message: authResult.error || 'Please log in to access this resource',
      code: 'UNAUTHORIZED',
    })
    return null
  }

  return authResult as AuthResult & { authenticated: true }
}

/**
 * Create or ensure user profile exists
 * Called after user registration or first login
 */
export async function ensureUserProfile(userId: string, email: string, name?: string) {
  try {
    // Check if profile exists
    const existing = await prisma.userProfile.findUnique({
      where: { userId },
    })

    if (!existing) {
      // Create new profile
      await prisma.userProfile.create({
        data: {
          userId,
          totalPoints: 0,
          level: 1,
          generationCount: 0,
          achievements: '[]',
          currentStreak: 0,
          longestStreak: 0,
          weeklyPoints: 0,
          weeklyGenerationCount: 0,
          streakBonusMultiplier: 1.0,
        },
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Created user profile for:', email)
      }
    }
  } catch (error) {
    console.error('[Auth] Error ensuring user profile:', error)
  }
}

/**
 * Get LinkedIn OAuth URL for connecting accounts
 * Note: LinkedIn OAuth is handled separately from Better-Auth
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
    scope: scopes.join(' '),
  })

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
}
