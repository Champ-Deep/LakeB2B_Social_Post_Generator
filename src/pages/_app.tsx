import '@fontsource/montserrat/300.css'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'

import React from 'react'
import type { AppProps } from 'next/app'
import { ChakraProvider } from '@chakra-ui/react'
import { Toaster } from 'react-hot-toast'
import { theme } from '../theme/chakra-theme'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { AuthProvider } from '../contexts/AuthContext'
import { logger } from '../utils/logging/logger'
import { globalErrorHandler } from '../lib/errors/GlobalErrorHandler'
import { connectionManager } from '../lib/api/ConnectionManager'
import { ConnectionStatus } from '../components/ConnectionStatus'
import { GubeyProvider, GubeyButton } from '../components/Gubey'
import { appConfig } from '../lib/config/AppConfig'
import { initPostHog } from '../lib/analytics/posthog'

export default function App({ Component, pageProps }: AppProps) {
  // Initialize global systems on app start (client-side only)
  React.useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return
    }
    
    // Initialize global error handler
    globalErrorHandler.initialize()

    // Initialize PostHog analytics
    initPostHog()

    // Start connection monitoring
    if (appConfig.get('features').enableAutoReconnect) {
      connectionManager.startMonitoring(appConfig.get('connection').checkInterval)
    }
    
    logger.info('Application started', {
      component: 'App',
      additionalData: {
        userAgent: window.navigator.userAgent,
        timestamp: new Date().toISOString(),
        config: {
          autoReconnect: appConfig.get('features').enableAutoReconnect,
          environment: appConfig.isDevelopment() ? 'development' : 'production'
        }
      }
    })
    
    // Cleanup on unmount
    return () => {
      connectionManager.stopMonitoring()
    }
  }, [])

  return (
    <ChakraProvider theme={theme}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#6D08BE',
              secondary: '#fff',
            },
            style: {
              background: '#1a1a2e',
              border: '1px solid #6D08BE',
            },
          },
          error: {
            iconTheme: {
              primary: '#DD1286',
              secondary: '#fff',
            },
            style: {
              background: '#1a1a2e',
              border: '1px solid #DD1286',
            },
          },
        }}
      />
      <AuthProvider>
        <GubeyProvider>
          <ErrorBoundary
            onError={globalErrorHandler.createReactErrorHandler()}
          >
            <Component {...pageProps} />
            <ConnectionStatus />
            <GubeyButton />
          </ErrorBoundary>
        </GubeyProvider>
      </AuthProvider>
    </ChakraProvider>
  )
}