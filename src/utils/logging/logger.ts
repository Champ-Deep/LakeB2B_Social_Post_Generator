/**
 * Enhanced Error Logging System
 * Provides comprehensive error tracking and crash detection
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  stack?: string
  userId?: string
  sessionId?: string
}

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  sessionId?: string
  additionalData?: Record<string, any>
  error?: string
  stack?: string
  context?: string
  reason?: string
  promise?: string
  name?: string
  filename?: string
  lineno?: number
  colno?: number
  message?: string
}

class Logger {
  private isDevelopment: boolean
  private logBuffer: LogEntry[] = []
  private maxBufferSize = 1000
  private static handlersSetup = false

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    if (!Logger.handlersSetup) {
      this.setupGlobalErrorHandlers()
      Logger.handlersSetup = true
    }
  }

  private setupGlobalErrorHandlers() {
    // Only setup in Node.js environment
    if (typeof window === 'undefined' && typeof process !== 'undefined') {
      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        this.fatal('Uncaught Exception', {
          error: error.message,
          stack: error.stack,
          context: 'global'
        })
        
        // Give time for logging then exit
        setTimeout(() => process.exit(1), 1000)
      })

      // Handle unhandled promise rejections
      process.on('unhandledRejection', (reason, promise) => {
        this.fatal('Unhandled Promise Rejection', {
          reason: String(reason),
          promise: String(promise),
          context: 'global'
        })
      })

      // Handle process warnings
      process.on('warning', (warning) => {
        this.warn(`Process Warning: ${warning.message}`, {
          name: warning.name,
          stack: warning.stack
        })
      })
    }

    // Browser error handling
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Browser Error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        })
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled Promise Rejection', {
          reason: String(event.reason)
        })
      })
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: ErrorContext,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stack: error?.stack,
      userId: context?.userId,
      sessionId: context?.sessionId
    }
  }

  private writeLog(entry: LogEntry) {
    // Add to buffer
    this.logBuffer.push(entry)
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift() // Remove oldest entry
    }

    // Console output with colors in development
    if (this.isDevelopment) {
      const colors = {
        [LogLevel.DEBUG]: '\x1b[36m', // Cyan
        [LogLevel.INFO]: '\x1b[32m',  // Green
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.FATAL]: '\x1b[35m'  // Magenta
      }
      
      const resetColor = '\x1b[0m'
      const color = colors[entry.level] || ''
      
      console.log(
        `${color}[${entry.timestamp}] [${entry.level}]${resetColor} ${entry.message}`
      )
      
      if (entry.context) {
        console.log('Context:', entry.context)
      }
      
      if (entry.stack) {
        console.log('Stack:', entry.stack)
      }
    }

    // In production, you might want to send to external logging service
    // this.sendToExternalService(entry)
  }

  debug(message: string, context?: ErrorContext) {
    this.writeLog(this.createLogEntry(LogLevel.DEBUG, message, context))
  }

  info(message: string, context?: ErrorContext) {
    this.writeLog(this.createLogEntry(LogLevel.INFO, message, context))
  }

  warn(message: string, context?: ErrorContext) {
    this.writeLog(this.createLogEntry(LogLevel.WARN, message, context))
  }

  error(message: string, context?: ErrorContext, error?: Error) {
    this.writeLog(this.createLogEntry(LogLevel.ERROR, message, context, error))
  }

  fatal(message: string, context?: ErrorContext, error?: Error) {
    this.writeLog(this.createLogEntry(LogLevel.FATAL, message, context, error))
  }

  /**
   * Log API route errors
   */
  apiError(
    method: string,
    path: string,
    error: Error,
    context?: ErrorContext
  ) {
    this.error(`API Error: ${method} ${path}`, {
      ...context,
      component: 'API',
      action: `${method} ${path}`,
      additionalData: {
        errorMessage: error.message,
        errorName: error.name
      }
    }, error)
  }

  /**
   * Log component errors
   */
  componentError(
    componentName: string,
    action: string,
    error: Error,
    context?: ErrorContext
  ) {
    this.error(`Component Error: ${componentName}`, {
      ...context,
      component: componentName,
      action,
      additionalData: {
        errorMessage: error.message,
        errorName: error.name
      }
    }, error)
  }

  /**
   * Log service errors
   */
  serviceError(
    serviceName: string,
    method: string,
    error: Error,
    context?: ErrorContext
  ) {
    this.error(`Service Error: ${serviceName}.${method}`, {
      ...context,
      component: serviceName,
      action: method,
      additionalData: {
        errorMessage: error.message,
        errorName: error.name
      }
    }, error)
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count = 50): LogEntry[] {
    return this.logBuffer.slice(-count)
  }

  /**
   * Clear log buffer
   */
  clearLogs() {
    this.logBuffer = []
  }
}

// Create singleton instance
export const logger = new Logger()

// Export convenience functions
export const logApiError = logger.apiError.bind(logger)
export const logComponentError = logger.componentError.bind(logger)
export const logServiceError = logger.serviceError.bind(logger)