/**
 * Cloudinary Integration
 *
 * Provides cloud-based image storage, CDN delivery, and on-the-fly optimization.
 * Falls back to local storage when Cloudinary is not configured.
 */

import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary'

// Configure Cloudinary from environment variables
const isConfigured = !!(
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return isConfigured
}

/**
 * Upload options for Cloudinary
 */
export interface CloudinaryUploadOptions {
  folder?: string
  publicId?: string
  tags?: string[]
  transformation?: Array<{
    width?: number
    height?: number
    crop?: string
    quality?: string | number
    format?: string
  }>
  overwrite?: boolean
  resourceType?: 'image' | 'raw' | 'video' | 'auto'
}

/**
 * Result from Cloudinary upload
 */
export interface CloudinaryUploadResult {
  success: boolean
  url?: string
  secureUrl?: string
  publicId?: string
  format?: string
  width?: number
  height?: number
  bytes?: number
  error?: string
}

/**
 * Upload an image buffer to Cloudinary
 */
export async function uploadToCloudinary(
  imageBuffer: Buffer,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  if (!isConfigured) {
    return {
      success: false,
      error: 'Cloudinary is not configured. Set CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, and NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.',
    }
  }

  const {
    folder = 'lakeb2b-posts',
    publicId,
    tags = ['lakeb2b', 'social-post'],
    transformation,
    overwrite = false,
    resourceType = 'image',
  } = options

  return new Promise((resolve) => {
    const uploadOptions: Record<string, unknown> = {
      folder,
      tags,
      resource_type: resourceType,
      overwrite,
    }

    if (publicId) {
      uploadOptions.public_id = publicId
    }

    if (transformation) {
      uploadOptions.transformation = transformation
    }

    // Use upload_stream for buffer upload
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          resolve({
            success: false,
            error: error.message || 'Failed to upload to Cloudinary',
          })
          return
        }

        if (!result) {
          resolve({
            success: false,
            error: 'No result from Cloudinary upload',
          })
          return
        }

        resolve({
          success: true,
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        })
      }
    )

    // Write buffer to stream
    uploadStream.end(imageBuffer)
  })
}

/**
 * Upload a base64 image to Cloudinary
 */
export async function uploadBase64ToCloudinary(
  base64Data: string,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  if (!isConfigured) {
    return {
      success: false,
      error: 'Cloudinary is not configured',
    }
  }

  // Extract base64 data from data URL if present
  let cleanBase64 = base64Data
  if (base64Data.includes(',')) {
    cleanBase64 = base64Data.split(',')[1]
  }

  // Convert to buffer
  const buffer = Buffer.from(cleanBase64, 'base64')
  return uploadToCloudinary(buffer, options)
}

/**
 * Get an optimized URL for a Cloudinary image
 */
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    crop?: 'fill' | 'fit' | 'scale' | 'pad' | 'thumb'
    quality?: 'auto' | 'auto:low' | 'auto:eco' | 'auto:good' | 'auto:best' | number
    format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg'
    aspectRatio?: string
  } = {}
): string {
  if (!isConfigured) {
    return ''
  }

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    aspectRatio,
  } = options

  const transformation: Record<string, unknown> = {
    fetch_format: format,
    quality,
  }

  if (width) transformation.width = width
  if (height) transformation.height = height
  if (crop) transformation.crop = crop
  if (aspectRatio) transformation.aspect_ratio = aspectRatio

  return cloudinary.url(publicId, transformation)
}

/**
 * Get a social media optimized URL (1200x628 for LinkedIn/Twitter)
 */
export function getSocialMediaUrl(publicId: string, platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' = 'linkedin'): string {
  const dimensions = {
    linkedin: { width: 1200, height: 628 },
    twitter: { width: 1200, height: 675 },
    facebook: { width: 1200, height: 630 },
    instagram: { width: 1080, height: 1080 },
  }

  const { width, height } = dimensions[platform]

  return getOptimizedUrl(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto:good',
    format: 'auto',
  })
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Cloudinary is not configured' }
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return {
      success: result.result === 'ok',
      error: result.result !== 'ok' ? `Delete failed: ${result.result}` : undefined,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete from Cloudinary',
    }
  }
}

/**
 * Generate a signed upload URL for client-side uploads
 */
export function generateUploadSignature(options: {
  folder?: string
  tags?: string[]
  timestamp?: number
  publicId?: string
}): { timestamp: number; signature: string; apiKey: string; cloudName: string } | null {
  if (!isConfigured) {
    return null
  }

  const timestamp = options.timestamp || Math.round(Date.now() / 1000)

  const paramsToSign: Record<string, string | number> = {
    timestamp,
    folder: options.folder || 'lakeb2b-posts',
  }

  if (options.tags) {
    paramsToSign.tags = options.tags.join(',')
  }

  if (options.publicId) {
    paramsToSign.public_id = options.publicId
  }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  )

  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  }
}

/**
 * Transform URL to add Cloudinary transformations
 */
export function addTransformationToUrl(
  url: string,
  transformations: string[]
): string {
  // If not a Cloudinary URL, return as-is
  if (!url.includes('cloudinary.com')) {
    return url
  }

  // Insert transformations after /upload/
  const uploadIndex = url.indexOf('/upload/')
  if (uploadIndex === -1) {
    return url
  }

  const beforeUpload = url.substring(0, uploadIndex + 8)
  const afterUpload = url.substring(uploadIndex + 8)

  return `${beforeUpload}${transformations.join(',')}/${afterUpload}`
}
