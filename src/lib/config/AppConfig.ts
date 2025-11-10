/**
 * AppConfig - Centralized configuration management
 * Provides type-safe configuration with validation and environment support
 */

import { MissingConfigError } from '../errors/AppErrors'
import { logger } from '../../utils/logging/logger'

export interface AppConfiguration {
  api: {
    baseUrl: string
    timeout: number
    maxRetries: number
    retryDelay: number
  }
  connection: {
    checkInterval: number
    circuitBreakerThreshold: number
    circuitBreakerResetTime: number
  }
  server: {
    port: number
    host: string
    preferredPorts: number[]
  }
  features: {
    enableAutoReconnect: boolean
    showConnectionToasts: boolean
    enableErrorBoundary: boolean
  }
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    enableConsole: boolean
  }
}

export class AppConfig {
  private static instance: AppConfig
  private config: AppConfiguration
  private overrides: Partial<AppConfiguration> = {}

  private constructor() {
    this.config = this.loadConfiguration()
  }

  static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig()
    }
    return AppConfig.instance
  }

  /**
   * Load configuration from environment and defaults
   */
  private loadConfiguration(): AppConfiguration {
    const isClient = typeof window !== 'undefined'
    const isDevelopment = process.env.NODE_ENV === 'development'

    // Default configuration
    const defaultConfig: AppConfiguration = {
      api: {
        baseUrl: isClient ? window.location.origin : `http://localhost:${process.env.PORT || '3000'}`,
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 1000
      },
      connection: {
        checkInterval: isDevelopment ? 10000 : 30000, // Check more frequently in dev
        circuitBreakerThreshold: 5,
        circuitBreakerResetTime: 60000
      },
      server: {
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || '0.0.0.0',
        preferredPorts: [3000, 3001, 3002]
      },
      features: {
        enableAutoReconnect: true,
        showConnectionToasts: true,
        enableErrorBoundary: true
      },
      logging: {
        level: isDevelopment ? 'debug' : 'info',
        enableConsole: isDevelopment
      }
    }

    // Apply environment variable overrides
    const envConfig = this.loadFromEnvironment()
    
    // Merge configurations
    const config = this.deepMerge(defaultConfig, envConfig, this.overrides)
    
    // Validate configuration
    this.validateConfiguration(config)
    
    return config
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): Partial<AppConfiguration> {
    const config: Partial<AppConfiguration> = {}

    // API configuration
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      config.api = { ...(config.api || {}), baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL } as any
    }
    if (process.env.NEXT_PUBLIC_API_TIMEOUT) {
      config.api = { ...(config.api || {}), timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT) } as any
    }

    // Connection configuration
    if (process.env.NEXT_PUBLIC_CONNECTION_CHECK_INTERVAL) {
      config.connection = { 
        ...(config.connection || {}), 
        checkInterval: parseInt(process.env.NEXT_PUBLIC_CONNECTION_CHECK_INTERVAL) 
      } as any
    }

    // Feature flags
    if (process.env.NEXT_PUBLIC_ENABLE_AUTO_RECONNECT !== undefined) {
      config.features = {
        ...(config.features || {}),
        enableAutoReconnect: process.env.NEXT_PUBLIC_ENABLE_AUTO_RECONNECT === 'true'
      } as any
    }

    return config
  }

  /**
   * Validate configuration
   */
  private validateConfiguration(config: AppConfiguration): void {
    const errors: string[] = []

    // API validation
    if (config.api.timeout < 1000) {
      errors.push('API timeout must be at least 1000ms')
    }
    if (config.api.maxRetries < 0) {
      errors.push('API maxRetries must be non-negative')
    }

    // Connection validation
    if (config.connection.checkInterval < 5000) {
      errors.push('Connection check interval must be at least 5000ms')
    }

    // Server validation
    if (config.server.port < 1 || config.server.port > 65535) {
      errors.push('Server port must be between 1 and 65535')
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`)
    }
  }

  /**
   * Deep merge configuration objects
   */
  private deepMerge(...objects: any[]): any {
    const result: any = {}
    
    for (const obj of objects) {
      if (!obj) continue
      
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            result[key] = this.deepMerge(result[key] || {}, obj[key])
          } else {
            result[key] = obj[key]
          }
        }
      }
    }
    
    return result
  }

  /**
   * Get the full configuration
   */
  getConfig(): AppConfiguration {
    return { ...this.config }
  }

  /**
   * Get a specific configuration value
   */
  get<K extends keyof AppConfiguration>(key: K): AppConfiguration[K] {
    return this.config[key]
  }

  /**
   * Get a nested configuration value using dot notation
   */
  getValue(path: string): any {
    const keys = path.split('.')
    let value: any = this.config
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        throw new MissingConfigError(path)
      }
    }
    
    return value
  }

  /**
   * Override configuration at runtime
   */
  override(overrides: Partial<AppConfiguration>): void {
    this.overrides = this.deepMerge(this.overrides, overrides)
    this.config = this.loadConfiguration()
    logger.info('Configuration overridden', overrides)
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.overrides = {}
    this.config = this.loadConfiguration()
    logger.info('Configuration reset to defaults')
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  }

  /**
   * Check if running on client side
   */
  isClient(): boolean {
    return typeof window !== 'undefined'
  }

  /**
   * Get environment-specific value
   */
  getEnvironmentValue<T>(dev: T, prod: T): T {
    return this.isDevelopment() ? dev : prod
  }
}

// Export singleton instance
export const appConfig = AppConfig.getInstance()