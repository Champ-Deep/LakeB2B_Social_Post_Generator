/**
 * Interface for Image Generation Services
 */

export interface ImageGenerationOptions {
  prompt: string
  style: string
  position?: string
  width?: number
  height?: number
}

export interface ImageGenerationResult {
  imageUrl: string
  success: boolean
  message?: string
  error?: string
}

export interface IImageGenerationService {
  generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>
  isConfigured(): boolean
}