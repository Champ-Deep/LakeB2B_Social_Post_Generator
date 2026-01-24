/**
 * LinkedIn Post API
 *
 * POST /api/linkedin/post - Post an image to LinkedIn
 *
 * Request body:
 * - imageData: Base64 encoded image data (data URL or raw base64)
 * - postText: Caption for the post (max 3000 characters)
 * - visibility: 'PUBLIC' | 'CONNECTIONS' (default: PUBLIC)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '../../../lib/auth/middleware'
import { linkedinService } from '../../../services/linkedinService'
import { rateLimitCheck, applyRateLimitHeaders, RATE_LIMITS } from '../../../lib/rateLimit'
import { validateLinkedInPostRequest, validateImageSize } from '../../../lib/schemas'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb' // Allow for base64 overhead
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check authentication
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to post to LinkedIn',
      code: 'UNAUTHORIZED'
    })
  }

  // Apply rate limiting
  const rateLimitResult = rateLimitCheck(req, RATE_LIMITS.LINKEDIN_POST, authResult.user.id)
  applyRateLimitHeaders(res, RATE_LIMITS.LINKEDIN_POST.max, rateLimitResult.remaining, rateLimitResult.resetTime)

  if (rateLimitResult.limited) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: RATE_LIMITS.LINKEDIN_POST.message,
      retryAfter: rateLimitResult.retryAfter,
      code: 'RATE_LIMITED'
    })
  }

  try {
    // Validate request body with Zod schema
    const validationResult = validateLinkedInPostRequest(req.body)

    if (!validationResult.success) {
      return res.status(400).json(validationResult.error)
    }

    const { imageData, postText, visibility } = validationResult.data

    // Convert base64 to buffer
    let imageBuffer: Buffer
    try {
      // Handle data URL format (data:image/png;base64,...)
      let base64Data = imageData
      if (imageData.includes(',')) {
        base64Data = imageData.split(',')[1]
      }
      imageBuffer = Buffer.from(base64Data, 'base64')
    } catch {
      return res.status(400).json({
        error: 'Invalid image data format',
        code: 'INVALID_IMAGE'
      })
    }

    // Check image size
    const sizeValidation = validateImageSize(imageBuffer)
    if (!sizeValidation.valid) {
      return res.status(400).json({
        error: sizeValidation.error,
        code: 'IMAGE_TOO_LARGE'
      })
    }

    // Post to LinkedIn
    const result = await linkedinService.postImageToLinkedIn(
      authResult.user.id,
      imageBuffer,
      postText.trim(),
      visibility
    )

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to post to LinkedIn',
        code: 'POST_FAILED'
      })
    }

    return res.status(200).json({
      success: true,
      postId: result.postId,
      postUrl: result.postUrl,
      message: 'Successfully posted to LinkedIn'
    })

  } catch (error) {
    console.error('LinkedIn post error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.message
        : undefined
    })
  }
}
