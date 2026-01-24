import { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth'
import { rewardsService } from './rewardsService'
import { authClient, signIn, signUp, signOut, getSession } from '../lib/auth/client'

/**
 * AuthService - Client-side authentication using Better-Auth
 *
 * Handles user login, logout, and session management.
 * Works with the Better-Auth backend at /api/auth/[...all].ts
 */
export class AuthService {
  private static instance: AuthService
  private currentUser: User | null = null

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  /**
   * Map Better-Auth session to our User interface
   */
  private mapSessionToUser(session: { user: { id: string; email: string; name?: string | null } }): User {
    const user = session.user
    return {
      id: user.id,
      email: user.email || '',
      name: user.name || user.email?.split('@')[0] || 'User',
      totalPoints: 0,
      level: 1,
      achievements: [],
      generationCount: 0
    }
  }

  /**
   * Login with email and password
   * Uses Better-Auth for all authentication
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials

    if (!email || !password) {
      return { success: false, error: 'Email and password are required' }
    }

    const emailLower = email.toLowerCase().trim()

    try {
      // Use Better-Auth signIn
      const result = await signIn.email({
        email: emailLower,
        password,
      })

      if (result.error) {
        return {
          success: false,
          error: result.error.message || 'Login failed'
        }
      }

      if (!result.data?.user) {
        return { success: false, error: 'Login failed - no user returned' }
      }

      // Map session to user
      this.currentUser = {
        id: result.data.user.id,
        email: result.data.user.email || '',
        name: result.data.user.name || result.data.user.email?.split('@')[0] || 'User',
        totalPoints: 0,
        level: 1,
        achievements: [],
        generationCount: 0
      }

      // Load user stats from API
      await this.loadUserStats()

      return {
        success: true,
        user: this.currentUser,
        message: 'Login successful'
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  /**
   * Register new user with Better-Auth
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { email, password, name } = credentials

    if (!email || !password) {
      return { success: false, error: 'Email and password are required' }
    }

    const emailLower = email.toLowerCase().trim()

    // Validate LakeB2B email domain
    if (!emailLower.includes('lakeb2b')) {
      return {
        success: false,
        error: 'Registration is only available for LakeB2B employees'
      }
    }

    try {
      // Use Better-Auth signUp
      const result = await signUp.email({
        email: emailLower,
        password,
        name: name || emailLower.split('@')[0],
      })

      if (result.error) {
        return {
          success: false,
          error: result.error.message || 'Registration failed'
        }
      }

      if (!result.data?.user) {
        return { success: false, error: 'Registration failed - no user returned' }
      }

      // Map session to user
      this.currentUser = {
        id: result.data.user.id,
        email: result.data.user.email || '',
        name: result.data.user.name || result.data.user.email?.split('@')[0] || 'User',
        totalPoints: 0,
        level: 1,
        achievements: [],
        generationCount: 0
      }

      return {
        success: true,
        user: this.currentUser,
        message: 'Registration successful'
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  /**
   * Login with LinkedIn OAuth
   * Note: This redirects to the LinkedIn OAuth connect flow
   */
  async loginWithLinkedIn(): Promise<{ success: boolean; error?: string }> {
    try {
      // Redirect to LinkedIn OAuth connect endpoint
      window.location.href = '/api/auth/linkedin/connect?returnUrl=' + encodeURIComponent(window.location.pathname)
      return { success: true }
    } catch (error) {
      console.error('LinkedIn login error:', error)
      return { success: false, error: 'Failed to initiate LinkedIn login' }
    }
  }

  /**
   * Logout - clear Better-Auth session
   */
  async logout(): Promise<void> {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
    this.currentUser = null
  }

  /**
   * Get current user from memory
   */
  getCurrentUser(): User | null {
    return this.currentUser
  }

  /**
   * Get current session from Better-Auth
   */
  async getSession(): Promise<{ user: { id: string; email: string; name?: string | null } } | null> {
    try {
      const session = await getSession()
      return session.data || null
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  }

  /**
   * Verify and restore session
   * Checks Better-Auth session
   */
  async verifyToken(): Promise<User | null> {
    try {
      const session = await getSession()

      if (!session.data?.user) {
        this.currentUser = null
        return null
      }

      this.currentUser = this.mapSessionToUser(session.data)

      // Load user stats
      await this.loadUserStats()

      return this.currentUser
    } catch (error) {
      console.error('Token verification error:', error)
      this.currentUser = null
      return null
    }
  }

  /**
   * Set up auth state change listener
   * Note: Better-Auth doesn't have built-in state change listener like Supabase
   * We poll the session periodically or use React hooks (useSession)
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    // For Better-Auth, we use a simple polling approach or React hooks
    // Return a no-op unsubscribe function
    // In practice, use the useSession hook in React components

    let cancelled = false

    const checkSession = async () => {
      if (cancelled) return

      try {
        const session = await getSession()
        if (session.data?.user) {
          this.currentUser = this.mapSessionToUser(session.data)
          callback(this.currentUser)
        } else {
          this.currentUser = null
          callback(null)
        }
      } catch {
        // Ignore errors during polling
      }
    }

    // Initial check
    checkSession()

    // Poll every 30 seconds
    const interval = setInterval(checkSession, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
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
