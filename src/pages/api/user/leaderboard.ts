import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'lakeb2b-secret-key-2024'

// Mock leaderboard data - in production, this would come from database
interface LeaderboardEntry {
  userId: string
  name: string
  email: string
  totalPoints: number
  weeklyPoints: number
  level: number
  generationCount: number
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

// Mock data for demonstration
const mockLeaderboardData: Omit<LeaderboardEntry, 'rank'>[] = [
  {
    userId: 'lakeb2b-john.doe',
    name: 'John Doe',
    email: 'john.doe@lakeb2b.com',
    totalPoints: 1250,
    weeklyPoints: 320,
    level: 13,
    generationCount: 45
  },
  {
    userId: 'lakeb2b-jane.smith',
    name: 'Jane Smith', 
    email: 'jane.smith@lakeb2b.com',
    totalPoints: 950,
    weeklyPoints: 280,
    level: 10,
    generationCount: 38
  },
  {
    userId: 'lakeb2b-mike.johnson',
    name: 'Mike Johnson',
    email: 'mike.johnson@lakeb2b.com',
    totalPoints: 780,
    weeklyPoints: 150,
    level: 8,
    generationCount: 29
  },
  {
    userId: 'lakeb2b-sarah.wilson',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@lakeb2b.com',
    totalPoints: 650,
    weeklyPoints: 220,
    level: 7,
    generationCount: 24
  },
  {
    userId: 'lakeb2b-demo',
    name: 'LakeB2B Demo',
    email: 'demo@lakeb2b.com',
    totalPoints: 250,
    weeklyPoints: 120,
    level: 3,
    generationCount: 15
  }
]

function verifyUser(req: NextApiRequest): { userId: string; email: string } | null {
  try {
    const token = req.cookies.lakeb2b_token || 
                  (req.headers.authorization?.startsWith('Bearer ') ? 
                   req.headers.authorization.substring(7) : null)
    
    if (!token) return null
    
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return { userId: decoded.userId, email: decoded.email }
  } catch {
    return null
  }
}

function addRanks(entries: Omit<LeaderboardEntry, 'rank'>[]): LeaderboardEntry[] {
  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }))
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

  const user = verifyUser(req)
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    })
  }

  try {
    // Sort by total points for all-time leaderboard
    const allTimeEntries = [...mockLeaderboardData]
      .sort((a, b) => b.totalPoints - a.totalPoints)
    const allTimeLeaderboard = addRanks(allTimeEntries)

    // Sort by weekly points for weekly leaderboard  
    const weeklyEntries = [...mockLeaderboardData]
      .sort((a, b) => b.weeklyPoints - a.weeklyPoints)
    const weeklyLeaderboard = addRanks(weeklyEntries)

    // Find current user in leaderboards
    const currentUserAllTime = allTimeLeaderboard.find(entry => entry.userId === user.userId)
    const currentUserWeekly = weeklyLeaderboard.find(entry => entry.userId === user.userId)

    return res.status(200).json({
      success: true,
      leaderboard: {
        allTime: allTimeLeaderboard.slice(0, 10), // Top 10
        weekly: weeklyLeaderboard.slice(0, 10), // Top 10
        currentUser: currentUserAllTime || currentUserWeekly
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