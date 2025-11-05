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

export default function App({ Component, pageProps }: AppProps) {
  // Initialize logger on app start
  React.useEffect(() => {
    logger.info('Application started', {
      component: 'App',
      additionalData: {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        timestamp: new Date().toISOString()
      }
    })
  }, [])

  return (
    <ChakraProvider theme={theme}>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          logger.fatal('Application-level error', {
            component: 'App',
            action: 'render',
            additionalData: {
              componentStack: errorInfo.componentStack
            }
          }, error)
        }}
      >
        <Component {...pageProps} />
      </ErrorBoundary>
    </ChakraProvider>
  )
}