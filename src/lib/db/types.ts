/**
 * Database Types
 *
 * Re-exports Prisma types and provides utility types for the application.
 */

import type {
  User,
  Session,
  Account,
  Verification,
  UserProfile,
  Post,
  PostLike,
  PostView,
  LinkedInConnection,
  ScheduledPost,
  PointsHistory,
  GameSession,
} from '@prisma/client'

// Re-export Prisma types
export type {
  User,
  Session,
  Account,
  Verification,
  UserProfile,
  Post,
  PostLike,
  PostView,
  LinkedInConnection,
  ScheduledPost,
  PointsHistory,
  GameSession,
}

// ============================================
// Create/Insert Types (without auto-generated fields)
// ============================================

export type NewUserProfile = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>
export type NewPost = Omit<Post, 'id' | 'createdAt' | 'likesCount' | 'viewsCount'>
export type NewPostLike = Omit<PostLike, 'id' | 'createdAt'>
export type NewPostView = Omit<PostView, 'id' | 'viewedAt'>
export type NewLinkedInConnection = Omit<LinkedInConnection, 'id' | 'createdAt' | 'updatedAt'>
export type NewScheduledPost = Omit<ScheduledPost, 'id' | 'createdAt' | 'publishedAt'>
export type NewPointsHistory = Omit<PointsHistory, 'id' | 'createdAt'>
export type NewGameSession = Omit<GameSession, 'id' | 'createdAt'>

// ============================================
// Update Types (partial without immutable fields)
// ============================================

export type UpdateUserProfile = Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt'>>
export type UpdatePost = Partial<Omit<Post, 'id' | 'userId' | 'createdAt'>>
export type UpdateLinkedInConnection = Partial<Omit<LinkedInConnection, 'id' | 'userId' | 'createdAt'>>
export type UpdateScheduledPost = Partial<Omit<ScheduledPost, 'id' | 'userId' | 'createdAt'>>

// ============================================
// JSON Field Helpers (SQLite stores JSON as string)
// ============================================

/**
 * Parse a JSON string field to its typed value
 */
export function parseJsonField<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue
  try {
    return JSON.parse(jsonString) as T
  } catch {
    return defaultValue
  }
}

/**
 * Stringify a value for storage in a JSON field
 */
export function stringifyJsonField<T>(value: T): string {
  return JSON.stringify(value)
}

/**
 * Parse achievements array from string
 */
export function parseAchievements(achievements: string): string[] {
  return parseJsonField<string[]>(achievements, [])
}

/**
 * Parse metadata object from string
 */
export function parseMetadata<T = Record<string, unknown>>(metadata: string): T {
  return parseJsonField<T>(metadata, {} as T)
}

// ============================================
// Utility Checks
// ============================================

/**
 * Check if database is configured
 */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}
