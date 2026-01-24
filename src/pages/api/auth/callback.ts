/**
 * OAuth Callback Handler
 *
 * GET /api/auth/callback - Legacy callback for OAuth redirects
 *
 * Note: With Better-Auth, authentication is handled via /api/auth/[...all].ts
 * This callback is kept for backwards compatibility and LinkedIn OAuth flow.
 */

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { error, error_description } = req.query

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description)
    return res.redirect(`/?error=${encodeURIComponent(String(error_description || error))}`)
  }

  // For Better-Auth, the auth flow is handled by /api/auth/[...all].ts
  // This callback just redirects to home with success message
  return res.redirect('/?login=success')
}
