import { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth'
import { rewardsService } from './rewardsService'

// In-memory user stats storage (will be replaced with database later)
const userStats: Map<string, {
  totalPoints: number
  level: number
  achievements: string[]
  generationCount: number
}> = new Map()

// Initialize demo user stats
userStats.set('lakeb2b-demo', {
  totalPoints: 250,
  level: 3,
  achievements: ['first_generation', 'style_explorer', 'mini_game_master'],
  generationCount: 15
})

export class AuthService {
  private static instance: AuthService
  private currentUser: User | null = null

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials

    if (!email || !password) {
      return { success: false, error: 'Email and password are required' }
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' }
      }

      this.currentUser = data.user
      
      // Load user stats and update login
      await this.loadUserStats()
      
      return { 
        success: true, 
        user: data.user,
        message: data.message || 'Login successful' 
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    // Registration is currently handled via login with @lakeb2b.com domain restriction
    // This method is kept for interface compatibility but redirects to login
    return this.login(credentials)
  }

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    this.currentUser = null
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  async verifyToken(): Promise<User | null> {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include', // Include cookies
      })

      if (!response.ok) {
        this.currentUser = null
        return null
      }

      const data = await response.json()
      if (data.success && data.user) {
        this.currentUser = data.user
        return data.user
      }

      this.currentUser = null
      return null
    } catch (error) {
      console.error('Token verification error:', error)
      this.currentUser = null
      return null
    }
  }

  async updateUserPoints(userId: string, points: number): Promise<{ user: User | null, newAchievements: any[] }> {
    try {
      // Update points via API
      const response = await fetch('/api/user/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add_points',
          points
        }),
        credentials: 'include'
      })

      if (!response.ok) {
        console.error('Failed to update user points')
        return { user: null, newAchievements: [] }
      }

      const data = await response.json()
      if (!data.success || !data.stats) {
        return { user: null, newAchievements: [] }
      }

      // Create user object for achievement checking
      const userForAchievements = {
        id: userId,
        email: this.currentUser?.email || '',
        name: this.currentUser?.name || '',
        totalPoints: data.stats.totalPoints,
        level: data.stats.level,
        achievements: data.stats.achievements,
        generationCount: data.stats.generationCount
      }

      // Check for new achievements
      const newAchievements = rewardsService.checkNewAchievements(userForAchievements)
      
      // Add new achievements via API
      for (const achievement of newAchievements) {
        if (!data.stats.achievements.includes(achievement.id)) {
          await fetch('/api/user/stats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'add_achievement',
              achievement: achievement.id
            }),
            credentials: 'include'
          })

          // Award bonus points for achievement
          await fetch('/api/user/stats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'add_points',
              points: achievement.points
            }),
            credentials: 'include'
          })
        }
      }

      // Update current user if it's the same
      if (this.currentUser?.id === userId) {
        // Get fresh stats after achievements
        const freshResponse = await fetch('/api/user/stats', {
          method: 'GET',
          credentials: 'include'
        })
        
        if (freshResponse.ok) {
          const freshData = await freshResponse.json()
          if (freshData.success && freshData.stats) {
            const updatedUser = {
              ...this.currentUser,
              totalPoints: freshData.stats.totalPoints,
              level: freshData.stats.level,
              achievements: freshData.stats.achievements,
              generationCount: freshData.stats.generationCount
            }
            this.currentUser = updatedUser
            return { user: updatedUser, newAchievements }
          }
        }
      }

      return { user: null, newAchievements }
    } catch (error) {
      console.error('Error updating user points:', error)
      return { user: null, newAchievements: [] }
    }
  }

  async incrementGenerationCount(userId: string): Promise<void> {
    try {
      const response = await fetch('/api/user/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'increment_generation'
        }),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.stats && this.currentUser?.id === userId) {
          this.currentUser = {
            ...this.currentUser,
            generationCount: data.stats.generationCount
          }
        }
      }
    } catch (error) {
      console.error('Error incrementing generation count:', error)
    }
  }

  async loadUserStats(): Promise<void> {
    try {
      // Update login streak
      await fetch('/api/user/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_login'
        }),
        credentials: 'include'
      })

      // Load current stats
      const response = await fetch('/api/user/stats', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.stats && this.currentUser) {
          this.currentUser = {
            ...this.currentUser,
            totalPoints: data.stats.totalPoints,
            level: data.stats.level,
            achievements: data.stats.achievements,
            generationCount: data.stats.generationCount
          }
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }
}

export const authService = AuthService.getInstance()