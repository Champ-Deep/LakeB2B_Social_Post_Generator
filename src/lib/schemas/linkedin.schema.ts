/**
 * LinkedIn API Validation Schemas
 *
 * Zod v4 schemas for validating LinkedIn-related API requests
 */

import { z } from 'zod'

// LinkedIn visibility options
export const LinkedInVisibility = ['PUBLIC', 'CONNECTIONS'] as const
export type LinkedInVisibilityType = typeof LinkedInVisibility[number]

// Maximum lengths
const MAX_POST_TEXT_LENGTH = 3000
const MAX_IMAGE_SIZE_MB = 10

/**
 * LinkedIn post request schema
 */
export const linkedinPostSchema = z.object({
  // Image data (base64 or data URL)
  imageData: z
    .string()
    .min(1, 'Image data is required')
    .refine(
      (val) => {
        // Basic validation - must be base64 or data URL
        const isDataUrl = val.startsWith('data:image/')
        const isBase64 = /^[A-Za-z0-9+/=]+$/.test(val.replace(/\s/g, ''))
        return isDataUrl || isBase64
      },
      { message: 'Invalid image data format. Must be base64 or data URL' }
    ),

  // Post text/caption
  postText: z
    .string()
    .min(1, 'Post text is required')
    .max(MAX_POST_TEXT_LENGTH, `Post text cannot exceed ${MAX_POST_TEXT_LENGTH} characters`)
    .transform(val => val.trim()),

  // Visibility setting
  visibility: z
    .enum(LinkedInVisibility)
    .default('PUBLIC'),
})

/**
 * LinkedIn schedule post schema
 */
export const linkedinScheduleSchema = z.object({
  imageData: z
    .string()
    .min(1, 'Image data is required'),

  postText: z
    .string()
    .min(1, 'Post text is required')
    .max(MAX_POST_TEXT_LENGTH, `Post text cannot exceed ${MAX_POST_TEXT_LENGTH} characters`)
    .transform(val => val.trim()),

  visibility: z
    .enum(LinkedInVisibility)
    .default('PUBLIC'),

  scheduledAt: z
    .string()
    .datetime({ message: 'Invalid datetime format. Use ISO 8601 format' })
    .refine(
      (val) => new Date(val) > new Date(),
      { message: 'Scheduled time must be in the future' }
    ),
})

/**
 * LinkedIn connection check response type
 */
export interface LinkedInConnectionStatus {
  connected: boolean
  expiresAt?: string
  profileName?: string
  profileUrl?: string
}

/**
 * Type inference from schemas
 */
export type LinkedInPostInput = z.infer<typeof linkedinPostSchema>
export type LinkedInScheduleInput = z.infer<typeof linkedinScheduleSchema>

/**
 * Response type for successful LinkedIn post
 */
export interface LinkedInPostResponse {
  success: boolean
  postId?: string
  postUrl?: string
  message: string
  error?: string
}

/**
 * Validation error response
 */
export interface ValidationErrorResponse {
  error: string
  code: string
  details?: Record<string, unknown>
}

/**
 * Helper function to validate LinkedIn post request
 */
export function validateLinkedInPostRequest(body: unknown): {
  success: true
  data: LinkedInPostInput
} | {
  success: false
  error: ValidationErrorResponse
} {
  const result = linkedinPostSchema.safeParse(body)

  if (!result.success) {
    const issues = result.error.issues
    const firstIssue = issues[0]
    const fieldPath = firstIssue?.path?.[0]?.toString().toUpperCase()

    // Map field names to error codes
    const codeMap: Record<string, string> = {
      IMAGEDATA: 'MISSING_IMAGE',
      POSTTEXT: 'MISSING_TEXT',
      VISIBILITY: 'INVALID_VISIBILITY',
    }

    return {
      success: false,
      error: {
        error: firstIssue?.message || 'Validation failed',
        code: codeMap[fieldPath || ''] || `INVALID_${fieldPath || 'INPUT'}`,
        details: { issues }
      }
    }
  }

  return {
    success: true,
    data: result.data
  }
}

/**
 * Helper to validate image buffer size
 */
export function validateImageSize(buffer: Buffer): {
  valid: boolean
  error?: string
} {
  const maxSizeBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024

  if (buffer.length > maxSizeBytes) {
    return {
      valid: false,
      error: `Image size exceeds maximum of ${MAX_IMAGE_SIZE_MB}MB`
    }
  }

  return { valid: true }
}
