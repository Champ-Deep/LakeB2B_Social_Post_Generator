/**
 * useConnectionHealth - React hook for monitoring server connection health
 * Provides real-time connection status and automatic reconnection
 */

import { useState, useEffect, useCallback } from 'react'
import { connectionManager, ConnectionState } from '../lib/api/ConnectionManager'
import { globalErrorHandler } from '../lib/errors/GlobalErrorHandler'
import { useToast } from '@chakra-ui/react'
import { logger } from '../utils/logging/logger'

export interface ConnectionHealthState {
  isConnected: boolean
  isChecking: boolean
  lastError?: string
  retryCount: number
  lastCheckTime?: Date
}

export interface UseConnectionHealthOptions {
  enableAutoReconnect?: boolean
  checkInterval?: number
  showToasts?: boolean
}

export function useConnectionHealth(options: UseConnectionHealthOptions = {}) {
  const {
    enableAutoReconnect = true,
    checkInterval = 30000,
    showToasts = true
  } = options

  const toast = useToast()
  const [state, setState] = useState<ConnectionHealthState>({
    isConnected: false,
    isChecking: true,
    retryCount: 0
  })

  // Manual connection check
  const checkConnection = useCallback(async () => {
    setState(prev => ({ ...prev, isChecking: true }))
    
    try {
      const isConnected = await connectionManager.checkConnection()
      const connectionState = connectionManager.getState()
      
      setState({
        isConnected,
        isChecking: false,
        lastError: connectionState.lastError,
        retryCount: connectionState.retryCount,
        lastCheckTime: new Date(connectionState.lastCheckTime)
      })

      return isConnected
    } catch (error) {
      logger.error('Connection check failed in hook', {
        error: error instanceof Error ? error.message : String(error)
      })
      setState(prev => ({
        ...prev,
        isChecking: false,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }))
      return false
    }
  }, [])

  // Subscribe to connection state changes
  useEffect(() => {
    let previousConnected = state.isConnected

    const unsubscribe = connectionManager.subscribe((connectionState: ConnectionState) => {
      const newState: ConnectionHealthState = {
        isConnected: connectionState.isConnected,
        isChecking: false,
        lastError: connectionState.lastError,
        retryCount: connectionState.retryCount,
        lastCheckTime: new Date(connectionState.lastCheckTime)
      }

      setState(newState)

      // Show toasts for connection state changes
      if (showToasts && previousConnected !== connectionState.isConnected) {
        if (connectionState.isConnected) {
          toast({
            title: 'Connection Restored',
            description: 'Successfully connected to the server',
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
        } else {
          toast({
            title: 'Connection Lost',
            description: connectionState.lastError || 'Unable to connect to the server',
            status: 'error',
            duration: null, // Keep it visible
            isClosable: true,
          })
        }
      }

      previousConnected = connectionState.isConnected
    })

    return unsubscribe
  }, [showToasts, toast, state.isConnected])

  // Start monitoring on mount
  useEffect(() => {
    if (enableAutoReconnect) {
      connectionManager.startMonitoring(checkInterval)
    } else {
      // Just do an initial check
      checkConnection()
    }

    return () => {
      if (enableAutoReconnect) {
        // Don't stop monitoring on unmount - let it continue globally
        // connectionManager.stopMonitoring()
      }
    }
  }, [enableAutoReconnect, checkInterval, checkConnection])

  // Retry connection
  const retry = useCallback(async () => {
    if (showToasts) {
      toast({
        title: 'Retrying Connection',
        description: 'Attempting to reconnect to the server...',
        status: 'info',
        duration: 2000,
        isClosable: true,
      })
    }

    return checkConnection()
  }, [checkConnection, showToasts, toast])

  // Wait for connection with timeout
  const waitForConnection = useCallback(async (timeoutMs: number = 30000) => {
    setState(prev => ({ ...prev, isChecking: true }))
    
    const isConnected = await connectionManager.waitForConnection(timeoutMs)
    
    setState(prev => ({ ...prev, isChecking: false }))
    
    if (!isConnected && showToasts) {
      toast({
        title: 'Connection Timeout',
        description: 'Could not establish connection to the server',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
    
    return isConnected
  }, [showToasts, toast])

  return {
    ...state,
    checkConnection,
    retry,
    waitForConnection,
    connectionManager
  }
}