/**
 * Sentry Server Configuration
 *
 * This file configures Sentry for Node.js (server-side).
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

    // Environment
    environment: process.env.NODE_ENV,

    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',

    // Filter out noisy errors
    ignoreErrors: [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'socket hang up',
    ],

    // Before sending, check if we should filter
    beforeSend(event, hint) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Sentry Server] Would send event:', event.message)
        return null
      }

      return event
    },
  })
}
