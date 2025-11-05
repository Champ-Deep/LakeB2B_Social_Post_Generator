/**
 * React Error Boundary Component
 * Catches and handles React component errors gracefully
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Box, VStack, Heading, Text, Button, Alert, AlertIcon } from '@chakra-ui/react'
import { logger } from '../utils/logging/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    logger.componentError(
      'ErrorBoundary',
      'componentDidCatch',
      error,
      {
        additionalData: {
          componentStack: errorInfo.componentStack,
          errorBoundary: this.constructor.name
        }
      }
    )

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    this.setState({ errorInfo })
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <Box p={6} maxW="600px" mx="auto" mt={8}>
          <Alert status="error" borderRadius="md" mb={4}>
            <AlertIcon />
            Something went wrong with this component
          </Alert>
          
          <VStack spacing={4} align="stretch">
            <Heading size="md" color="red.600">
              Oops! Something went wrong
            </Heading>
            
            <Text color="gray.600">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </Text>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                bg="red.50"
                border="1px"
                borderColor="red.200"
                borderRadius="md"
                p={4}
                fontSize="sm"
                fontFamily="mono"
                maxH="200px"
                overflowY="auto"
              >
                <Text fontWeight="bold" color="red.700" mb={2}>
                  Error Details (Development Only):
                </Text>
                <Text color="red.600">
                  {this.state.error.name}: {this.state.error.message}
                </Text>
                {this.state.error.stack && (
                  <Text mt={2} fontSize="xs" color="red.500">
                    {this.state.error.stack}
                  </Text>
                )}
              </Box>
            )}

            <VStack spacing={2}>
              <Button
                colorScheme="blue"
                onClick={this.handleRetry}
                size="sm"
              >
                Try Again
              </Button>
              
              <Button
                variant="outline"
                onClick={this.handleReload}
                size="sm"
              >
                Reload Page
              </Button>
            </VStack>
          </VStack>
        </Box>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Hook for handling async errors in functional components
 */
export function useAsyncError() {
  const [, setError] = React.useState()
  
  return React.useCallback((error: Error) => {
    logger.componentError(
      'AsyncErrorHandler',
      'useAsyncError',
      error,
      { additionalData: { source: 'async-hook' } }
    )
    
    setError(() => {
      throw error
    })
  }, [])
}