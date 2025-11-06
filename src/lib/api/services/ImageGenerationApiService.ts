/**
 * ImageGenerationApiService - Concrete implementation of image generation service
 * Uses ApiClient for resilient communication with backend
 */

import { ApiClient, ApiResponse } from '../ApiClient'
import { 
  IImageGenerationApiService, 
  GenerateImageParams, 
  GenerateImageResult,
  AddLogoParams,
  AddLogoResult 
} from '../interfaces/IApiService'
import { logger } from '../../../utils/logging/logger'

export class ImageGenerationApiService implements IImageGenerationApiService {
  constructor(private apiClient: ApiClient) {}

  getServiceName(): string {
    return 'ImageGenerationApiService'
  }

  async isAvailable(): Promise<boolean> {
    try {
      const healthCheck = await this.apiClient.healthCheck()
      return healthCheck
    } catch (error) {
      logger.error('ImageGenerationApiService availability check failed', error)
      return false
    }
  }

  async generateImage(params: GenerateImageParams): Promise<ApiResponse<GenerateImageResult>> {
    logger.info('Generating image', { style: params.style, promptLength: params.prompt.length })
    
    const response = await this.apiClient.post<GenerateImageResult>(
      '/api/generate-image',
      {
        prompt: params.prompt,
        style: params.style,
        width: params.width,
        height: params.height
      }
    )
    
    if (response.success && response.data) {
      logger.info('Image generated successfully', { style: params.style })
    } else {
      logger.error('Image generation failed', response.error)
    }
    
    return response
  }

  async addLogo(params: AddLogoParams): Promise<ApiResponse<AddLogoResult>> {
    logger.info('Adding logo to image', { style: params.style })
    
    const response = await this.apiClient.post<AddLogoResult>(
      '/api/add-logo',
      {
        imageUrl: params.imageUrl,
        style: params.style
      }
    )
    
    if (response.success && response.data) {
      logger.info('Logo added successfully', { style: params.style })
    } else {
      logger.error('Logo addition failed', response.error)
    }
    
    return response
  }
}