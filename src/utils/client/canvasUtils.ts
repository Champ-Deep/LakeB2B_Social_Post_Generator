/**
 * Canvas utilities for client-side operations
 * These utilities should only be used in browser environment
 */

import { LogoPlacement } from '../../services/interfaces/ILogoService'

export interface CanvasOperationResult {
  success: boolean
  dataUrl?: string
  error?: string
}

/**
 * Check if we're in a browser environment
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * Load an image in browser environment
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  if (!isBrowser()) {
    return Promise.reject(new Error('loadImage can only be used in browser environment'))
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    
    img.src = src
  })
}

/**
 * Create canvas element
 */
export const createCanvas = (width: number, height: number): HTMLCanvasElement | null => {
  if (!isBrowser()) {
    console.error('createCanvas can only be used in browser environment')
    return null
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

/**
 * Apply logo to canvas
 */
export const applyLogoToCanvas = async (
  ctx: CanvasRenderingContext2D,
  logoPath: string,
  placement: LogoPlacement
): Promise<void> => {
  try {
    const logoImg = await loadImage(logoPath)
    ctx.drawImage(
      logoImg,
      placement.x,
      placement.y,
      placement.width,
      placement.height
    )
  } catch (error) {
    console.error('Failed to apply logo to canvas:', error)
    throw error
  }
}

/**
 * Create logo overlay on image
 */
export const createLogoOverlay = async (
  baseImageUrl: string,
  logoPath: string,
  placement: LogoPlacement,
  canvasWidth: number,
  canvasHeight: number
): Promise<CanvasOperationResult> => {
  if (!isBrowser()) {
    return {
      success: false,
      error: 'Logo overlay can only be created in browser environment'
    }
  }

  try {
    const canvas = createCanvas(canvasWidth, canvasHeight)
    if (!canvas) {
      throw new Error('Failed to create canvas')
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // Load and draw base image
    const baseImg = await loadImage(baseImageUrl)
    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height)

    // Apply logo
    await applyLogoToCanvas(ctx, logoPath, placement)

    return {
      success: true,
      dataUrl: canvas.toDataURL('image/png')
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}