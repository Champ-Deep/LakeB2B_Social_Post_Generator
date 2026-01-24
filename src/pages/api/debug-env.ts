/**
 * Debug endpoint to check environment variables
 * DELETE THIS FILE after debugging!
 */

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow in production for debugging
  if (process.env.NODE_ENV !== 'production') {
    return res.status(403).json({ error: 'Only available in production for debugging' })
  }

  const envCheck = {
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY ? 'SET ✓' : 'MISSING ✗',
    DATABASE_URL: !!process.env.DATABASE_URL ? 'SET ✓' : 'MISSING ✗',
    DIRECT_URL: !!process.env.DIRECT_URL ? 'SET ✓' : 'MISSING ✗',
    DATABASE_PROVIDER: process.env.DATABASE_PROVIDER || 'NOT SET (defaults to postgresql)',
    BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET ? 'SET ✓' : 'MISSING ✗',
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'NOT SET',
    LINKEDIN_CLIENT_ID: !!process.env.LINKEDIN_CLIENT_ID ? 'SET ✓' : 'MISSING ✗',
    LINKEDIN_CLIENT_SECRET: !!process.env.LINKEDIN_CLIENT_SECRET ? 'SET ✓' : 'MISSING ✗',
    LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI || 'NOT SET',
    LINKEDIN_TOKEN_ENCRYPTION_KEY: !!process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY ? 'SET ✓' : 'MISSING ✗',
    CRON_SECRET: !!process.env.CRON_SECRET ? 'SET ✓' : 'MISSING ✗',
    NODE_ENV: process.env.NODE_ENV,
  }

  return res.status(200).json({
    message: 'Environment Variables Status',
    environment: envCheck,
    timestamp: new Date().toISOString(),
  })
}
