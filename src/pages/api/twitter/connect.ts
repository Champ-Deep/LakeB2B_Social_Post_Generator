/**
 * Twitter OAuth Connect
 *
 * GET /api/twitter/connect - Initiates Twitter OAuth flow
 *
 * Redirects user to Twitter for authorization.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '../../../lib/auth/middleware'
import { twitterService, isTwitterConfigured } from '../../../services/twitterService'
import crypto from 'crypto'

// Store code verifiers temporarily (in production, use Redis or database)
const codeVerifierStore = new Map<string, { verifier: string; userId: string; expiresAt: number }>()

// Clean up expired entries periodically
function cleanupExpiredVerifiers() {
  const now = Date.now()
  codeVerifierStore.forEach((value, key) => {
    if (value.expiresAt < now) {
      codeVerifierStore.delete(key)
    }
  })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check if Twitter is configured
  if (!isTwitterConfigured()) {
    return res.status(503).json({
      error: 'Twitter integration not configured',
      message: 'Please configure TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET',
      code: 'NOT_CONFIGURED',
    })
  }

  // Check authentication
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to connect Twitter',
      code: 'UNAUTHORIZED',
    })
  }

  try {
    // Clean up old verifiers
    cleanupExpiredVerifiers()

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex')

    // Generate OAuth URL
    const { url, codeVerifier } = await twitterService.generateAuthUrl(state)

    // Store code verifier (expires in 10 minutes)
    codeVerifierStore.set(state, {
      verifier: codeVerifier,
      userId: authResult.user.id,
      expiresAt: Date.now() + 10 * 60 * 1000,
    })

    // Redirect to Twitter
    return res.redirect(url)
  } catch (error) {
    console.error('Twitter connect error:', error)
    return res.status(500).json({
      error: 'Failed to initiate Twitter connection',
      message: process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.message
        : undefined,
    })
  }
}

// Export for callback handler
export { codeVerifierStore }
