/**
 * Schema Index
 *
 * Central export for all Zod validation schemas
 */

// Image Generation
export {
  imageGenerationSchema,
  memeTextsSchema,
  ImageStyles,
  LogoPositions,
  MemeFormats,
  validateImageGenerationRequest,
  type ImageStyle,
  type LogoPosition,
  type MemeFormat,
  type ImageGenerationInput,
  type ImageGenerationResponse,
} from './imageGeneration.schema'

// LinkedIn
export {
  linkedinPostSchema,
  linkedinScheduleSchema,
  LinkedInVisibility,
  validateLinkedInPostRequest,
  validateImageSize,
  type LinkedInVisibilityType,
  type LinkedInPostInput,
  type LinkedInScheduleInput,
  type LinkedInPostResponse,
  type LinkedInConnectionStatus,
} from './linkedin.schema'

// Posts
export {
  savePostSchema,
  postLikeSchema,
  postHistoryQuerySchema,
  validateSavePostRequest,
  validatePostHistoryQuery,
  type SavePostInput,
  type PostLikeInput,
  type PostHistoryQuery,
  type SavedPostResponse,
  type PostHistoryResponse,
} from './posts.schema'

// Common validation error type
export type { ValidationErrorResponse } from './imageGeneration.schema'
