/**
 * Better-Auth Client
 *
 * Client-side authentication utilities for React components.
 */

import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined'
    ? window.location.origin
    : process.env.BETTER_AUTH_URL || 'http://localhost:3000',
})

// Export convenience methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient
