/**
 * Schema Validation Tests
 *
 * Tests for Zod validation schemas
 */

import { describe, it, expect } from 'vitest'
import {
  imageGenerationSchema,
  validateImageGenerationRequest,
  linkedinPostSchema,
  validateLinkedInPostRequest,
  savePostSchema,
  validateSavePostRequest,
  postHistoryQuerySchema,
} from '@/lib/schemas'

describe('Image Generation Schema', () => {
  describe('imageGenerationSchema', () => {
    it('validates valid input with required fields only', () => {
      const result = imageGenerationSchema.safeParse({
        prompt: 'A professional B2B marketing image',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.prompt).toBe('A professional B2B marketing image')
        expect(result.data.style).toBe('isometric') // default
        expect(result.data.position).toBe('bottom-left') // default
        expect(result.data.logoSize).toBe(35) // default
      }
    })

    it('validates valid input with all fields', () => {
      const result = imageGenerationSchema.safeParse({
        prompt: 'Data analytics dashboard',
        style: 'infographic',
        position: 'top-right',
        logoSize: 50,
        logoOpacity: 75,
        logoRotation: 15,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.style).toBe('infographic')
        expect(result.data.position).toBe('top-right')
        expect(result.data.logoSize).toBe(50)
      }
    })

    it('rejects empty prompt', () => {
      const result = imageGenerationSchema.safeParse({
        prompt: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing prompt', () => {
      const result = imageGenerationSchema.safeParse({
        style: 'isometric',
      })
      expect(result.success).toBe(false)
    })

    it('rejects prompt over 500 characters', () => {
      const result = imageGenerationSchema.safeParse({
        prompt: 'a'.repeat(501),
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid style', () => {
      const result = imageGenerationSchema.safeParse({
        prompt: 'Valid prompt',
        style: 'invalid-style',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid position', () => {
      const result = imageGenerationSchema.safeParse({
        prompt: 'Valid prompt',
        position: 'center',
      })
      expect(result.success).toBe(false)
    })

    it('rejects logoSize outside range', () => {
      const result = imageGenerationSchema.safeParse({
        prompt: 'Valid prompt',
        logoSize: 150,
      })
      expect(result.success).toBe(false)
    })

    it('trims whitespace from prompt', () => {
      const result = imageGenerationSchema.safeParse({
        prompt: '  Test prompt with whitespace  ',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.prompt).toBe('Test prompt with whitespace')
      }
    })

    it('requires memeFormat when style is meme', () => {
      const result = imageGenerationSchema.safeParse({
        prompt: 'Valid prompt',
        style: 'meme',
      })
      expect(result.success).toBe(false)
    })

    it('accepts meme style with memeFormat', () => {
      const result = imageGenerationSchema.safeParse({
        prompt: 'Valid prompt',
        style: 'meme',
        memeFormat: 'drake',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('validateImageGenerationRequest', () => {
    it('returns success with valid data', () => {
      const result = validateImageGenerationRequest({
        prompt: 'Test prompt',
        style: 'isometric',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.prompt).toBe('Test prompt')
      }
    })

    it('returns error with proper code for missing prompt', () => {
      const result = validateImageGenerationRequest({})
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toMatch(/PROMPT|INPUT/)
      }
    })
  })
})

describe('LinkedIn Schema', () => {
  describe('linkedinPostSchema', () => {
    it('validates valid post data', () => {
      const result = linkedinPostSchema.safeParse({
        imageData: 'data:image/png;base64,abc123',
        postText: 'Check out this amazing insight!',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.visibility).toBe('PUBLIC') // default
      }
    })

    it('accepts CONNECTIONS visibility', () => {
      const result = linkedinPostSchema.safeParse({
        imageData: 'data:image/png;base64,abc123',
        postText: 'Private post',
        visibility: 'CONNECTIONS',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.visibility).toBe('CONNECTIONS')
      }
    })

    it('rejects empty imageData', () => {
      const result = linkedinPostSchema.safeParse({
        imageData: '',
        postText: 'Valid text',
      })
      expect(result.success).toBe(false)
    })

    it('rejects post text over 3000 characters', () => {
      const result = linkedinPostSchema.safeParse({
        imageData: 'data:image/png;base64,abc123',
        postText: 'a'.repeat(3001),
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid visibility', () => {
      const result = linkedinPostSchema.safeParse({
        imageData: 'data:image/png;base64,abc123',
        postText: 'Valid text',
        visibility: 'PRIVATE',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('validateLinkedInPostRequest', () => {
    it('returns correct error code for missing image', () => {
      const result = validateLinkedInPostRequest({
        postText: 'Valid text',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toMatch(/IMAGE|INPUT/)
      }
    })
  })
})

describe('Posts Schema', () => {
  describe('savePostSchema', () => {
    it('validates minimal valid input', () => {
      const result = savePostSchema.safeParse({
        imageUrl: 'https://example.com/image.png',
        prompt: 'Test prompt',
        style: 'isometric',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isPublic).toBe(false) // default
      }
    })

    it('validates full input', () => {
      const result = savePostSchema.safeParse({
        imageUrl: 'https://example.com/image.png',
        prompt: 'Test prompt',
        style: 'isometric',
        headline: 'Great headline',
        logoSize: '50',
        logoOpacity: '75',
        isPublic: true,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.logoSize).toBe(50) // transformed from string
        expect(result.data.isPublic).toBe(true)
      }
    })

    it('rejects missing required fields', () => {
      const result = savePostSchema.safeParse({
        prompt: 'Test',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('postHistoryQuerySchema', () => {
    it('provides defaults for empty query', () => {
      const result = postHistoryQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
        expect(result.data.sortBy).toBe('createdAt')
        expect(result.data.sortOrder).toBe('desc')
      }
    })

    it('transforms string numbers', () => {
      const result = postHistoryQuerySchema.safeParse({
        page: '3',
        limit: '50',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(3)
        expect(result.data.limit).toBe(50)
      }
    })

    it('rejects limit over 100', () => {
      const result = postHistoryQuerySchema.safeParse({
        limit: '150',
      })
      expect(result.success).toBe(false)
    })
  })
})
