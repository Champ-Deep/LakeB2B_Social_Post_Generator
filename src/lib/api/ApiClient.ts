/**
 * ApiClient - Resilient API client with retry logic and connection pooling
 * Implements circuit breaker pattern and exponential backoff
 */

import { logger } from '../../utils/logging/logger'

export interface ApiClientConfig {
  baseUrl?: string
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  circuitBreakerThreshold?: number
  circuitBreakerResetTime?: number
}

export interface RequestOptions extends RequestInit {
  skipRetry?: boolean
  customTimeout?: number
}

export interface ApiResponse<T = any> {
  data?: T
  error?: ApiError
  success: boolean
  statusCode?: number
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ApiClient {
  private config: Required<ApiClientConfig>
  private circuitBreakerFailures: number = 0
  private circuitBreakerLastFailure: number = 0
  private circuitBreakerOpen: boolean = false

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      timeout: config.timeout || 30000,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
      circuitBreakerResetTime: config.circuitBreakerResetTime || 60000,
    }
  }

  /**
   * Make an HTTP request with retry logic and circuit breaker
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      return {
        success: false,
        error: new ApiError(
          'Service temporarily unavailable. Circuit breaker is open.',
          503,
          'CIRCUIT_BREAKER_OPEN'
        ),
      }
    }

    const url = `${this.config.baseUrl}${endpoint}`
    const { skipRetry = false, customTimeout, ...fetchOptions } = options
    
    const timeout = customTimeout || this.config.timeout
    const maxRetries = skipRetry ? 0 : this.config.maxRetries

    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, fetchOptions, timeout)
        
        // Reset circuit breaker on success
        this.resetCircuitBreaker()
        
        const contentType = response.headers.get('content-type')
        const isJson = contentType?.includes('application/json')
        
        if (!response.ok) {
          const errorData = isJson ? await response.json() : await response.text()
          throw new ApiError(
            errorData.error || errorData.message || 'Request failed',
            response.status,
            errorData.code,
            errorData.details
          )
        }
        
        const data = isJson ? await response.json() : await response.text()
        
        return {
          data,
          success: true,
          statusCode: response.status,
        }
      } catch (error) {
        lastError = error as Error
        
        logger.apiError(
          fetchOptions.method || 'GET',
          endpoint,
          lastError,
          { attempt: attempt + 1 }
        )
        
        // Don't retry on client errors (4xx)
        if (error instanceof ApiError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
          break
        }
        
        // Exponential backoff
        if (attempt < maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt)
          await this.sleep(delay)
        }
      }
    }
    
    // All retries failed
    this.recordCircuitBreakerFailure()
    
    return {
      success: false,
      error: lastError instanceof ApiError
        ? lastError
        : new ApiError(
            lastError?.message || 'Request failed after retries',
            undefined,
            'NETWORK_ERROR'
          ),
    }
  }

  /**
   * GET request helper
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  /**
   * POST request helper
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const headers = {
      'Content-Type': 'application/json',
      ...options?.headers,
    }
    
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request helper
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const headers = {
      'Content-Type': 'application/json',
      ...options?.headers,
    }
    
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request helper
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  /**
   * Health check with quick timeout
   */
  async healthCheck(): Promise<boolean> {
    const response = await this.get('/api/health', {
      skipRetry: true,
      customTimeout: 5000,
    })
    
    return response.success
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Circuit breaker logic
   */
  private isCircuitBreakerOpen(): boolean {
    if (!this.circuitBreakerOpen) {
      return false
    }
    
    // Check if enough time has passed to reset
    const timeSinceLastFailure = Date.now() - this.circuitBreakerLastFailure
    if (timeSinceLastFailure >= this.config.circuitBreakerResetTime) {
      this.resetCircuitBreaker()
      return false
    }
    
    return true
  }

  private recordCircuitBreakerFailure(): void {
    this.circuitBreakerFailures++
    this.circuitBreakerLastFailure = Date.now()
    
    if (this.circuitBreakerFailures >= this.config.circuitBreakerThreshold) {
      this.circuitBreakerOpen = true
      logger.error('Circuit breaker opened due to repeated failures', {
        failures: this.circuitBreakerFailures,
        threshold: this.config.circuitBreakerThreshold,
      })
    }
  }

  private resetCircuitBreaker(): void {
    if (this.circuitBreakerOpen || this.circuitBreakerFailures > 0) {
      logger.info('Circuit breaker reset')
    }
    this.circuitBreakerFailures = 0
    this.circuitBreakerOpen = false
    this.circuitBreakerLastFailure = 0
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance for the application
export const apiClient = new ApiClient({
  baseUrl: typeof window !== 'undefined' ? window.location.origin : '',
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  circuitBreakerThreshold: 5,
  circuitBreakerResetTime: 60000,
})