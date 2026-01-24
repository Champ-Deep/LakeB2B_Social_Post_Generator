/**
 * Leaderboard API
 *
 * Retrieves real-time leaderboard data from SQLite via Prisma.
 * Provides all-time and weekly rankings.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '../../../lib/auth/middleware'
import { prisma } from '../../../lib/db/client'
import type { UserProfile } from '@prisma/client'

interface LeaderboardEntry {
  userId: string
  name: string
  email: string
  totalPoints: number
  weeklyPoints: number
  level: number
  generationCount: number
  currentStreak: number
  rank: number
}

interface LeaderboardResponse {
  success: boolean
  leaderboard?: {
    allTime: LeaderboardEntry[]
    weekly: LeaderboardEntry[]
    currentUser?: LeaderboardEntry
  }
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LeaderboardResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    })
  }

  const userId = authResult.user.id

  try {
    // Fetch top 20 users by total points (all-time)
    const allTimeUsers = await prisma.userProfile.findMany({
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
      orderBy: { totalPoints: 'desc' },
      take: 20,
    })

    // Fetch top 20 users by weekly points
    const weeklyUsers = await prisma.userProfile.findMany({
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
      orderBy: { weeklyPoints: 'desc' },
      take: 20,
    })

    // Map to leaderboard entries with ranks
    const mapToLeaderboardEntry = (
      profile: UserProfile & { user: { email: string; name: string | null } },
      rank: number
    ): LeaderboardEntry => ({
      userId: profile.userId,
      name: profile.user.name || profile.user.email?.split('@')[0] || 'Anonymous',
      email: profile.user.email || '',
      totalPoints: profile.totalPoints,
      weeklyPoints: profile.weeklyPoints,
      level: profile.level,
      generationCount: profile.generationCount,
      currentStreak: profile.currentStreak,
      rank
    })

    const allTimeLeaderboard: LeaderboardEntry[] = allTimeUsers.map(
      (profile, index) => mapToLeaderboardEntry(profile, index + 1)
    )

    const weeklyLeaderboard: LeaderboardEntry[] = weeklyUsers.map(
      (profile, index) => mapToLeaderboardEntry(profile, index + 1)
    )

    // Find current user in leaderboards
    let currentUserEntry: LeaderboardEntry | undefined

    // Check all-time ranking first
    const allTimeIndex = allTimeLeaderboard.findIndex(e => e.userId === userId)
    if (allTimeIndex !== -1) {
      currentUserEntry = allTimeLeaderboard[allTimeIndex]
    } else {
      // User not in top 20, fetch their profile separately
      const currentUserProfile = await prisma.userProfile.findUnique({
        where: { userId },
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
      })

      if (currentUserProfile) {
        // Calculate approximate rank by counting users with more points
        const rankCount = await prisma.userProfile.count({
          where: {
            totalPoints: { gt: currentUserProfile.totalPoints },
          },
        })

        currentUserEntry = mapToLeaderboardEntry(
          currentUserProfile,
          rankCount + 1
        )
      }
    }

    return res.status(200).json({
      success: true,
      leaderboard: {
        allTime: allTimeLeaderboard.slice(0, 10),
        weekly: weeklyLeaderboard.slice(0, 10),
        currentUser: currentUserEntry
      }
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}
