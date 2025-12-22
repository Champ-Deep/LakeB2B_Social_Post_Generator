import { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth'
import { rewardsService } from './rewardsService'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient, Session } from '@supabase/supabase-js'

// Singleton Supabase client instance
let supabaseClientInstance: SupabaseClient | null = null

/**
 * Create Supabase client for browser
 * Uses @supabase/ssr which automatically handles cookie storage
 * The middleware handles session refresh on server-side requests
 */
function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration is missing. Auth features will be disabled.')
    return null
  }

  // Return existing instance if already created
  if (supabaseClientInstance) {
    return supabaseClientInstance
  }

  // Create browser client - @supabase/ssr automatically handles cookie storage
  // No custom cookie handlers needed - the library handles it correctly by default
  supabaseClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)

  return supabaseClientInstance
}

export class AuthService {
  private static instance: AuthService
  private currentUser: User | null = null
  private supabase: SupabaseClient | null = null

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  private getClient(): SupabaseClient | null {
    if (!this.supabase) {
      this.supabase = getSupabaseClient()
    }
    return this.supabase
  }

  /**
   * Map Supabase session to our User interface
   */
  private mapSessionToUser(session: Session): User {
    const user = session.user
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      totalPoints: 0,
      level: 1,
      achievements: [],
      generationCount: 0
    }
  }

  /**
   * Login with email and password
   * Uses custom LakeB2B API for lakeb2b emails, Supabase for others
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials

    if (!email || !password) {
      return { success: false, error: 'Email and password are required' }
    }

    const emailLower = email.toLowerCase().trim()

    // Check if this is a lakeb2b email - use custom API
    if (emailLower.includes('lakeb2b')) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailLower, password }),
          credentials: 'include'
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          return { success: false, error: data.error || 'Login failed' }
        }

        // Set current user from API response
        this.currentUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          totalPoints: 0,
          level: 1,
          achievements: [],
          generationCount: 0
        }

        return {
          success: true,
          user: this.currentUser,
          message: 'Login successful'
        }
      } catch (error) {
        console.error('LakeB2B login error:', error)
        return { success: false, error: 'Network error. Please try again.' }
      }
    }

    // Use Supabase for non-lakeb2b emails
    try {
      const supabase = this.getClient()
      if (!supabase) {
        return { success: false, error: 'Authentication service is not configured' }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data.session) {
        return { success: false, error: 'Login failed - no session returned' }
      }

      this.currentUser = this.mapSessionToUser(data.session)

      // Load user stats from profile
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
   * Register new user with Supabase
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { email, password, name } = credentials

    if (!email || !password) {
      return { success: false, error: 'Email and password are required' }
    }

    try {
      const supabase = this.getClient()
      if (!supabase) {
        return { success: false, error: 'Authentication service is not configured' }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0]
          }
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data.session) {
        // Email confirmation required
        return {
          success: true,
          message: 'Please check your email to confirm your account'
        }
      }

      this.currentUser = this.mapSessionToUser(data.session)

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
   */
  async loginWithLinkedIn(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = this.getClient()
      if (!supabase) {
        return { success: false, error: 'Authentication service is not configured' }
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          scopes: 'openid profile email'
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('LinkedIn login error:', error)
      return { success: false, error: 'Failed to initiate LinkedIn login' }
    }
  }

  /**
   * Logout - clear both LakeB2B and Supabase sessions
   */
  async logout(): Promise<void> {
    try {
      // Clear lakeb2b_token cookie
      if (typeof document !== 'undefined') {
        document.cookie = 'lakeb2b_token=; Path=/; Max-Age=0'
      }

      // Logout from Supabase
      const supabase = this.getClient()
      if (supabase) {
        await supabase.auth.signOut()
      }
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
   * Get current session from Supabase
   */
  async getSession(): Promise<Session | null> {
    try {
      const supabase = this.getClient()
      if (!supabase) {
        return null
      }
      const { data: { session } } = await supabase.auth.getSession()
      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  }

  /**
   * Verify and restore session
   * Checks both LakeB2B tokens and Supabase sessions
   */
  async verifyToken(): Promise<User | null> {
    try {
      // First check for lakeb2b_token cookie
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        const lakeb2bCookie = cookies.find(c => c.trim().startsWith('lakeb2b_token='))
        if (lakeb2bCookie) {
          // Verify the token via API
          try {
            const response = await fetch('/api/auth/verify', {
              method: 'GET',
              credentials: 'include'
            })
            if (response.ok) {
              const data = await response.json()
              if (data.success && data.user) {
                this.currentUser = {
                  id: data.user.id,
                  email: data.user.email,
                  name: data.user.name,
                  totalPoints: 0,
                  level: 1,
                  achievements: [],
                  generationCount: 0
                }
                return this.currentUser
              }
            }
          } catch (verifyError) {
            console.error('LakeB2B token verification error:', verifyError)
          }
        }
      }

      // Then check Supabase session
      const supabase = this.getClient()
      if (!supabase) {
        this.currentUser = null
        return null
      }
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        this.currentUser = null
        return null
      }

      this.currentUser = this.mapSessionToUser(session)

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
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    const supabase = this.getClient()
    if (!supabase) {
      // Return a no-op unsubscribe function when Supabase is not configured
      return () => {}
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          this.currentUser = this.mapSessionToUser(session)
          await this.loadUserStats()
          callback(this.currentUser)
        } else {
          this.currentUser = null
          callback(null)
        }
      }
    )

    return () => subscription.unsubscribe()
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
