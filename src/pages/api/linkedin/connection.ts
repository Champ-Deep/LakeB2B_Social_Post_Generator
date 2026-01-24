/**
 * LinkedIn Connection Status API
 *
 * GET /api/linkedin/connection - Get user's LinkedIn connection status
 * DELETE /api/linkedin/connection - Disconnect LinkedIn account
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '../../../lib/auth/middleware'
import { prisma } from '../../../lib/db/client'
import { isDatabaseConfigured } from '../../../lib/db/types'

interface ConnectionResponse {
  connected: boolean
  connection?: {
    id: string
    linkedin_id: string
    profile_name: string | null
    profile_image_url: string | null
    profile_url: string | null
    token_expires_at: string
    is_token_valid: boolean
    is_token_expiring_soon: boolean
  }
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to manage LinkedIn connection',
      code: 'UNAUTHORIZED'
    })
  }

  // Check database configuration
  if (!isDatabaseConfigured()) {
    return res.status(200).json({
      connected: false,
      message: 'Database not configured'
    })
  }

  if (req.method === 'GET') {
    return handleGet(req, res, authResult.user.id)
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res, authResult.user.id)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<ConnectionResponse>,
  userId: string
) {
  try {
    const connection = await prisma.linkedInConnection.findUnique({
      where: { userId },
      select: {
        id: true,
        linkedinId: true,
        profileName: true,
        profileImageUrl: true,
        profileUrl: true,
        tokenExpiresAt: true,
      },
    })

    if (!connection) {
      return res.status(200).json({
        connected: false
      })
    }

    // Check token validity
    const tokenExpiresAt = new Date(connection.tokenExpiresAt)
    const now = new Date()
    const isTokenValid = tokenExpiresAt > now

    // Check if token is expiring within 7 days
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const isTokenExpiringSoon = tokenExpiresAt < sevenDaysFromNow

    return res.status(200).json({
      connected: true,
      connection: {
        id: connection.id,
        linkedin_id: connection.linkedinId,
        profile_name: connection.profileName,
        profile_image_url: connection.profileImageUrl,
        profile_url: connection.profileUrl,
        token_expires_at: connection.tokenExpiresAt.toISOString(),
        is_token_valid: isTokenValid,
        is_token_expiring_soon: isTokenExpiringSoon && isTokenValid
      }
    })
  } catch (error) {
    console.error('Error fetching LinkedIn connection:', error)
    return res.status(500).json({
      connected: false,
      message: 'Failed to fetch connection status'
    })
  }
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    await prisma.linkedInConnection.delete({
      where: { userId },
    })

    return res.status(200).json({
      success: true,
      message: 'LinkedIn account disconnected'
    })
  } catch (error) {
    // If no record found, that's fine - user wasn't connected
    if ((error as { code?: string }).code === 'P2025') {
      return res.status(200).json({
        success: true,
        message: 'LinkedIn account was not connected'
      })
    }

    console.error('Error disconnecting LinkedIn:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to disconnect LinkedIn account'
    })
  }
}
