/**
 * Twitter OAuth Callback
 *
 * GET /api/twitter/callback - Handles Twitter OAuth callback
 *
 * Exchanges authorization code for tokens and saves connection.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { twitterService } from '../../../services/twitterService'
import { codeVerifierStore } from './connect'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, state, error, error_description } = req.query

  // Handle OAuth errors
  if (error) {
    console.error('Twitter OAuth error:', error, error_description)
    return res.redirect(`/?twitter_error=${encodeURIComponent(String(error_description || error))}`)
  }

  // Validate state and code
  if (!state || !code) {
    return res.redirect('/?twitter_error=missing_parameters')
  }

  const stateStr = String(state)
  const codeStr = String(code)

  // Get code verifier from store
  const storedData = codeVerifierStore.get(stateStr)

  if (!storedData) {
    return res.redirect('/?twitter_error=invalid_state')
  }

  // Check expiration
  if (storedData.expiresAt < Date.now()) {
    codeVerifierStore.delete(stateStr)
    return res.redirect('/?twitter_error=session_expired')
  }

  const { verifier, userId } = storedData

  // Delete used verifier
  codeVerifierStore.delete(stateStr)

  try {
    // Exchange code for tokens
    const result = await twitterService.handleCallback(codeStr, verifier)

    // Save connection to database
    await twitterService.saveConnection(userId, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      twitterUserId: result.user.id,
      username: result.user.username,
      profileImageUrl: result.user.profileImageUrl,
    })

    // Redirect to app with success
    return res.redirect(`/?twitter_connected=true&twitter_username=${encodeURIComponent(result.user.username)}`)
  } catch (error) {
    console.error('Twitter callback error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return res.redirect(`/?twitter_error=${encodeURIComponent(errorMessage)}`)
  }
}
