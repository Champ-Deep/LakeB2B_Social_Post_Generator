/**
 * Community Posts API Endpoint
 *
 * GET /api/posts - Get public community posts for the gallery
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 12, max: 50)
 * - style: Filter by style (optional)
 * - sort: Sort order - 'recent', 'popular', 'trending' (default: 'recent')
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db/client'
import { isDatabaseConfigured } from '../../../lib/db/types'
import { rateLimitCheck, applyRateLimitHeaders, RATE_LIMITS } from '../../../lib/rateLimit'
import type { Prisma } from '@prisma/client'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Apply rate limiting (no auth required for public posts)
  const rateLimitResult = rateLimitCheck(req, RATE_LIMITS.API_GENERAL)
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
      limit: 12,
      hasMore: false,
      message: 'Database not configured'
    })
  }

  try {
    // Parse query parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12))
    const style = req.query.style as string | undefined
    const sort = (req.query.sort as string) || 'recent'
    const offset = (page - 1) * limit

    // Build where clause
    const where: Prisma.PostWhereInput = {
      isPublic: true,
      ...(style ? { style } : {}),
    }

    // Determine sort order
    let orderBy: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[]
    switch (sort) {
      case 'popular':
        orderBy = { likesCount: 'desc' }
        break
      case 'trending':
        orderBy = [{ likesCount: 'desc' }, { createdAt: 'desc' }]
        break
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' }
    }

    // Get total count
    const total = await prisma.post.count({ where })

    // Get posts
    const posts = await prisma.post.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
    })

    const hasMore = offset + limit < total

    // Return posts with limited user info for privacy
    const sanitizedPosts = posts.map(post => ({
      id: post.id,
      image_url: post.imageUrl || post.imagePath,
      prompt: post.prompt,
      headline: post.headline,
      style: post.style,
      meme_format: post.memeFormat,
      created_at: post.createdAt.toISOString(),
      likes_count: post.likesCount,
      views_count: post.viewsCount
      // Note: user_id is not included for privacy
    }))

    return res.status(200).json({
      posts: sanitizedPosts,
      total,
      page,
      limit,
      hasMore,
      sort
    })

  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    console.error('Community posts error:', errorObj.message)

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined
    })
  }
}
