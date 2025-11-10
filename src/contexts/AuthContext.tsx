import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthState, LoginCredentials, RegisterCredentials } from '../types/auth'
import { authService } from '../services/authService'
import { useToast } from '@chakra-ui/react'

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>
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
    // Check if user is already logged in (in a real app, check localStorage/cookies)
    const currentUser = authService.getCurrentUser()
    setAuthState({
      user: currentUser,
      isLoading: false,
      isAuthenticated: !!currentUser
    })
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

  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const response = await authService.register(credentials)
      
      if (response.success && response.user) {
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
    register,
    logout,
    addPoints,
    incrementGeneration
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}