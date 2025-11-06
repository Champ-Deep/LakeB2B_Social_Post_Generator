/**
 * HealthCheckService - Service for monitoring server health
 */

import { ApiClient, ApiResponse } from '../ApiClient'
import { IHealthCheckService, HealthCheckResult } from '../interfaces/IApiService'
import { logger } from '../../../utils/logging/logger'

export class HealthCheckService implements IHealthCheckService {
  constructor(private apiClient: ApiClient) {}

  getServiceName(): string {
    return 'HealthCheckService'
  }

  async isAvailable(): Promise<boolean> {
    const result = await this.checkHealth()
    return result.success && result.data?.status === 'ok'
  }

  async checkHealth(): Promise<ApiResponse<HealthCheckResult>> {
    const response = await this.apiClient.get<HealthCheckResult>(
      '/api/health',
      {
        skipRetry: true,
        customTimeout: 5000
      }
    )
    
    if (response.success && response.data) {
      logger.debug('Health check passed', response.data)
    } else {
      logger.warn('Health check failed', response.error)
    }
    
    return response
  }
}