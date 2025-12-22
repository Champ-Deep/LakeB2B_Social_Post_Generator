import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthState, LoginCredentials, RegisterCredentials } from '../types/auth'
import { authService } from '../services/authService'
import { useToast } from '@chakra-ui/react'

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>
  loginWithLinkedIn: () => Promise<boolean>
  register: (credentials: RegisterCredentials) => Promise<boolean>
  logout: () => Promise<void>
  addPoints: (points: number) => Promise<void>
  incrementGeneration: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })
  const toast = useToast()

  useEffect(() => {
    // Check if user is already logged in
    const initAuth = async () => {
      try {
        const user = await authService.verifyToken()
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: !!user
        })
      } catch (error) {
        console.error('Auth init error:', error)
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      }
    }

    initAuth()

    // Set up auth state change listener for Supabase
    const unsubscribe = authService.onAuthStateChange((user) => {
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: !!user
      })
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))

    try {
      const response = await authService.login(credentials)

      if (response.success && response.user) {
        setAuthState({
          user: response.user,
          isLoading: false,
          isAuthenticated: true
        })

        toast({
          title: 'Welcome back!',
          description: response.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })

        return true
      } else {
        toast({
          title: 'Login Failed',
          description: response.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })

        setAuthState(prev => ({ ...prev, isLoading: false }))
        return false
      }
    } catch (error) {
      toast({
        title: 'Login Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })

      setAuthState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }

  const loginWithLinkedIn = async (): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))

    try {
      const result = await authService.loginWithLinkedIn()

      if (!result.success) {
        toast({
          title: 'LinkedIn Login Failed',
          description: result.error || 'Failed to connect with LinkedIn',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return false
      }

      // OAuth flow will redirect, so we don't need to update state here
      return true
    } catch (error) {
      toast({
        title: 'LinkedIn Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }

  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))

    try {
      const response = await authService.register(credentials)

      if (response.success) {
        if (response.user) {
          setAuthState({
            user: response.user,
            isLoading: false,
            isAuthenticated: true
          })

          toast({
            title: 'Welcome to LakeB2B!',
            description: response.message,
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
        } else {
          // Email confirmation required
          toast({
            title: 'Check your email',
            description: response.message || 'Please confirm your email to complete registration',
            status: 'info',
            duration: 5000,
            isClosable: true,
          })
          setAuthState(prev => ({ ...prev, isLoading: false }))
        }

        return true
      } else {
        toast({
          title: 'Registration Failed',
          description: response.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })

        setAuthState(prev => ({ ...prev, isLoading: false }))
        return false
      }
    } catch (error) {
      toast({
        title: 'Registration Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })

      setAuthState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }

  const logout = async (): Promise<void> => {
    await authService.logout()
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false
    })

    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  const addPoints = async (points: number): Promise<void> => {
    if (!authState.user) return

    const result = await authService.updateUserPoints(authState.user.id, points)
    if (result.user) {
      setAuthState(prev => ({
        ...prev,
        user: result.user
      }))

      // Show achievement notifications
      for (const achievement of result.newAchievements) {
        toast({
          title: `🏆 Achievement Unlocked!`,
          description: `${achievement.name}: ${achievement.description} (+${achievement.points} bonus points)`,
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top-right'
        })
      }
    }
  }

  const incrementGeneration = async (): Promise<void> => {
    if (!authState.user) return

    await authService.incrementGenerationCount(authState.user.id)
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? {
        ...prev.user,
        generationCount: (prev.user.generationCount || 0) + 1
      } : null
    }))
  }

  const value: AuthContextType = {
    ...authState,
    login,
    loginWithLinkedIn,
    register,
    logout,
    addPoints,
    incrementGeneration
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
