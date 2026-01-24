/**
 * Image Storage
 *
 * Handles saving, loading, and serving images.
 * Uses Cloudinary when configured (for production/Vercel), falls back to local filesystem.
 */

import fs from 'fs/promises'
import path from 'path'
import { isCloudinaryConfigured, uploadBase64ToCloudinary } from './cloudinary'

// Storage directories
const DATA_DIR = path.join(process.cwd(), 'data')
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads')
export const IMAGES_DIR = path.join(UPLOADS_DIR, 'images')

export interface SaveImageResult {
  success: boolean
  filePath?: string
  publicUrl?: string
  filename?: string
  error?: string
}

/**
 * Ensure storage directories exist
 */
export async function ensureStorageDirectories(): Promise<void> {
  try {
    await fs.mkdir(IMAGES_DIR, { recursive: true })
  } catch (error) {
    // Directory already exists
  }
}

/**
 * Generate unique filename for an image
 */
export function generateImageFilename(userId: string, extension = 'png'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${userId}_${timestamp}_${random}.${extension}`
}

/**
 * Extract extension and data from base64 image string
 */
function parseBase64Image(imageData: string): { extension: string; data: string } | null {
  // Handle data URL format: data:image/png;base64,xxxx
  const dataUrlMatch = imageData.match(/^data:image\/([a-z]+);base64,(.+)$/i)
  if (dataUrlMatch) {
    return {
      extension: dataUrlMatch[1].toLowerCase(),
      data: dataUrlMatch[2],
    }
  }

  // Handle raw base64 (assume PNG)
  if (/^[A-Za-z0-9+/=]+$/.test(imageData)) {
    return {
      extension: 'png',
      data: imageData,
    }
  }

  return null
}

/**
 * Save a base64 encoded image
 * Uses Cloudinary when configured (production), falls back to local storage (development)
 */
export async function saveImage(
  imageData: string,
  userId: string
): Promise<SaveImageResult> {
  try {
    // Parse base64 data first
    const parsed = parseBase64Image(imageData)
    if (!parsed) {
      return { success: false, error: 'Invalid image data format' }
    }

    const { extension, data } = parsed
    const buffer = Buffer.from(data, 'base64')

    // Validate it's a reasonable image size (max 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return { success: false, error: 'Image too large (max 10MB)' }
    }

    // Use Cloudinary in production/when configured
    if (isCloudinaryConfigured()) {
      console.log('[ImageStorage] Using Cloudinary for image storage')

      const cloudinaryResult = await uploadBase64ToCloudinary(imageData, {
        folder: `lakeb2b-posts/${userId}`,
        tags: ['lakeb2b', 'social-post', userId],
      })

      if (!cloudinaryResult.success) {
        console.error('[ImageStorage] Cloudinary upload failed:', cloudinaryResult.error)
        // Fall back to local storage on Cloudinary failure
        console.log('[ImageStorage] Falling back to local storage')
      } else {
        return {
          success: true,
          filePath: cloudinaryResult.secureUrl || cloudinaryResult.url || '',
          publicUrl: cloudinaryResult.secureUrl || cloudinaryResult.url,
          filename: cloudinaryResult.publicId,
        }
      }
    }

    // Local storage fallback
    console.log('[ImageStorage] Using local filesystem storage')
    await ensureStorageDirectories()

    // Generate filename and path
    const filename = generateImageFilename(userId, extension)
    const filePath = path.join(IMAGES_DIR, filename)

    // Write file
    await fs.writeFile(filePath, buffer)

    // Return paths
    const relativePath = path.relative(process.cwd(), filePath)
    const publicUrl = `/api/images/${filename}`

    return {
      success: true,
      filePath: relativePath,
      publicUrl,
      filename,
    }
  } catch (error) {
    console.error('Error saving image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save image',
    }
  }
}

/**
 * Load image from local storage
 */
export async function loadImage(filename: string): Promise<Buffer | null> {
  try {
    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename)
    const filePath = path.join(IMAGES_DIR, sanitizedFilename)

    return await fs.readFile(filePath)
  } catch {
    return null
  }
}

/**
 * Delete image from local storage
 */
export async function deleteImage(filename: string): Promise<boolean> {
  try {
    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename)
    const filePath = path.join(IMAGES_DIR, sanitizedFilename)

    await fs.unlink(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Check if image exists in local storage
 */
export async function imageExists(filename: string): Promise<boolean> {
  try {
    const sanitizedFilename = path.basename(filename)
    const filePath = path.join(IMAGES_DIR, sanitizedFilename)

    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Get content type from filename extension
 */
export function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const contentTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  }
  return contentTypes[ext] || 'application/octet-stream'
}
