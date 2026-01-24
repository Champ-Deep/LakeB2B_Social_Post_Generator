/**
 * Auth Module Index
 *
 * Re-exports all auth utilities for convenient imports.
 */

// Server-side auth
export { auth } from './auth'
export type { Auth } from './auth'

// Auth middleware for API routes
export {
  getSessionFromRequest,
  requireAuth,
  ensureUserProfile,
  getLinkedInAuthUrl,
} from './middleware'
export type { AuthResult } from './middleware'

// Client-side auth (only import on client)
// Note: Import from './client' directly on client-side
