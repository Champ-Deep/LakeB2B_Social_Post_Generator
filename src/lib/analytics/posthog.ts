/**
 * PostHog Analytics Integration
 *
 * Product analytics for tracking user behavior and feature usage.
 * Initialize once in _app.tsx, then use trackEvent throughout the app.
 */

import posthog from 'posthog-js'

// Check if PostHog is configured
const isPostHogConfigured = () => {
  return (
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_POSTHOG_KEY &&
    process.env.NEXT_PUBLIC_POSTHOG_KEY !== ''
  )
}

/**
 * Initialize PostHog analytics
 * Call this once in _app.tsx useEffect
 */
export const initPostHog = () => {
  if (!isPostHogConfigured()) {
    console.log('[PostHog] Not configured - analytics disabled')
    return
  }

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    // Capture pageviews automatically
    capture_pageview: true,
    capture_pageleave: true,
    // Respect user privacy settings
    persistence: 'localStorage',
    // Disable in development by default
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        // Uncomment to disable in dev: posthog.opt_out_capturing()
        console.log('[PostHog] Initialized in development mode')
      }
    },
  })
}

/**
 * Identify a user (call after login)
 */
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (!isPostHogConfigured()) return

  posthog.identify(userId, properties)
}

/**
 * Reset user identity (call after logout)
 */
export const resetUser = () => {
  if (!isPostHogConfigured()) return

  posthog.reset()
}

/**
 * Track a custom event
 */
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  if (!isPostHogConfigured()) {
    // Log events in development even without PostHog
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${eventName}`, properties)
    }
    return
  }

  posthog.capture(eventName, properties)
}

/**
 * Track image generation
 */
export const trackImageGeneration = (properties: {
  style: string
  memeFormat?: string
  hasCustomLogo?: boolean
  logoPosition?: string
  success: boolean
  modelUsed?: string
  duration?: number
}) => {
  trackEvent('image_generated', {
    ...properties,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Track social sharing
 */
export const trackSocialShare = (properties: {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'copy_link' | 'whatsapp'
  style?: string
  success: boolean
  contentType?: 'generated_image' | 'post' | string
}) => {
  trackEvent('social_share', properties)
}

/**
 * Track feature usage
 */
export const trackFeatureUsage = (
  feature: string,
  properties?: Record<string, any>
) => {
  trackEvent('feature_used', {
    feature,
    ...properties,
  })
}

/**
 * Track style selection
 */
export const trackStyleSelection = (style: string, previousStyle?: string) => {
  trackEvent('style_selected', {
    style,
    previousStyle,
  })
}

/**
 * Track user engagement
 */
export const trackEngagement = (
  action: 'like' | 'download' | 'share' | 'view',
  contentType: 'post' | 'image',
  contentId?: string
) => {
  trackEvent('user_engagement', {
    action,
    contentType,
    contentId,
  })
}

// Export the PostHog instance for advanced usage
export { posthog }
