/**
 * User Stats API
 *
 * Handles user statistics including points, streaks, achievements, and game sessions.
 * All data is persisted to SQLite via Prisma.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '../../../lib/auth/middleware'
import { prisma } from '../../../lib/db/client'
import { parseAchievements, stringifyJsonField } from '../../../lib/db/types'

interface UserStats {
  userId: string
  totalPoints: number
  level: number
  achievements: string[]
  generationCount: number
  currentStreak: number
  longestStreak: number
  lastActivityDate: string | null
  weeklyPoints: number
  weeklyGenerationCount: number
  streakBonusMultiplier: number
  gamesPlayed: number
  createdAt: string
}

interface StatsResponse {
  success: boolean
  stats?: UserStats
  error?: string
  leveledUp?: boolean
  newLevel?: number
}

interface UpdateStatsRequest {
  action: 'add_points' | 'increment_generation' | 'add_achievement' | 'update_activity' | 'record_game'
  points?: number
  reason?: string
  achievement?: string
  gameData?: {
    gameType: string
    score: number
    timeRemaining?: number
    wasGenerationComplete?: boolean
  }
}

// Calculate level from points (100 points per level)
function calculateLevel(points: number): number {
  return Math.floor(points / 100) + 1
}

// Calculate streak bonus multiplier
function calculateStreakBonus(streak: number): number {
  if (streak >= 30) return 2.0
  if (streak >= 7) return 1.5
  return 1.0
}

// Check if streak should be updated
function shouldUpdateStreak(lastActivityDate: string | null): { increment: boolean; reset: boolean } {
  if (!lastActivityDate) {
    return { increment: true, reset: false }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastDate = new Date(lastActivityDate)
  lastDate.setHours(0, 0, 0, 0)

  const diffTime = today.getTime() - lastDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    // Same day - no change to streak
    return { increment: false, reset: false }
  } else if (diffDays === 1) {
    // Consecutive day - increment streak
    return { increment: true, reset: false }
  } else {
    // Missed days - reset streak
    return { increment: false, reset: true }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatsResponse>
) {
  // Check authentication
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    })
  }

  const userId = authResult.user.id

  if (req.method === 'GET') {
    try {
      // Get user profile from database
      let profile = await prisma.userProfile.findUnique({
        where: { userId },
      })

      // Get games played count
      const gamesPlayed = await prisma.gameSession.count({
        where: { userId },
      })

      if (!profile) {
        // Create new profile if doesn't exist
        profile = await prisma.userProfile.create({
          data: {
            userId,
            totalPoints: 0,
            level: 1,
            generationCount: 0,
            achievements: '[]',
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: null,
            weeklyPoints: 0,
            weeklyGenerationCount: 0,
            streakBonusMultiplier: 1.0,
          },
        })
      }

      return res.status(200).json({
        success: true,
        stats: {
          userId: profile.userId,
          totalPoints: profile.totalPoints,
          level: profile.level,
          achievements: parseAchievements(profile.achievements),
          generationCount: profile.generationCount,
          currentStreak: profile.currentStreak,
          longestStreak: profile.longestStreak,
          lastActivityDate: profile.lastActivityDate?.toISOString().split('T')[0] || null,
          weeklyPoints: profile.weeklyPoints,
          weeklyGenerationCount: profile.weeklyGenerationCount,
          streakBonusMultiplier: profile.streakBonusMultiplier,
          gamesPlayed: gamesPlayed,
          createdAt: profile.createdAt.toISOString(),
        }
      })
    } catch (error) {
      console.error('Error in GET stats:', error)
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  if (req.method === 'POST') {
    const { action, points, reason, achievement, gameData }: UpdateStatsRequest = req.body

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required'
      })
    }

    try {
      // Get or create profile
      let profile = await prisma.userProfile.findUnique({
        where: { userId },
      })

      // Create profile if doesn't exist
      if (!profile) {
        profile = await prisma.userProfile.create({
          data: {
            userId,
            totalPoints: 0,
            level: 1,
            generationCount: 0,
            achievements: '[]',
            currentStreak: 0,
            longestStreak: 0,
            weeklyPoints: 0,
            weeklyGenerationCount: 0,
            streakBonusMultiplier: 1.0,
          },
        })
      }

      const updates: Record<string, unknown> = {}
      let leveledUp = false
      let newLevel = profile.level

      switch (action) {
        case 'add_points': {
          if (typeof points !== 'number' || points < 0) {
            return res.status(400).json({
              success: false,
              error: 'Valid points amount is required'
            })
          }

          // Apply streak bonus
          const bonusMultiplier = profile.streakBonusMultiplier
          const adjustedPoints = Math.floor(points * bonusMultiplier)

          const newTotalPoints = profile.totalPoints + adjustedPoints
          const newWeeklyPoints = profile.weeklyPoints + adjustedPoints
          newLevel = calculateLevel(newTotalPoints)
          leveledUp = newLevel > profile.level

          updates.totalPoints = newTotalPoints
          updates.weeklyPoints = newWeeklyPoints
          updates.level = newLevel

          // Record points history
          await prisma.pointsHistory.create({
            data: {
              userId,
              pointsChange: adjustedPoints,
              reason: reason || 'points_added',
              balanceAfter: newTotalPoints,
              metadata: stringifyJsonField({
                original_points: points,
                multiplier: bonusMultiplier,
              }),
            },
          })
          break
        }

        case 'increment_generation': {
          updates.generationCount = profile.generationCount + 1
          updates.weeklyGenerationCount = profile.weeklyGenerationCount + 1
          break
        }

        case 'add_achievement': {
          if (!achievement || typeof achievement !== 'string') {
            return res.status(400).json({
              success: false,
              error: 'Valid achievement ID is required'
            })
          }

          const currentAchievements = parseAchievements(profile.achievements)
          if (!currentAchievements.includes(achievement)) {
            updates.achievements = stringifyJsonField([...currentAchievements, achievement])
          }
          break
        }

        case 'update_activity': {
          // Update streak based on activity
          const lastActivityDateStr = profile.lastActivityDate?.toISOString().split('T')[0] || null
          const { increment, reset } = shouldUpdateStreak(lastActivityDateStr)

          if (reset) {
            updates.currentStreak = 1
          } else if (increment) {
            updates.currentStreak = profile.currentStreak + 1
          }

          // Update longest streak if needed
          const newStreak = (updates.currentStreak as number) ?? profile.currentStreak
          if (newStreak > profile.longestStreak) {
            updates.longestStreak = newStreak
          }

          // Update streak bonus multiplier
          updates.streakBonusMultiplier = calculateStreakBonus(newStreak)

          // Update last activity date
          updates.lastActivityDate = new Date()
          break
        }

        case 'record_game': {
          if (!gameData || !gameData.gameType || typeof gameData.score !== 'number') {
            return res.status(400).json({
              success: false,
              error: 'Valid game data is required'
            })
          }

          // Record game session
          await prisma.gameSession.create({
            data: {
              userId,
              gameType: gameData.gameType,
              score: gameData.score,
              timeRemaining: gameData.timeRemaining,
              wasGenerationComplete: gameData.wasGenerationComplete || false,
            },
          })
          break
        }

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid action'
          })
      }

      // Update profile in database (only if there are updates)
      let updatedProfile = profile
      if (Object.keys(updates).length > 0) {
        updatedProfile = await prisma.userProfile.update({
          where: { userId },
          data: updates,
        })
      }

      // Get updated games count
      const gamesPlayedCount = await prisma.gameSession.count({
        where: { userId },
      })

      return res.status(200).json({
        success: true,
        stats: {
          userId: updatedProfile.userId,
          totalPoints: updatedProfile.totalPoints,
          level: updatedProfile.level,
          achievements: parseAchievements(updatedProfile.achievements),
          generationCount: updatedProfile.generationCount,
          currentStreak: updatedProfile.currentStreak,
          longestStreak: updatedProfile.longestStreak,
          lastActivityDate: updatedProfile.lastActivityDate?.toISOString().split('T')[0] || null,
          weeklyPoints: updatedProfile.weeklyPoints,
          weeklyGenerationCount: updatedProfile.weeklyGenerationCount,
          streakBonusMultiplier: updatedProfile.streakBonusMultiplier,
          gamesPlayed: gamesPlayedCount,
          createdAt: updatedProfile.createdAt.toISOString(),
        },
        leveledUp,
        newLevel: leveledUp ? newLevel : undefined,
      })
    } catch (error) {
      console.error('Error in POST stats:', error)
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  })
}
