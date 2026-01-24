/**
 * Image Upload API
 *
 * POST /api/images/upload - Upload an image to Cloudinary
 *
 * Provides cloud-based storage with CDN delivery.
 * Falls back to local storage if Cloudinary is not configured.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '../../../lib/auth/middleware'
import { rateLimitCheck, applyRateLimitHeaders, RATE_LIMITS } from '../../../lib/rateLimit'
import {
  isCloudinaryConfigured,
  uploadBase64ToCloudinary,
  getOptimizedUrl,
  getSocialMediaUrl,
} from '../../../lib/storage/cloudinary'
import { saveImage } from '../../../lib/storage/imageStorage'
import { z } from 'zod'

// Request validation schema
const uploadSchema = z.object({
  imageData: z.string().min(1, 'Image data is required'),
  folder: z.string().optional(),
  tags: z.array(z.string()).optional(),
  publicId: z.string().optional(),
  platform: z.enum(['linkedin', 'twitter', 'facebook', 'instagram', 'general']).optional(),
})

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb', // Allow for base64 overhead
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

  // Check authentication
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to upload images',
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
    const validation = uploadSchema.safeParse(req.body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return res.status(400).json({
        error: firstError?.message || 'Invalid request',
        code: 'VALIDATION_ERROR',
      })
    }

    const { imageData, folder, tags, publicId, platform } = validation.data

    // Try Cloudinary first, fall back to local storage
    if (isCloudinaryConfigured()) {
      const cloudinaryResult = await uploadBase64ToCloudinary(imageData, {
        folder: folder || `lakeb2b-posts/${authResult.user.id}`,
        tags: tags || ['lakeb2b', 'user-upload'],
        publicId,
      })

      if (cloudinaryResult.success && cloudinaryResult.publicId) {
        // Generate optimized URLs for different use cases
        const urls: Record<string, string> = {
          original: cloudinaryResult.secureUrl || cloudinaryResult.url || '',
          optimized: getOptimizedUrl(cloudinaryResult.publicId, {
            quality: 'auto:good',
            format: 'auto',
          }),
        }

        // Add platform-specific URL if requested
        if (platform && platform !== 'general') {
          urls[platform] = getSocialMediaUrl(cloudinaryResult.publicId, platform)
        }

        return res.status(200).json({
          success: true,
          storage: 'cloudinary',
          publicId: cloudinaryResult.publicId,
          url: cloudinaryResult.secureUrl || cloudinaryResult.url,
          urls,
          format: cloudinaryResult.format,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          bytes: cloudinaryResult.bytes,
          message: 'Image uploaded to Cloudinary successfully',
        })
      }

      // Log Cloudinary error but fall back to local storage
      console.warn('Cloudinary upload failed, falling back to local storage:', cloudinaryResult.error)
    }

    // Fall back to local storage
    const localResult = await saveImage(imageData, authResult.user.id)

    if (!localResult.success) {
      return res.status(500).json({
        error: 'Failed to save image',
        message: localResult.error,
        code: 'UPLOAD_FAILED',
      })
    }

    return res.status(200).json({
      success: true,
      storage: 'local',
      url: localResult.publicUrl,
      filename: localResult.filename,
      message: isCloudinaryConfigured()
        ? 'Image saved locally (Cloudinary upload failed)'
        : 'Image saved locally (Cloudinary not configured)',
    })
  } catch (error) {
    console.error('Image upload error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.message
        : undefined,
    })
  }
}
