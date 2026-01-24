/**
 * Image Generation API Validation Schema
 *
 * Zod v4 schema for validating POST /api/generate-image requests
 * Replaces manual validation with type-safe schema validation
 */

import { z } from 'zod'

// Valid style options
export const ImageStyles = ['isometric', 'infographic', 'newyork-cartoon', 'minimalist-linkedin', 'meme'] as const
export type ImageStyle = typeof ImageStyles[number]

// Valid logo positions
export const LogoPositions = ['bottom-left', 'bottom-right', 'top-right'] as const
export type LogoPosition = typeof LogoPositions[number]

// Valid meme formats
export const MemeFormats = ['drake', 'distracted', 'woman-cat', 'change-mind', 'expanding-brain', 'two-buttons'] as const
export type MemeFormat = typeof MemeFormats[number]

/**
 * Meme text schema for meme-style images
 */
export const memeTextsSchema = z.object({
  topText: z.string().max(200).optional(),
  bottomText: z.string().max(200).optional(),
  // For multi-panel memes
  panel1: z.string().max(200).optional(),
  panel2: z.string().max(200).optional(),
  panel3: z.string().max(200).optional(),
  panel4: z.string().max(200).optional(),
}).optional()

/**
 * Main image generation request schema
 */
export const imageGenerationSchema = z.object({
  // Required field
  prompt: z
    .string()
    .min(1, 'Prompt cannot be empty')
    .max(500, 'Prompt must be less than 500 characters')
    .transform(val => val.trim()),

  // Optional fields with defaults
  style: z
    .enum(ImageStyles)
    .default('isometric'),

  position: z
    .enum(LogoPositions)
    .default('bottom-left'),

  logoSize: z
    .number()
    .min(10, 'Logo size must be at least 10%')
    .max(100, 'Logo size cannot exceed 100%')
    .default(35),

  logoOpacity: z
    .number()
    .min(0, 'Logo opacity must be at least 0%')
    .max(100, 'Logo opacity cannot exceed 100%')
    .default(85),

  logoRotation: z
    .number()
    .min(-180, 'Logo rotation must be at least -180 degrees')
    .max(180, 'Logo rotation cannot exceed 180 degrees')
    .default(0),

  // Meme-specific fields (only used when style === 'meme')
  memeFormat: z
    .enum(MemeFormats)
    .optional(),

  memeTexts: memeTextsSchema,
}).refine(
  (data) => {
    // If style is 'meme', memeFormat should be provided
    if (data.style === 'meme' && !data.memeFormat) {
      return false
    }
    return true
  },
  {
    message: 'Meme format is required when style is "meme"',
    path: ['memeFormat']
  }
)

/**
 * Type inference from schema
 */
export type ImageGenerationInput = z.infer<typeof imageGenerationSchema>

/**
 * Response type for successful image generation
 */
export interface ImageGenerationResponse {
  imageUrl: string
  prompt: string
  originalPrompt: string
  style: ImageStyle
  fallback?: boolean
  fallbackReason?: string
  modelUsed?: string
  modelsAttempted?: string[]
  message: string
}

/**
 * Response type for validation errors
 */
export interface ValidationErrorResponse {
  error: string
  code: string
  details?: Record<string, unknown>
}

/**
 * Helper function to validate and parse request body
 */
export function validateImageGenerationRequest(body: unknown): {
  success: true
  data: ImageGenerationInput
} | {
  success: false
  error: ValidationErrorResponse
} {
  const result = imageGenerationSchema.safeParse(body)

  if (!result.success) {
    // Extract the first error issue
    const issues = result.error.issues
    const firstIssue = issues[0]

    // Map error codes based on field path
    let errorCode = 'INVALID_INPUT'
    const fieldPath = firstIssue?.path?.[0]?.toString().toUpperCase()
    if (fieldPath) {
      errorCode = `INVALID_${fieldPath}`
    }

    // Special case for missing prompt
    if (firstIssue?.message?.toLowerCase().includes('required') ||
        firstIssue?.message?.toLowerCase().includes('empty')) {
      if (fieldPath === 'PROMPT') {
        errorCode = 'MISSING_PROMPT'
      }
    }

    return {
      success: false,
      error: {
        error: firstIssue?.message || 'Validation failed',
        code: errorCode,
        details: { issues }
      }
    }
  }

  return {
    success: true,
    data: result.data
  }
}
