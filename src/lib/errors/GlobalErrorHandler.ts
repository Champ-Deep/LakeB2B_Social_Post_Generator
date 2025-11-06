/**
 * GlobalErrorHandler - Centralized error handling for the application
 * Handles both client-side and server-side errors
 */

import { logger } from '../../utils/logging/logger'
import { ErrorUtils, AppError } from './AppErrors'

export interface ErrorHandler {
  (error: Error, context?: Record<string, any>): void
}

export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler
  private errorHandlers: Set<ErrorHandler> = new Set()
  private isInitialized = false

  private constructor() {}

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler()
    }
    return GlobalErrorHandler.instance
  }

  /**
   * Initialize global error handlers
   */
  initialize(): void {
    if (this.isInitialized) {
      return
    }

    if (typeof window !== 'undefined') {
      // Client-side error handlers
      window.addEventListener('error', (event) => {
        this.handleError(event.error || new Error(event.message), {
          type: 'uncaught-error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        })
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(
          new Error(event.reason?.message || 'Unhandled promise rejection'),
          {
            type: 'unhandled-rejection',
            reason: event.reason
          }
        )
      })
    } else {
      // Server-side error handlers
      process.on('uncaughtException', (error) => {
        this.handleError(error, { type: 'uncaught-exception' })
        // Give time for error to be logged before exit
        setTimeout(() => process.exit(1), 1000)
      })

      process.on('unhandledRejection', (reason, promise) => {
        this.handleError(
          new Error(`Unhandled rejection: ${reason}`),
          {
            type: 'unhandled-rejection',
            promise
          }
        )
      })
    }

    this.isInitialized = true
    logger.info('Global error handler initialized')
  }

  /**
   * Handle an error
   */
  handleError(error: unknown, context?: Record<string, any>): void {
    const appError = ErrorUtils.toAppError(error)
    
    // Log the error
    if (ErrorUtils.isOperationalError(appError)) {
      logger.warn('Operational error', {
        error: appError.toJSON(),
        context
      })
    } else {
      logger.error('Unexpected error', {
        error: appError.toJSON(),
        context
      })
    }

    // Notify all registered handlers
    this.errorHandlers.forEach(handler => {
      try {
        handler(appError, context)
      } catch (handlerError) {
        logger.error('Error in error handler', handlerError)
      }
    })
  }

  /**
   * Register an error handler
   */
  addErrorHandler(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler)
    
    // Return unsubscribe function
    return () => {
      this.errorHandlers.delete(handler)
    }
  }

  /**
   * Create an error boundary handler for React
   */
  createReactErrorHandler() {
    return (error: Error, errorInfo: { componentStack: string }) => {
      this.handleError(error, {
        type: 'react-error-boundary',
        componentStack: errorInfo.componentStack
      })
    }
  }

  /**
   * Create an API error interceptor
   */
  createApiErrorInterceptor() {
    return (error: AppError, request?: { url: string; method: string }) => {
      this.handleError(error, {
        type: 'api-error',
        request
      })
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: unknown): string {
    const appError = ErrorUtils.toAppError(error)
    return ErrorUtils.getUserMessage(appError)
  }
}

// Export singleton instance
export const globalErrorHandler = GlobalErrorHandler.getInstance()