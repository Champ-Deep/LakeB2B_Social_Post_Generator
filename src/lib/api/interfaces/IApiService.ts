/**
 * IApiService - Interface for API services following SOLID principles
 */

import { ApiResponse } from '../ApiClient'

export interface IApiService {
  /**
   * Check if the service is available and configured
   */
  isAvailable(): Promise<boolean>
  
  /**
   * Get service name for logging and identification
   */
  getServiceName(): string
}

export interface IImageGenerationApiService extends IApiService {
  /**
   * Generate an image based on prompt and style
   */
  generateImage(params: GenerateImageParams): Promise<ApiResponse<GenerateImageResult>>
  
  /**
   * Add logo to an existing image
   */
  addLogo(params: AddLogoParams): Promise<ApiResponse<AddLogoResult>>
}

export interface GenerateImageParams {
  prompt: string
  style: string
  width?: number
  height?: number
  position?: string
  logoSize?: number
  logoOpacity?: number
  logoRotation?: number
}

export interface GenerateImageResult {
  imageUrl: string
  prompt: string
  originalPrompt: string
  style: string
  message?: string
}

export interface AddLogoParams {
  imageUrl: string
  style: string
}

export interface AddLogoResult {
  imageUrl: string
  style: string
  message?: string
}

export interface IHealthCheckService extends IApiService {
  /**
   * Perform a health check on the server
   */
  checkHealth(): Promise<ApiResponse<HealthCheckResult>>
}

export interface HealthCheckResult {
  status: 'ok' | 'error'
  timestamp: string
  service: string
  uptime?: number
  environment?: string
  version?: string
}