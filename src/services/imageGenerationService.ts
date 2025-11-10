/**
 * Image Generation Service
 * Provides integration with Gemini 2.5 Flash for AI image generation
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

export class ImageGenerationService {
  private apiKey: string | undefined
  
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY
  }
  
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    try {
      // Call the API endpoint which handles the actual generation
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: options.prompt,
          style: options.style,
          position: options.position || 'bottom-left'
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Image generation failed')
      }
      
      const data = await response.json()
      
      return {
        imageUrl: data.imageUrl,
        success: true,
        message: data.message || 'Image generated successfully'
      }
    } catch (error) {
      console.error('ImageGenerationService error:', error)
      return {
        imageUrl: '',
        success: false,
        message: 'Failed to generate image',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  isConfigured(): boolean {
    return !!this.apiKey
  }
}

export const imageGenerationService = new ImageGenerationService()