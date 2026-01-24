/**
 * Points History API
 *
 * Retrieves paginated points transaction history for the authenticated user.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '../../../lib/auth/middleware'
import { prisma } from '../../../lib/db/client'
import { parseMetadata } from '../../../lib/db/types'

interface PointsHistoryEntry {
  id: string
  points_change: number
  reason: string
  balance_after: number
  metadata: Record<string, unknown>
  created_at: string
}

interface PointsHistoryResponse {
  success: boolean
  entries?: PointsHistoryEntry[]
  total?: number
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PointsHistoryResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  // Check authentication
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    })
  }

  const userId = authResult.user.id

  // Parse query params
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const offset = parseInt(req.query.offset as string) || 0

  try {
    // Get total count
    const total = await prisma.pointsHistory.count({
      where: { userId },
    })

    // Get paginated entries
    const entries = await prisma.pointsHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    })

    // Map to response format
    const formattedEntries: PointsHistoryEntry[] = entries.map(entry => ({
      id: entry.id,
      points_change: entry.pointsChange,
      reason: entry.reason,
      balance_after: entry.balanceAfter,
      metadata: parseMetadata(entry.metadata),
      created_at: entry.createdAt.toISOString(),
    }))

    return res.status(200).json({
      success: true,
      entries: formattedEntries,
      total
    })
  } catch (error) {
    console.error('Error in points history API:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}
