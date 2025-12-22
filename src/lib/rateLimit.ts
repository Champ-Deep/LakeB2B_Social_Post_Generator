/**
 * Rate Limiting Utility
 *
 * Provides in-memory rate limiting using LRU cache.
 * For production with multiple instances, use Upstash Redis instead.
 */

import { LRUCache } from 'lru-cache'
import type { NextApiRequest, NextApiResponse } from 'next'

interface RateLimitOptions {
  /** Time window in milliseconds */
  windowMs: number
  /** Maximum number of requests per window */
  max: number
  /** Key prefix for namespacing */
  keyPrefix?: string
  /** Custom message when rate limited */
  message?: string
}

interface RateLimitInfo {
  count: number
  resetTime: number
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // Image generation - 10 per hour for authenticated users
  IMAGE_GENERATION_AUTH: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    keyPrefix: 'gen-auth',
    message: 'Too many image generation requests. Please try again later.'
  },
  // Image generation - 5 per hour for unauthenticated (by IP)
  IMAGE_GENERATION_ANON: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    keyPrefix: 'gen-anon',
    message: 'Too many image generation requests. Please log in for higher limits.'
  },
  // API requests - general rate limit
  API_GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    keyPrefix: 'api',
    message: 'Too many API requests. Please try again later.'
  },
  // Login attempts - prevent brute force
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    keyPrefix: 'login',
    message: 'Too many login attempts. Please try again later.'
  },
  // LinkedIn posting - conservative daily limit
  LINKEDIN_POST: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 25, // LinkedIn allows ~100/day, we use 25 to be safe
    keyPrefix: 'linkedin-post',
    message: 'Daily LinkedIn posting limit reached. Please try again tomorrow.'
  }
} as const

// Create LRU cache for storing rate limit data
// Max 10,000 entries, TTL of 1 hour
const rateLimitCache = new LRUCache<string, RateLimitInfo>({
  max: 10000,
  ttl: 60 * 60 * 1000 // 1 hour
})

/**
 * Get the rate limit key for a request
 * Uses user ID if authenticated, otherwise falls back to IP
 */
export function getRateLimitKey(
  req: NextApiRequest,
  keyPrefix: string,
  userId?: string
): string {
  if (userId) {
    return `${keyPrefix}:user:${userId}`
  }

  // Get IP address from various headers (Vercel, Cloudflare, etc.)
  const forwardedFor = req.headers['x-forwarded-for']
  const realIp = req.headers['x-real-ip']
  const cfConnectingIp = req.headers['cf-connecting-ip']

  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0] ||
      (realIp as string) ||
      (cfConnectingIp as string) ||
      req.socket?.remoteAddress ||
      'unknown'

  return `${keyPrefix}:ip:${ip}`
}

/**
 * Check if a request is rate limited
 * Returns remaining requests and reset time
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): { limited: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  let info = rateLimitCache.get(key)

  // If no existing info or window has expired, create new entry
  if (!info || info.resetTime <= now) {
    info = {
      count: 1,
      resetTime: now + options.windowMs
    }
    rateLimitCache.set(key, info)
    return {
      limited: false,
      remaining: options.max - 1,
      resetTime: info.resetTime
    }
  }

  // Increment count
  info.count++
  rateLimitCache.set(key, info)

  // Check if over limit
  const limited = info.count > options.max
  const remaining = Math.max(0, options.max - info.count)

  return {
    limited,
    remaining,
    resetTime: info.resetTime
  }
}

/**
 * Rate limiting middleware for API routes
 * Use this as a wrapper for your API handler
 */
export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: RateLimitOptions,
  getUserId?: (req: NextApiRequest) => string | undefined
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const userId = getUserId?.(req)
    const key = getRateLimitKey(req, options.keyPrefix || 'default', userId)
    const result = checkRateLimit(key, options)

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', options.max)
    res.setHeader('X-RateLimit-Remaining', result.remaining)
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000))

    if (result.limited) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
      res.setHeader('Retry-After', retryAfter)

      return res.status(429).json({
        error: 'Too Many Requests',
        message: options.message || 'Rate limit exceeded. Please try again later.',
        retryAfter,
        code: 'RATE_LIMITED'
      })
    }

    return handler(req, res)
  }
}

/**
 * Simple rate limit check for use within handlers
 * Returns rate limit info without automatically responding
 */
export function rateLimitCheck(
  req: NextApiRequest,
  options: RateLimitOptions,
  userId?: string
): { limited: boolean; remaining: number; resetTime: number; retryAfter?: number } {
  const key = getRateLimitKey(req, options.keyPrefix || 'default', userId)
  const result = checkRateLimit(key, options)

  if (result.limited) {
    return {
      ...result,
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
    }
  }

  return result
}

/**
 * Apply rate limit headers to response
 */
export function applyRateLimitHeaders(
  res: NextApiResponse,
  limit: number,
  remaining: number,
  resetTime: number
): void {
  res.setHeader('X-RateLimit-Limit', limit)
  res.setHeader('X-RateLimit-Remaining', remaining)
  res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000))
}

/**
 * Clear rate limit for a specific key (useful for testing or admin actions)
 */
export function clearRateLimit(key: string): boolean {
  return rateLimitCache.delete(key)
}

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(key: string): RateLimitInfo | undefined {
  return rateLimitCache.get(key)
}
