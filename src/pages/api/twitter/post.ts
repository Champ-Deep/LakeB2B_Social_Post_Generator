/**
 * Twitter Post API
 *
 * POST /api/twitter/post - Post an image to Twitter/X
 *
 * Request body:
 * - imageData: Base64 encoded image data (data URL or raw base64)
 * - tweetText: Text content for the tweet (max 280 characters)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '../../../lib/auth/middleware'
import { twitterService, isTwitterConfigured } from '../../../services/twitterService'
import { rateLimitCheck, applyRateLimitHeaders, RATE_LIMITS } from '../../../lib/rateLimit'
import { z } from 'zod'

// Maximum tweet length
const MAX_TWEET_LENGTH = 280

// Request validation schema
const postSchema = z.object({
  imageData: z.string().min(1, 'Image data is required'),
  tweetText: z.string()
    .min(1, 'Tweet text is required')
    .max(MAX_TWEET_LENGTH, `Tweet text cannot exceed ${MAX_TWEET_LENGTH} characters`),
})

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check if Twitter is configured
  if (!isTwitterConfigured()) {
    return res.status(503).json({
      error: 'Twitter integration not configured',
      code: 'NOT_CONFIGURED',
    })
  }

  // Check authentication
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to post to Twitter',
      code: 'UNAUTHORIZED',
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
      code: 'RATE_LIMITED',
    })
  }

  try {
    // Validate request body
    const validation = postSchema.safeParse(req.body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return res.status(400).json({
        error: firstError?.message || 'Invalid request',
        code: 'VALIDATION_ERROR',
      })
    }

    const { imageData, tweetText } = validation.data

    // Check if user is connected to Twitter
    const isConnected = await twitterService.isConnected(authResult.user.id)
    if (!isConnected) {
      return res.status(400).json({
        error: 'Not connected to Twitter',
        message: 'Please connect your Twitter account first',
        code: 'NOT_CONNECTED',
      })
    }

    // Convert base64 to buffer
    let imageBuffer: Buffer
    try {
      let base64Data = imageData
      if (imageData.includes(',')) {
        base64Data = imageData.split(',')[1]
      }
      imageBuffer = Buffer.from(base64Data, 'base64')
    } catch {
      return res.status(400).json({
        error: 'Invalid image data format',
        code: 'INVALID_IMAGE',
      })
    }

    // Post to Twitter
    const result = await twitterService.postWithImage(
      authResult.user.id,
      tweetText,
      imageBuffer
    )

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to post to Twitter',
        code: 'POST_FAILED',
      })
    }

    return res.status(200).json({
      success: true,
      tweetId: result.tweetId,
      tweetUrl: result.tweetUrl,
      message: 'Successfully posted to Twitter',
    })
  } catch (error) {
    console.error('Twitter post error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.message
        : undefined,
    })
  }
}
