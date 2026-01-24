/**
 * LinkedIn OAuth Callback Endpoint
 *
 * GET /api/auth/linkedin/callback - Handle LinkedIn OAuth callback
 *
 * This endpoint:
 * 1. Validates the state parameter (CSRF protection)
 * 2. Exchanges the authorization code for tokens
 * 3. Fetches the user's LinkedIn profile
 * 4. Stores the encrypted tokens in linkedin_connections table
 * 5. Redirects back to the app
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { parse, serialize } from 'cookie'
import { getSessionFromRequest } from '../../../../lib/auth/middleware'
import { prisma } from '../../../../lib/db/client'
import { encryptToken } from '../../../../lib/linkedin/tokenEncryption'

// LinkedIn OAuth endpoints
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo'

// Cookie names
const STATE_COOKIE = 'linkedin_oauth_state'
const RETURN_URL_COOKIE = 'linkedin_oauth_return'

interface LinkedInTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  refresh_token_expires_in?: number
  scope: string
}

interface LinkedInUserInfo {
  sub: string // LinkedIn member ID
  name: string
  given_name?: string
  family_name?: string
  picture?: string
  email?: string
  email_verified?: boolean
  locale?: {
    country: string
    language: string
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, error, error_description, state } = req.query

  // Clear OAuth cookies regardless of outcome
  const clearCookies = [
    serialize(STATE_COOKIE, '', { path: '/', maxAge: 0 }),
    serialize(RETURN_URL_COOKIE, '', { path: '/', maxAge: 0 })
  ]

  // Handle OAuth errors from LinkedIn
  if (error) {
    console.error('LinkedIn OAuth error:', error, error_description)
    res.setHeader('Set-Cookie', clearCookies)
    return res.redirect(`/?linkedin_error=${encodeURIComponent(String(error_description || error))}`)
  }

  // Validate code parameter
  if (!code || typeof code !== 'string') {
    res.setHeader('Set-Cookie', clearCookies)
    return res.redirect('/?linkedin_error=missing_code')
  }

  // Parse cookies
  const cookies = parse(req.headers.cookie || '')
  const storedState = cookies[STATE_COOKIE]
  const returnUrl = cookies[RETURN_URL_COOKIE] || '/'

  // Validate state parameter (CSRF protection)
  if (!state || !storedState || state !== storedState) {
    console.error('State mismatch:', { received: state, stored: storedState })
    res.setHeader('Set-Cookie', clearCookies)
    return res.redirect('/?linkedin_error=invalid_state')
  }

  // Decode state to get user ID
  let stateData: { userId: string; timestamp: number }
  try {
    stateData = JSON.parse(Buffer.from(state as string, 'base64url').toString())
  } catch {
    res.setHeader('Set-Cookie', clearCookies)
    return res.redirect('/?linkedin_error=invalid_state_format')
  }

  // Check if state is expired (10 minutes)
  if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
    res.setHeader('Set-Cookie', clearCookies)
    return res.redirect('/?linkedin_error=state_expired')
  }

  // Verify user is still authenticated and matches state
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    res.setHeader('Set-Cookie', clearCookies)
    return res.redirect('/?linkedin_error=session_expired')
  }

  if (authResult.user.id !== stateData.userId) {
    res.setHeader('Set-Cookie', clearCookies)
    return res.redirect('/?linkedin_error=user_mismatch')
  }

  // Get environment configuration
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('LinkedIn OAuth configuration incomplete')
    res.setHeader('Set-Cookie', clearCookies)
    return res.redirect('/?linkedin_error=config_error')
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', tokenResponse.status, errorText)
      res.setHeader('Set-Cookie', clearCookies)
      return res.redirect('/?linkedin_error=token_exchange_failed')
    }

    const tokenData: LinkedInTokenResponse = await tokenResponse.json()

    // Fetch user profile
    const profileResponse = await fetch(LINKEDIN_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    })

    if (!profileResponse.ok) {
      console.error('Profile fetch failed:', profileResponse.status)
      res.setHeader('Set-Cookie', clearCookies)
      return res.redirect('/?linkedin_error=profile_fetch_failed')
    }

    const profileData: LinkedInUserInfo = await profileResponse.json()

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000)

    // Encrypt tokens before storage
    const encryptedAccessToken = encryptToken(tokenData.access_token)
    const encryptedRefreshToken = tokenData.refresh_token
      ? encryptToken(tokenData.refresh_token)
      : null

    // Upsert connection in database using Prisma
    // First check if this LinkedIn account is already connected
    const existingConnection = await prisma.linkedInConnection.findUnique({
      where: { linkedinId: profileData.sub },
    })

    if (existingConnection) {
      // Update existing connection
      await prisma.linkedInConnection.update({
        where: { id: existingConnection.id },
        data: {
          userId: authResult.user.id,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt: tokenExpiresAt,
          profileName: profileData.name,
          profileUrl: `https://www.linkedin.com/in/${profileData.sub}`,
          profileImageUrl: profileData.picture || null,
          updatedAt: new Date(),
        },
      })
    } else {
      // Check if user already has a different LinkedIn connection
      const userConnection = await prisma.linkedInConnection.findUnique({
        where: { userId: authResult.user.id },
      })

      if (userConnection) {
        // Update user's existing connection with new LinkedIn account
        await prisma.linkedInConnection.update({
          where: { id: userConnection.id },
          data: {
            linkedinId: profileData.sub,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiresAt: tokenExpiresAt,
            profileName: profileData.name,
            profileUrl: `https://www.linkedin.com/in/${profileData.sub}`,
            profileImageUrl: profileData.picture || null,
            updatedAt: new Date(),
          },
        })
      } else {
        // Create new connection
        await prisma.linkedInConnection.create({
          data: {
            userId: authResult.user.id,
            linkedinId: profileData.sub,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiresAt: tokenExpiresAt,
            profileName: profileData.name,
            profileUrl: `https://www.linkedin.com/in/${profileData.sub}`,
            profileImageUrl: profileData.picture || null,
          },
        })
      }
    }

    // Success - redirect to return URL
    res.setHeader('Set-Cookie', clearCookies)

    // Add success parameter to return URL
    const successUrl = new URL(returnUrl, `http://${req.headers.host}`)
    successUrl.searchParams.set('linkedin_connected', 'true')

    return res.redirect(successUrl.pathname + successUrl.search)

  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error)
    res.setHeader('Set-Cookie', clearCookies)
    return res.redirect('/?linkedin_error=unexpected_error')
  }
}
