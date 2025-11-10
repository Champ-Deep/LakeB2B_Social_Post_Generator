/**
 * AppErrors - Typed error classes for better error handling
 * Follows a hierarchical structure for different error types
 */

export abstract class AppError extends Error {
  public readonly isOperational: boolean
  public readonly timestamp: Date
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    public readonly code: string,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    this.isOperational = isOperational
    this.timestamp = new Date()
    this.context = context
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack
    }
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends AppError {
  constructor(
    message: string = 'Network error occurred',
    context?: Record<string, any>
  ) {
    super(message, 'NETWORK_ERROR', true, context)
  }
}

export class ConnectionRefusedError extends NetworkError {
  constructor(
    public readonly url: string,
    public readonly port?: number
  ) {
    super(
      `Connection refused to ${url}${port ? `:${port}` : ''}`,
      { url, port }
    )
  }
}

export class TimeoutError extends NetworkError {
  constructor(
    public readonly timeoutMs: number,
    public readonly operation: string
  ) {
    super(
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      { timeoutMs, operation }
    )
  }
}

/**
 * API-related errors
 */
export class ApiError extends AppError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    code: string = 'API_ERROR',
    context?: Record<string, any>
  ) {
    super(message, code, true, { ...context, statusCode })
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', context?: Record<string, any>) {
    super(message, 400, 'BAD_REQUEST', context)
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', context?: Record<string, any>) {
    super(message, 401, 'UNAUTHORIZED', context)
  }
}

export class NotFoundError extends ApiError {
  constructor(
    public readonly resource: string,
    context?: Record<string, any>
  ) {
    super(`${resource} not found`, 404, 'NOT_FOUND', { ...context, resource })
  }
}

export class ValidationError extends ApiError {
  constructor(
    public readonly field: string,
    message: string,
    context?: Record<string, any>
  ) {
    super(message, 400, 'VALIDATION_ERROR', { ...context, field })
  }
}

/**
 * Service-related errors
 */
export class ServiceError extends AppError {
  constructor(
    public readonly serviceName: string,
    message: string,
    code: string = 'SERVICE_ERROR',
    context?: Record<string, any>
  ) {
    super(message, code, true, { ...context, serviceName })
  }
}

export class ServiceUnavailableError extends ServiceError {
  constructor(
    serviceName: string,
    reason?: string
  ) {
    super(
      serviceName,
      `Service '${serviceName}' is unavailable${reason ? `: ${reason}` : ''}`,
      'SERVICE_UNAVAILABLE',
      { reason }
    )
  }
}

export class CircuitBreakerOpenError extends ServiceError {
  constructor(
    serviceName: string,
    public readonly resetTime: Date
  ) {
    super(
      serviceName,
      `Circuit breaker is open for service '${serviceName}'`,
      'CIRCUIT_BREAKER_OPEN',
      { resetTime: resetTime.toISOString() }
    )
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends AppError {
  constructor(
    public readonly configKey: string,
    message?: string
  ) {
    super(
      message || `Configuration error for key '${configKey}'`,
      'CONFIG_ERROR',
      false,
      { configKey }
    )
  }
}

export class MissingConfigError extends ConfigurationError {
  constructor(configKey: string) {
    super(configKey, `Required configuration '${configKey}' is missing`)
  }
}

/**
 * Error utilities
 */
export class ErrorUtils {
  /**
   * Check if an error is operational (expected)
   */
  static isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational
    }
    return false
  }

  /**
   * Convert unknown error to AppError
   */
  static toAppError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error
    }
    
    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('ECONNREFUSED')) {
        const match = error.message.match(/connect ECONNREFUSED ([\d.]+):([\d]+)/)
        if (match) {
          return new ConnectionRefusedError(match[1], parseInt(match[2]))
        }
      }
      
      if (error.message.includes('ETIMEDOUT')) {
        return new TimeoutError(0, 'Unknown operation')
      }
      
      return new ServiceError('Unknown', error.message, 'UNKNOWN_ERROR')
    }
    
    return new ServiceError(
      'Unknown',
      typeof error === 'string' ? error : 'An unknown error occurred',
      'UNKNOWN_ERROR'
    )
  }

  /**
   * Create user-friendly error message
   */
  static getUserMessage(error: Error): string {
    if (error instanceof ConnectionRefusedError) {
      return 'Unable to connect to the server. Please check if the server is running.'
    }
    
    if (error instanceof TimeoutError) {
      return 'The request took too long. Please try again.'
    }
    
    if (error instanceof ServiceUnavailableError) {
      return 'The service is temporarily unavailable. Please try again later.'
    }
    
    if (error instanceof ValidationError) {
      return error.message
    }
    
    if (error instanceof ApiError && error.statusCode) {
      if (error.statusCode >= 500) {
        return 'A server error occurred. Please try again later.'
      }
      if (error.statusCode === 404) {
        return 'The requested resource was not found.'
      }
    }
    
    return 'An unexpected error occurred. Please try again.'
  }
}