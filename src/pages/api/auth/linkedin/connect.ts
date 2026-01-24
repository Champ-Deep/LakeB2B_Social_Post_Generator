/**
 * LinkedIn OAuth Connect Endpoint
 *
 * GET /api/auth/linkedin/connect - Initiate LinkedIn OAuth flow for account connection
 *
 * This is separate from the main app authentication. This flow:
 * 1. Requires the user to already be authenticated
 * 2. Requests w_member_social scope for posting
 * 3. Stores tokens in linkedin_connections table
 *
 * Query parameters:
 * - returnUrl: Optional URL to redirect after connection (default: /)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { serialize } from 'cookie'
import { getSessionFromRequest } from '../../../../lib/auth/middleware'

// LinkedIn OAuth configuration
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization'
const SCOPES = ['openid', 'profile', 'email', 'w_member_social']

// Cookie names for OAuth state
const STATE_COOKIE = 'linkedin_oauth_state'
const RETURN_URL_COOKIE = 'linkedin_oauth_return'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify user is authenticated
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in before connecting your LinkedIn account',
      code: 'UNAUTHORIZED'
    })
  }

  // Validate environment configuration
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI

  if (!clientId) {
    console.error('LINKEDIN_CLIENT_ID is not configured')
    return res.status(500).json({
      error: 'LinkedIn integration not configured',
      code: 'CONFIG_ERROR'
    })
  }

  if (!redirectUri) {
    console.error('LINKEDIN_REDIRECT_URI is not configured')
    return res.status(500).json({
      error: 'LinkedIn integration not configured',
      code: 'CONFIG_ERROR'
    })
  }

  // Generate secure state parameter (CSRF protection)
  // Include user ID in state for additional validation
  const stateData = {
    random: crypto.randomBytes(16).toString('hex'),
    userId: authResult.user.id,
    timestamp: Date.now()
  }
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64url')

  // Get return URL from query
  const returnUrl = (req.query.returnUrl as string) || '/'

  // Build LinkedIn OAuth URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: state,
    scope: SCOPES.join(' ')
  })

  const authUrl = `${LINKEDIN_AUTH_URL}?${params.toString()}`

  // Set cookies for state validation
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 600 // 10 minutes
  }

  res.setHeader('Set-Cookie', [
    serialize(STATE_COOKIE, state, cookieOptions),
    serialize(RETURN_URL_COOKIE, returnUrl, cookieOptions)
  ])

  // Redirect to LinkedIn OAuth
  return res.redirect(authUrl)
}
