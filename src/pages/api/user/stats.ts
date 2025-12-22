import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '../../../lib/supabase/auth'

// In-memory database simulation (replace with real database)
interface UserStats {
  userId: string
  totalPoints: number
  level: number
  achievements: string[]
  generationCount: number
  lastLoginAt: Date
  loginStreak: number
  weeklyPoints: number
  weeklyGenerations: number
  createdAt: Date
}

// Temporary in-memory storage - replace with database
const userStatsDB = new Map<string, UserStats>()

interface StatsResponse {
  success: boolean
  stats?: UserStats
  error?: string
}

interface UpdateStatsRequest {
  action: 'add_points' | 'increment_generation' | 'add_achievement' | 'update_login'
  points?: number
  achievement?: string
}

// Calculate level from points
function calculateLevel(points: number): number {
  return Math.floor(points / 100) + 1
}

// Get or create user stats
function getUserStats(userId: string): UserStats {
  let stats = userStatsDB.get(userId)
  if (!stats) {
    stats = {
      userId,
      totalPoints: 0,
      level: 1,
      achievements: [],
      generationCount: 0,
      lastLoginAt: new Date(),
      loginStreak: 1,
      weeklyPoints: 0,
      weeklyGenerations: 0,
      createdAt: new Date()
    }
    userStatsDB.set(userId, stats)
  }
  return stats
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatsResponse>
) {
  // Check authentication using Supabase
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    })
  }

  const userId = authResult.user.id

  if (req.method === 'GET') {
    // Get user stats
    const stats = getUserStats(userId)
    return res.status(200).json({
      success: true,
      stats
    })
  }

  if (req.method === 'POST') {
    // Update user stats
    const { action, points, achievement }: UpdateStatsRequest = req.body

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required'
      })
    }

    const stats = getUserStats(userId)

    switch (action) {
      case 'add_points':
        if (typeof points !== 'number' || points < 0) {
          return res.status(400).json({
            success: false,
            error: 'Valid points amount is required'
          })
        }
        stats.totalPoints += points
        stats.weeklyPoints += points
        stats.level = calculateLevel(stats.totalPoints)
        break

      case 'increment_generation':
        stats.generationCount += 1
        stats.weeklyGenerations += 1
        break

      case 'add_achievement':
        if (!achievement || typeof achievement !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'Valid achievement ID is required'
          })
        }
        if (!stats.achievements.includes(achievement)) {
          stats.achievements.push(achievement)
        }
        break

      case 'update_login':
        const now = new Date()
        const lastLogin = new Date(stats.lastLoginAt)
        const timeDiff = now.getTime() - lastLogin.getTime()
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
        
        if (daysDiff === 1) {
          // Consecutive day login
          stats.loginStreak += 1
        } else if (daysDiff > 1) {
          // Reset streak
          stats.loginStreak = 1
        }
        // If daysDiff === 0, it's the same day, don't change streak
        
        stats.lastLoginAt = now
        break

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        })
    }

    userStatsDB.set(userId, stats)

    return res.status(200).json({
      success: true,
      stats
    })
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  })
}