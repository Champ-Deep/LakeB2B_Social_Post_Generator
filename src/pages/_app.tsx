import '@fontsource/montserrat/300.css'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'

import React from 'react'
import type { AppProps } from 'next/app'
import { ChakraProvider } from '@chakra-ui/react'
import { theme } from '../theme/chakra-theme'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { logger } from '../utils/logging/logger'
import { globalErrorHandler } from '../lib/errors/GlobalErrorHandler'
import { connectionManager } from '../lib/api/ConnectionManager'
import { ConnectionStatus } from '../components/ConnectionStatus'
import { appConfig } from '../lib/config/AppConfig'

export default function App({ Component, pageProps }: AppProps) {
  // Initialize global systems on app start
  React.useEffect(() => {
    // Initialize global error handler
    globalErrorHandler.initialize()
    
    // Start connection monitoring
    if (appConfig.get('features').enableAutoReconnect) {
      connectionManager.startMonitoring(appConfig.get('connection').checkInterval)
    }
    
    logger.info('Application started', {
      component: 'App',
      additionalData: {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
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
      <ErrorBoundary
        onError={globalErrorHandler.createReactErrorHandler()}
      >
        <Component {...pageProps} />
        <ConnectionStatus />
      </ErrorBoundary>
    </ChakraProvider>
  )
}