/**
 * Post History API Endpoint
 *
 * GET /api/posts/history - Get user's post history
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 50)
 * - style: Filter by style (optional)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db/client'
import { isDatabaseConfigured } from '../../../lib/db/types'
import { getSessionFromRequest } from '../../../lib/auth/middleware'
import { rateLimitCheck, applyRateLimitHeaders, RATE_LIMITS } from '../../../lib/rateLimit'
import type { Prisma } from '@prisma/client'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check authentication
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to view post history',
      code: 'UNAUTHORIZED'
    })
  }

  // Apply rate limiting
  const rateLimitResult = rateLimitCheck(req, RATE_LIMITS.API_GENERAL, authResult.user.id)
  applyRateLimitHeaders(res, RATE_LIMITS.API_GENERAL.max, rateLimitResult.remaining, rateLimitResult.resetTime)

  if (rateLimitResult.limited) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: RATE_LIMITS.API_GENERAL.message,
      retryAfter: rateLimitResult.retryAfter,
      code: 'RATE_LIMITED'
    })
  }

  // Check if database is configured
  if (!isDatabaseConfigured()) {
    return res.status(200).json({
      posts: [],
      total: 0,
      page: 1,
      limit: 10,
      hasMore: false,
      message: 'Database not configured'
    })
  }

  try {
    // Parse query parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10))
    const style = req.query.style as string | undefined
    const offset = (page - 1) * limit

    // Build where clause
    const where: Prisma.PostWhereInput = {
      userId: authResult.user.id,
      ...(style ? { style } : {}),
    }

    // Get total count
    const total = await prisma.post.count({ where })

    // Get posts
    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    })

    const hasMore = offset + limit < total

    // Map to expected format
    const formattedPosts = posts.map(post => ({
      id: post.id,
      user_id: post.userId,
      image_url: post.imageUrl || post.imagePath,
      prompt: post.prompt,
      headline: post.headline,
      style: post.style,
      meme_format: post.memeFormat,
      size: post.size,
      logo_position: post.logoPosition,
      logo_size: post.logoSize,
      logo_opacity: post.logoOpacity,
      logo_rotation: post.logoRotation,
      is_public: post.isPublic,
      likes_count: post.likesCount,
      views_count: post.viewsCount,
      created_at: post.createdAt.toISOString(),
    }))

    return res.status(200).json({
      posts: formattedPosts,
      total,
      page,
      limit,
      hasMore
    })

  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    console.error('Post history error:', errorObj.message)

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined
    })
  }
}
