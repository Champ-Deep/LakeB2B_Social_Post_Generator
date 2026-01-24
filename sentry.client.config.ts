/**
 * Sentry Client Configuration
 *
 * This file configures Sentry for the browser (client-side).
 * It's automatically loaded by @sentry/nextjs.
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

// Only initialize if DSN is configured
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1, // Sample 10% of sessions
    replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors

    // Environment
    environment: process.env.NODE_ENV,

    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',

    // Don't send PII
    sendDefaultPii: false,

    // Filter out noisy errors
    ignoreErrors: [
      // Browser extensions
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
      // Network errors
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      // User cancelled
      'AbortError',
      // Rate limiting
      'Rate limit exceeded',
    ],

    // Before sending, check if we should filter
    beforeSend(event, hint) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Sentry] Would send event:', event)
        return null
      }

      // Filter out certain error types
      const error = hint.originalException as Error
      if (error?.message?.includes('ResizeObserver')) {
        return null // Ignore ResizeObserver errors
      }

      return event
    },

    // Integrations
    integrations: [
      Sentry.replayIntegration({
        // Mask all text for privacy
        maskAllText: false,
        // Block all media
        blockAllMedia: false,
      }),
    ],
  })
}
