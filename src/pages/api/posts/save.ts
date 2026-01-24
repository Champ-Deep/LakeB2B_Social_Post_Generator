/**
 * Save Post API Endpoint
 *
 * POST /api/posts/save - Save a generated post to the database
 *
 * This endpoint stores the generated post in SQLite via Prisma for:
 * - User post history
 * - Community gallery (if made public)
 * - Analytics tracking
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '../../../lib/auth/middleware'
import { prisma } from '../../../lib/db/client'
import { isDatabaseConfigured } from '../../../lib/db/types'
import { saveImage } from '../../../lib/storage/imageStorage'
import { rateLimitCheck, applyRateLimitHeaders, RATE_LIMITS } from '../../../lib/rateLimit'
import { validateSavePostRequest } from '../../../lib/schemas'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check authentication using Supabase
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to save posts',
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
      success: true,
      persisted: false,
      message: 'Post generated but not saved (database not configured)'
    })
  }

  try {
    // Validate request body with Zod schema
    const validationResult = validateSavePostRequest(req.body)

    if (!validationResult.success) {
      return res.status(400).json(validationResult.error)
    }

    const {
      imageUrl,
      prompt,
      headline,
      style,
      memeFormat,
      size,
      logoPosition,
      logoSize,
      logoOpacity,
      logoRotation,
      isPublic
    } = validationResult.data

    // Save image to local storage if it's base64 data
    let imagePath = imageUrl
    let publicUrl = imageUrl

    if (imageUrl.startsWith('data:image/')) {
      const saveResult = await saveImage(imageUrl, authResult.user.id)
      if (!saveResult.success) {
        return res.status(500).json({
          error: 'Failed to save image',
          message: saveResult.error,
          code: 'IMAGE_SAVE_ERROR'
        })
      }
      imagePath = saveResult.filePath!
      publicUrl = saveResult.publicUrl!
    }

    // Insert post into database
    const post = await prisma.post.create({
      data: {
        userId: authResult.user.id,
        imagePath: imagePath,
        imageUrl: publicUrl,
        prompt: prompt,
        headline: headline || null,
        style: style,
        memeFormat: memeFormat || null,
        size: size || null,
        logoPosition: logoPosition || null,
        logoSize: logoSize ?? null,
        logoOpacity: logoOpacity ?? null,
        logoRotation: logoRotation ?? null,
        isPublic: isPublic,
      },
    })

    // Update user's generation count
    try {
      await prisma.userProfile.update({
        where: { userId: authResult.user.id },
        data: {
          generationCount: { increment: 1 },
          weeklyGenerationCount: { increment: 1 },
        },
      })
    } catch (profileError) {
      console.warn('Failed to update generation count:', profileError)
      // Don't fail the request, user profile might not exist yet
    }

    return res.status(200).json({
      success: true,
      persisted: true,
      post: {
        id: post.id,
        image_url: post.imageUrl,
        prompt: post.prompt,
        headline: post.headline,
        style: post.style,
        created_at: post.createdAt.toISOString(),
      },
      message: 'Post saved successfully'
    })

  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    console.error('Save post error:', errorObj.message)

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined
    })
  }
}
