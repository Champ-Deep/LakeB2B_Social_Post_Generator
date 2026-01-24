/**
 * Test endpoint to debug image generation requests
 * DELETE THIS FILE after debugging!
 */

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Return exactly what was received
  return res.status(200).json({
    message: 'Debug: Request received successfully',
    receivedBody: req.body,
    bodyType: typeof req.body,
    bodyKeys: Object.keys(req.body || {}),
    timestamp: new Date().toISOString(),
  })
}
