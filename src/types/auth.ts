export interface User {
  id: string
  email: string
  name: string
  totalPoints?: number
  level?: number
  achievements?: string[]
  generationCount?: number
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  message?: string
  error?: string
}