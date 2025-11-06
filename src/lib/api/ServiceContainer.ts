/**
 * ServiceContainer - Dependency injection container for API services
 * Provides singleton instances and lazy initialization
 */

import { ApiClient, apiClient } from './ApiClient'
import { IImageGenerationApiService, IHealthCheckService } from './interfaces/IApiService'
import { ImageGenerationApiService } from './services/ImageGenerationApiService'
import { HealthCheckService } from './services/HealthCheckService'

export class ServiceContainer {
  private static instance: ServiceContainer
  private services: Map<string, any> = new Map()
  private apiClient: ApiClient

  private constructor(apiClient: ApiClient) {
    this.apiClient = apiClient
  }

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer(apiClient)
    }
    return ServiceContainer.instance
  }

  /**
   * Get or create ImageGenerationApiService
   */
  getImageGenerationService(): IImageGenerationApiService {
    const key = 'ImageGenerationApiService'
    
    if (!this.services.has(key)) {
      this.services.set(key, new ImageGenerationApiService(this.apiClient))
    }
    
    return this.services.get(key)
  }

  /**
   * Get or create HealthCheckService
   */
  getHealthCheckService(): IHealthCheckService {
    const key = 'HealthCheckService'
    
    if (!this.services.has(key)) {
      this.services.set(key, new HealthCheckService(this.apiClient))
    }
    
    return this.services.get(key)
  }

  /**
   * Get the API client instance
   */
  getApiClient(): ApiClient {
    return this.apiClient
  }

  /**
   * Clear all cached services (useful for testing)
   */
  clearServices(): void {
    this.services.clear()
  }

  /**
   * Check if all critical services are available
   */
  async checkAllServices(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {}
    
    const services = [
      { name: 'health', service: this.getHealthCheckService() },
      { name: 'imageGeneration', service: this.getImageGenerationService() }
    ]
    
    for (const { name, service } of services) {
      results[name] = await service.isAvailable()
    }
    
    return results
  }
}

// Export singleton instance
export const serviceContainer = ServiceContainer.getInstance()