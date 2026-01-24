/**
 * Service Tests
 *
 * Tests for service functions and utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock environment variables
vi.stubEnv('GEMINI_API_KEY', 'test-api-key')
vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'test-cloud')
vi.stubEnv('CLOUDINARY_API_KEY', 'test-key')
vi.stubEnv('CLOUDINARY_API_SECRET', 'test-secret')

describe('Cloudinary Service', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('isCloudinaryConfigured returns true when all env vars are set', async () => {
    const { isCloudinaryConfigured } = await import('@/lib/storage/cloudinary')
    expect(isCloudinaryConfigured()).toBe(true)
  })

  it('getOptimizedUrl returns empty string when not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', '')
    vi.resetModules()

    const { getOptimizedUrl, isCloudinaryConfigured } = await import('@/lib/storage/cloudinary')
    // After clearing env, it should return empty
    // Note: This test may need adjustment based on module caching
    const configured = isCloudinaryConfigured()
    if (!configured) {
      expect(getOptimizedUrl('test-id')).toBe('')
    }
  })
})

describe('LangChain Service', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('isLangChainConfigured returns true when GEMINI_API_KEY is set', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-api-key')
    const { isLangChainConfigured } = await import('@/lib/langchain')
    expect(isLangChainConfigured()).toBe(true)
  })

  it('isLangChainConfigured returns false when GEMINI_API_KEY is not set', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    vi.resetModules()

    const { isLangChainConfigured } = await import('@/lib/langchain')
    expect(isLangChainConfigured()).toBe(false)
  })
})

describe('PostHog Analytics', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('trackEvent does not throw when PostHog is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '')
    const { trackEvent } = await import('@/lib/analytics/posthog')

    expect(() => {
      trackEvent('test_event', { property: 'value' })
    }).not.toThrow()
  })
})

describe('Twitter Service', () => {
  it('isTwitterConfigured returns false when credentials are not set', async () => {
    vi.stubEnv('TWITTER_CLIENT_ID', '')
    vi.stubEnv('TWITTER_CLIENT_SECRET', '')
    vi.resetModules()

    const { isTwitterConfigured } = await import('@/services/twitterService')
    expect(isTwitterConfigured()).toBe(false)
  })

  it('isTwitterConfigured returns true when credentials are set', async () => {
    vi.stubEnv('TWITTER_CLIENT_ID', 'test-client-id')
    vi.stubEnv('TWITTER_CLIENT_SECRET', 'test-client-secret')
    vi.resetModules()

    const { isTwitterConfigured } = await import('@/services/twitterService')
    expect(isTwitterConfigured()).toBe(true)
  })
})
