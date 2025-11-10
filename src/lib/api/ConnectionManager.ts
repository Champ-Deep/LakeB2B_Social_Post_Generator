/**
 * ConnectionManager - Manages server connections and validates availability
 * Prevents connection refused errors by validating server readiness
 */

import { serviceContainer } from './ServiceContainer'
import { logger } from '../../utils/logging/logger'

export interface ConnectionState {
  isConnected: boolean
  lastCheckTime: number
  lastError?: string
  retryCount: number
  serverUrl: string
}

export class ConnectionManager {
  private static instance: ConnectionManager
  private state: ConnectionState
  private checkInterval: NodeJS.Timeout | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private listeners: Set<(state: ConnectionState) => void> = new Set()

  private constructor() {
    this.state = {
      isConnected: false,
      lastCheckTime: 0,
      retryCount: 0,
      serverUrl: this.getServerUrl()
    }
  }

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }

  /**
   * Get the server URL, handling different environments
   */
  private getServerUrl(): string {
    if (typeof window !== 'undefined') {
      // Client-side: use current origin
      return window.location.origin
    } else {
      // Server-side: use configured port
      const port = process.env.PORT || '3000'
      return `http://localhost:${port}`
    }
  }

  /**
   * Start monitoring the connection
   */
  async startMonitoring(intervalMs: number = 30000): Promise<void> {
    // Initial check
    await this.checkConnection()

    // Stop any existing monitoring
    this.stopMonitoring()

    // Set up periodic checks
    this.checkInterval = setInterval(async () => {
      await this.checkConnection()
    }, intervalMs)

    logger.info('Connection monitoring started', { intervalMs })
  }

  /**
   * Stop monitoring the connection
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    logger.info('Connection monitoring stopped')
  }

  /**
   * Check the connection to the server
   */
  async checkConnection(): Promise<boolean> {
    try {
      const healthService = serviceContainer.getHealthCheckService()
      const result = await healthService.checkHealth()
      
      if (result.success && result.data?.status === 'ok') {
        this.updateState({
          isConnected: true,
          lastCheckTime: Date.now(),
          lastError: undefined,
          retryCount: 0
        })
        return true
      } else {
        throw new Error(result.error?.message || 'Health check failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      this.updateState({
        isConnected: false,
        lastCheckTime: Date.now(),
        lastError: errorMessage,
        retryCount: this.state.retryCount + 1
      })

      // Schedule reconnection attempt
      this.scheduleReconnect()

      logger.error('Connection check failed', {
        error: errorMessage,
        retryCount: this.state.retryCount
      })

      return false
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return // Already scheduled
    }

    const baseDelay = 5000 // 5 seconds
    const maxDelay = 60000 // 1 minute
    const delay = Math.min(baseDelay * Math.pow(2, this.state.retryCount - 1), maxDelay)

    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null
      logger.info('Attempting reconnection', { retryCount: this.state.retryCount })
      await this.checkConnection()
    }, delay)
  }

  /**
   * Wait for the connection to be established
   */
  async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      if (this.state.isConnected) {
        return true
      }

      const isConnected = await this.checkConnection()
      if (isConnected) {
        return true
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return false
  }

  /**
   * Get the current connection state
   */
  getState(): ConnectionState {
    return { ...this.state }
  }

  /**
   * Subscribe to connection state changes
   */
  subscribe(listener: (state: ConnectionState) => void): () => void {
    this.listeners.add(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<ConnectionState>): void {
    const previousState = { ...this.state }
    this.state = { ...this.state, ...updates }

    // Log state transitions
    if (previousState.isConnected !== this.state.isConnected) {
      logger.info(`Connection state changed: ${this.state.isConnected ? 'Connected' : 'Disconnected'}`)
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.getState())
      } catch (error) {
        logger.error('Error in connection state listener', {
          error: error instanceof Error ? error.message : String(error)
        })
      }
    })
  }

  /**
   * Validate port availability (client-side always returns true)
   */
  async validatePort(port: number): Promise<boolean> {
    // Port validation is handled server-side only
    // Client-side always returns true
    return true
  }

  /**
   * Get recommended port (client-side returns default)
   */
  async getRecommendedPort(): Promise<number> {
    // Port selection is handled server-side only
    // Client-side returns the default port
    return 3000
  }
}

// Export singleton instance
export const connectionManager = ConnectionManager.getInstance()