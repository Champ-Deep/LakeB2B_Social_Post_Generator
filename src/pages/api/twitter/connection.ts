/**
 * Twitter Connection Status API
 *
 * GET /api/twitter/connection - Check Twitter connection status
 * DELETE /api/twitter/connection - Disconnect Twitter account
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '../../../lib/auth/middleware'
import { twitterService, isTwitterConfigured } from '../../../services/twitterService'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check if Twitter is configured
  if (!isTwitterConfigured()) {
    return res.status(503).json({
      error: 'Twitter integration not configured',
      code: 'NOT_CONFIGURED',
    })
  }

  // Check authentication
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
    })
  }

  if (req.method === 'GET') {
    // Get connection status
    try {
      const status = await twitterService.getConnectionStatus(authResult.user.id)

      return res.status(200).json({
        success: true,
        ...status,
      })
    } catch (error) {
      console.error('Twitter connection status error:', error)
      return res.status(500).json({
        error: 'Failed to get connection status',
      })
    }
  }

  if (req.method === 'DELETE') {
    // Disconnect Twitter
    try {
      await twitterService.deleteConnection(authResult.user.id)

      return res.status(200).json({
        success: true,
        message: 'Twitter account disconnected',
      })
    } catch (error) {
      console.error('Twitter disconnect error:', error)
      return res.status(500).json({
        error: 'Failed to disconnect Twitter',
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
