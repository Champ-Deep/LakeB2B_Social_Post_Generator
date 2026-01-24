/**
 * Posts API Validation Schemas
 *
 * Zod v4 schemas for validating post-related API requests
 */

import { z } from 'zod'

/**
 * Save post request schema
 */
export const savePostSchema = z.object({
  // Required fields
  imageUrl: z
    .string()
    .min(1, 'Image URL is required'),

  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(1000, 'Prompt cannot exceed 1000 characters'),

  style: z
    .string()
    .min(1, 'Style is required'),

  // Optional fields
  headline: z
    .string()
    .max(200, 'Headline cannot exceed 200 characters')
    .optional()
    .nullable(),

  memeFormat: z
    .string()
    .optional()
    .nullable(),

  size: z
    .string()
    .optional()
    .nullable(),

  logoPosition: z
    .string()
    .optional()
    .nullable(),

  logoSize: z
    .union([z.number(), z.string().transform(Number)])
    .pipe(z.number().min(0).max(100))
    .optional()
    .nullable(),

  logoOpacity: z
    .union([z.number(), z.string().transform(Number)])
    .pipe(z.number().min(0).max(100))
    .optional()
    .nullable(),

  logoRotation: z
    .union([z.number(), z.string().transform(Number)])
    .pipe(z.number().min(-180).max(180))
    .optional()
    .nullable(),

  isPublic: z
    .boolean()
    .default(false),
})

/**
 * Post like schema
 */
export const postLikeSchema = z.object({
  postId: z
    .string()
    .min(1, 'Post ID is required'),
})

/**
 * Post history query schema
 */
export const postHistoryQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 1)
    .pipe(z.number().min(1)),

  limit: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 20)
    .pipe(z.number().min(1).max(100)),

  style: z
    .string()
    .optional(),

  sortBy: z
    .enum(['createdAt', 'likes'])
    .optional()
    .default('createdAt'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
})

/**
 * Type inference from schemas
 */
export type SavePostInput = z.infer<typeof savePostSchema>
export type PostLikeInput = z.infer<typeof postLikeSchema>
export type PostHistoryQuery = z.infer<typeof postHistoryQuerySchema>

/**
 * Response type for saved post
 */
export interface SavedPostResponse {
  success: boolean
  persisted: boolean
  post?: {
    id: string
    image_url: string
    prompt: string
    headline: string | null
    style: string
    created_at: string
  }
  message: string
}

/**
 * Response type for post history
 */
export interface PostHistoryResponse {
  success: boolean
  posts: Array<{
    id: string
    imageUrl: string
    prompt: string
    headline: string | null
    style: string
    createdAt: string
    likes: number
    isPublic: boolean
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
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
 * Helper function to validate save post request
 */
export function validateSavePostRequest(body: unknown): {
  success: true
  data: SavePostInput
} | {
  success: false
  error: ValidationErrorResponse
} {
  const result = savePostSchema.safeParse(body)

  if (!result.success) {
    const issues = result.error.issues
    const firstIssue = issues[0]
    const fieldPath = firstIssue?.path?.[0]?.toString().toUpperCase()

    // Map field names to error codes
    const codeMap: Record<string, string> = {
      IMAGEURL: 'MISSING_IMAGE_URL',
      PROMPT: 'MISSING_PROMPT',
      STYLE: 'MISSING_STYLE',
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
 * Helper function to validate post history query
 */
export function validatePostHistoryQuery(query: unknown): {
  success: true
  data: PostHistoryQuery
} | {
  success: false
  error: ValidationErrorResponse
} {
  const result = postHistoryQuerySchema.safeParse(query)

  if (!result.success) {
    const issues = result.error.issues
    return {
      success: false,
      error: {
        error: issues[0]?.message || 'Invalid query parameters',
        code: 'INVALID_QUERY',
        details: { issues }
      }
    }
  }

  return {
    success: true,
    data: result.data
  }
}
