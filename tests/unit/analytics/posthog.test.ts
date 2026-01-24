/**
 * PostHog Analytics Module Tests
 *
 * Comprehensive unit tests for PostHog integration.
 * Tests cover event tracking, user identification, and configuration handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import posthog from 'posthog-js'

// Mock posthog-js - define inline to avoid hoisting issues
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  },
}))

// Import after mock is set up
import {
  initPostHog,
  identifyUser,
  resetUser,
  trackEvent,
  trackImageGeneration,
  trackSocialShare,
  trackFeatureUsage,
  trackStyleSelection,
  trackEngagement,
} from '../../../src/lib/analytics/posthog'

// Get the mocked posthog for assertions
const mockPostHog = vi.mocked(posthog)

describe('PostHog Analytics', () => {
  const originalWindow = global.window

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    vi.resetModules()

    // Mock window object
    global.window = {
      ...originalWindow,
    } as any

    // Set default environment variables
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'test-key')
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://test.posthog.com')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    global.window = originalWindow
  })

  describe('initPostHog', () => {
    it('should initialize PostHog with correct configuration', () => {
      initPostHog()

      expect(mockPostHog.init).toHaveBeenCalledWith('test-key', {
        api_host: 'https://test.posthog.com',
        capture_pageview: true,
        capture_pageleave: true,
        persistence: 'localStorage',
        loaded: expect.any(Function),
      })
    })

    it('should use default host when NEXT_PUBLIC_POSTHOG_HOST is not set', () => {
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', '')

      initPostHog()

      expect(mockPostHog.init).toHaveBeenCalledWith(
        'test-key',
        expect.objectContaining({
          api_host: 'https://us.i.posthog.com',
        })
      )
    })

    it('should not initialize when PostHog key is not configured', () => {
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '')

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      initPostHog()

      expect(mockPostHog.init).not.toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[PostHog] Not configured - analytics disabled'
      )

      consoleLogSpy.mockRestore()
    })

    it('should not initialize when window is undefined (SSR)', () => {
      global.window = undefined as any

      initPostHog()

      expect(mockPostHog.init).not.toHaveBeenCalled()
    })

    it('should log in development mode when loaded', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      initPostHog()

      // Get the loaded callback from the init call
      const initCall = mockPostHog.init.mock.calls[0]
      const config = initCall[1]
      const loadedCallback = config.loaded

      // Call the loaded callback
      loadedCallback(mockPostHog)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[PostHog] Initialized in development mode'
      )

      consoleLogSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('identifyUser', () => {
    it('should identify user with userId and properties', () => {
      identifyUser('user-123', {
        email: 'test@example.com',
        name: 'Test User',
      })

      expect(mockPostHog.identify).toHaveBeenCalledWith('user-123', {
        email: 'test@example.com',
        name: 'Test User',
      })
    })

    it('should identify user with just userId', () => {
      identifyUser('user-456')

      expect(mockPostHog.identify).toHaveBeenCalledWith('user-456', undefined)
    })

    it('should not identify when PostHog is not configured', () => {
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '')

      identifyUser('user-123', { email: 'test@example.com' })

      expect(mockPostHog.identify).not.toHaveBeenCalled()
    })
  })

  describe('resetUser', () => {
    it('should reset user identity', () => {
      resetUser()

      expect(mockPostHog.reset).toHaveBeenCalled()
    })

    it('should not reset when PostHog is not configured', () => {
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '')

      resetUser()

      expect(mockPostHog.reset).not.toHaveBeenCalled()
    })
  })

  describe('trackEvent', () => {
    it('should track event with properties', () => {
      trackEvent('custom_event', { property: 'value' })

      expect(mockPostHog.capture).toHaveBeenCalledWith('custom_event', {
        property: 'value',
      })
    })

    it('should track event without properties', () => {
      trackEvent('simple_event')

      expect(mockPostHog.capture).toHaveBeenCalledWith('simple_event', undefined)
    })

    it('should log events in development when PostHog is not configured', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '')

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      trackEvent('test_event', { test: 'data' })

      expect(mockPostHog.capture).not.toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith('[Analytics] test_event', {
        test: 'data',
      })

      consoleLogSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    it('should not log events in production when PostHog is not configured', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '')

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      trackEvent('test_event', { test: 'data' })

      expect(mockPostHog.capture).not.toHaveBeenCalled()
      expect(consoleLogSpy).not.toHaveBeenCalled()

      consoleLogSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('trackImageGeneration', () => {
    it('should send correct event shape with all properties', () => {
      const properties = {
        style: 'corporate',
        memeFormat: 'drake',
        hasCustomLogo: true,
        logoPosition: 'bottom-left',
        success: true,
        modelUsed: 'gemini-pro-vision',
        duration: 2500,
      }

      trackImageGeneration(properties)

      expect(mockPostHog.capture).toHaveBeenCalledWith('image_generated', {
        ...properties,
        timestamp: expect.any(String),
      })

      // Verify timestamp is ISO format
      const callArgs = mockPostHog.capture.mock.calls[0][1]
      expect(callArgs.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
      )
    })

    it('should send correct event shape with minimal properties', () => {
      const properties = {
        style: 'professional',
        success: false,
      }

      trackImageGeneration(properties)

      expect(mockPostHog.capture).toHaveBeenCalledWith('image_generated', {
        style: 'professional',
        success: false,
        timestamp: expect.any(String),
      })
    })

    it('should include timestamp in ISO format', () => {
      trackImageGeneration({ style: 'modern', success: true })

      const callArgs = mockPostHog.capture.mock.calls[0][1]
      const timestamp = new Date(callArgs.timestamp)

      expect(timestamp.toISOString()).toBe(callArgs.timestamp)
    })
  })

  describe('trackSocialShare', () => {
    it('should send platform correctly for LinkedIn', () => {
      trackSocialShare({
        platform: 'linkedin',
        style: 'professional',
        success: true,
      })

      expect(mockPostHog.capture).toHaveBeenCalledWith('social_share', {
        platform: 'linkedin',
        style: 'professional',
        success: true,
      })
    })

    it('should send platform correctly for Twitter', () => {
      trackSocialShare({
        platform: 'twitter',
        success: true,
      })

      expect(mockPostHog.capture).toHaveBeenCalledWith('social_share', {
        platform: 'twitter',
        success: true,
      })
    })

    it('should send platform correctly for Facebook', () => {
      trackSocialShare({
        platform: 'facebook',
        style: 'modern',
        success: false,
      })

      expect(mockPostHog.capture).toHaveBeenCalledWith('social_share', {
        platform: 'facebook',
        style: 'modern',
        success: false,
      })
    })

    it('should send platform correctly for copy_link', () => {
      trackSocialShare({
        platform: 'copy_link',
        success: true,
      })

      expect(mockPostHog.capture).toHaveBeenCalledWith('social_share', {
        platform: 'copy_link',
        success: true,
      })
    })
  })

  describe('trackStyleSelection', () => {
    it('should include previous style when provided', () => {
      trackStyleSelection('modern', 'professional')

      expect(mockPostHog.capture).toHaveBeenCalledWith('style_selected', {
        style: 'modern',
        previousStyle: 'professional',
      })
    })

    it('should handle missing previous style', () => {
      trackStyleSelection('corporate')

      expect(mockPostHog.capture).toHaveBeenCalledWith('style_selected', {
        style: 'corporate',
        previousStyle: undefined,
      })
    })

    it('should track style changes correctly', () => {
      trackStyleSelection('vibrant', 'minimal')

      expect(mockPostHog.capture).toHaveBeenCalledWith('style_selected', {
        style: 'vibrant',
        previousStyle: 'minimal',
      })
    })
  })

  describe('trackFeatureUsage', () => {
    it('should send feature name correctly', () => {
      trackFeatureUsage('logo_upload')

      expect(mockPostHog.capture).toHaveBeenCalledWith('feature_used', {
        feature: 'logo_upload',
      })
    })

    it('should send feature name with additional properties', () => {
      trackFeatureUsage('meme_template', {
        templateType: 'drake',
        customization: true,
      })

      expect(mockPostHog.capture).toHaveBeenCalledWith('feature_used', {
        feature: 'meme_template',
        templateType: 'drake',
        customization: true,
      })
    })

    it('should handle different feature types', () => {
      const features = [
        'prompt_suggestions',
        'style_presets',
        'image_download',
        'social_share',
      ]

      features.forEach((feature) => {
        trackFeatureUsage(feature)
      })

      expect(mockPostHog.capture).toHaveBeenCalledTimes(features.length)

      features.forEach((feature, index) => {
        expect(mockPostHog.capture).toHaveBeenNthCalledWith(
          index + 1,
          'feature_used',
          { feature }
        )
      })
    })
  })

  describe('trackEngagement', () => {
    it('should track like action on post', () => {
      trackEngagement('like', 'post', 'post-123')

      expect(mockPostHog.capture).toHaveBeenCalledWith('user_engagement', {
        action: 'like',
        contentType: 'post',
        contentId: 'post-123',
      })
    })

    it('should track download action on image', () => {
      trackEngagement('download', 'image', 'img-456')

      expect(mockPostHog.capture).toHaveBeenCalledWith('user_engagement', {
        action: 'download',
        contentType: 'image',
        contentId: 'img-456',
      })
    })

    it('should track share action without contentId', () => {
      trackEngagement('share', 'post')

      expect(mockPostHog.capture).toHaveBeenCalledWith('user_engagement', {
        action: 'share',
        contentType: 'post',
        contentId: undefined,
      })
    })

    it('should track view action on image', () => {
      trackEngagement('view', 'image', 'img-789')

      expect(mockPostHog.capture).toHaveBeenCalledWith('user_engagement', {
        action: 'view',
        contentType: 'image',
        contentId: 'img-789',
      })
    })
  })

  describe('No-op behavior when PostHog is not configured', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '')
    })

    it('should not call PostHog for trackImageGeneration', () => {
      trackImageGeneration({ style: 'modern', success: true })

      expect(mockPostHog.capture).not.toHaveBeenCalled()
    })

    it('should not call PostHog for trackSocialShare', () => {
      trackSocialShare({ platform: 'linkedin', success: true })

      expect(mockPostHog.capture).not.toHaveBeenCalled()
    })

    it('should not call PostHog for trackStyleSelection', () => {
      trackStyleSelection('modern', 'professional')

      expect(mockPostHog.capture).not.toHaveBeenCalled()
    })

    it('should not call PostHog for trackFeatureUsage', () => {
      trackFeatureUsage('logo_upload')

      expect(mockPostHog.capture).not.toHaveBeenCalled()
    })

    it('should not call PostHog for trackEngagement', () => {
      trackEngagement('like', 'post', 'post-123')

      expect(mockPostHog.capture).not.toHaveBeenCalled()
    })

    it('should not call PostHog for identifyUser', () => {
      identifyUser('user-123', { email: 'test@example.com' })

      expect(mockPostHog.identify).not.toHaveBeenCalled()
    })

    it('should not call PostHog for resetUser', () => {
      resetUser()

      expect(mockPostHog.reset).not.toHaveBeenCalled()
    })
  })

  describe('Edge cases', () => {
    it('should handle empty string properties', () => {
      trackImageGeneration({
        style: '',
        success: true,
      })

      expect(mockPostHog.capture).toHaveBeenCalledWith('image_generated', {
        style: '',
        success: true,
        timestamp: expect.any(String),
      })
    })

    it('should handle zero duration', () => {
      trackImageGeneration({
        style: 'modern',
        success: true,
        duration: 0,
      })

      expect(mockPostHog.capture).toHaveBeenCalledWith('image_generated', {
        style: 'modern',
        success: true,
        duration: 0,
        timestamp: expect.any(String),
      })
    })

    it('should handle boolean false values', () => {
      trackImageGeneration({
        style: 'modern',
        hasCustomLogo: false,
        success: false,
      })

      expect(mockPostHog.capture).toHaveBeenCalledWith('image_generated', {
        style: 'modern',
        hasCustomLogo: false,
        success: false,
        timestamp: expect.any(String),
      })
    })

    it('should handle undefined optional properties', () => {
      trackImageGeneration({
        style: 'modern',
        success: true,
        memeFormat: undefined,
        modelUsed: undefined,
      })

      expect(mockPostHog.capture).toHaveBeenCalledWith('image_generated', {
        style: 'modern',
        success: true,
        memeFormat: undefined,
        modelUsed: undefined,
        timestamp: expect.any(String),
      })
    })
  })
})
