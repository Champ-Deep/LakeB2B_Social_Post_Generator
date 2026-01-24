import type { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosError } from 'axios'
import { addLogoOverlay, createPlaceholderImage, createMemeFromTemplate } from '../../utils/server/imageProcessor'
import { rateLimitCheck, applyRateLimitHeaders, RATE_LIMITS } from '../../lib/rateLimit'
import { getSessionFromRequest } from '../../lib/auth/middleware'
import { validateImageGenerationRequest, type ImageGenerationInput } from '../../lib/schemas'
import { optimizeImagePrompt, isLangChainConfigured } from '../../lib/langchain'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Multi-model configuration for retry strategy
interface ImageModel {
  name: string
  endpoint: 'generateContent' | 'predict'
  supportsImageConfig: boolean
}

const IMAGE_MODELS: ImageModel[] = [
  {
    name: 'gemini-2.5-flash-image',      // Gemini 2.5 Flash Image (PRIMARY - Verified)
    endpoint: 'generateContent',
    supportsImageConfig: true
  },
  {
    name: 'gemini-3-pro-image-preview',  // Gemini 3 Pro Image Preview (Fallback)
    endpoint: 'generateContent',
    supportsImageConfig: true
  }
]

interface GenerationResult {
  success: boolean
  imageData?: string
  modelUsed?: string
  error?: Error
  modelsAttempted: string[]
}

// Helper function to call Gemini API with a specific model
async function callGeminiModel(
  model: ImageModel,
  prompt: string,
  apiKey: string
): Promise<{ success: boolean; imageData?: string; error?: Error }> {

  console.log(`[Image Generation] Attempting model: ${model.name}`)

  try {
    if (model.endpoint === 'generateContent') {
      // Standard Gemini generateContent endpoint
      const requestBody: any = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      }

      // Add imageConfig only if supported
      if (model.supportsImageConfig) {
        requestBody.generationConfig.imageConfig = {
          aspectRatio: "1:1"
        }
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model.name}:generateContent`,
        requestBody,
        {
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      )

      // Extract image from response
      if (response.data?.candidates?.[0]?.content?.parts) {
        const parts = response.data.candidates[0].content.parts
        const imagePart = parts.find((part: any) =>
          part.inlineData?.mimeType?.startsWith('image/')
        )

        if (imagePart?.inlineData?.data) {
          console.log(`[Image Generation] SUCCESS with model: ${model.name}`)
          return {
            success: true,
            imageData: `data:image/png;base64,${imagePart.inlineData.data}`
          }
        }
      }

      return { success: false, error: new Error('No image in response') }

    } else if (model.endpoint === 'predict') {
      // Imagen API uses predict endpoint with different structure
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model.name}:predict`,
        {
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1"
          }
        },
        {
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      )

      // Extract image from Imagen response (handles both response formats)
      const prediction = response.data?.predictions?.[0]
      const imageData = prediction?.bytesBase64Encoded || prediction?.image?.imageBytes

      if (imageData) {
        console.log(`[Image Generation] SUCCESS with model: ${model.name}`)
        return {
          success: true,
          imageData: `data:image/png;base64,${imageData}`
        }
      }

      return { success: false, error: new Error('No image in Imagen response') }
    }

    return { success: false, error: new Error('Unknown endpoint type') }

  } catch (err) {
    const error = err as AxiosError

    // Detailed error logging
    const errorDetails = {
      model: model.name,
      status: error.response?.status,
      statusText: error.response?.statusText,
      errorMessage: (error.response?.data as any)?.error?.message,
      errorCode: (error.response?.data as any)?.error?.code,
      timeout: error.code === 'ECONNABORTED'
    }

    console.error(`[Image Generation] Model ${model.name} FAILED:`, JSON.stringify(errorDetails, null, 2))

    return {
      success: false,
      error: new Error(errorDetails.errorMessage || error.message || 'Unknown API error')
    }
  }
}

// Generate image with multi-model retry strategy
async function generateImageWithRetry(
  prompt: string,
  apiKey: string
): Promise<GenerationResult> {
  const modelsAttempted: string[] = []
  let lastError: Error | undefined

  for (const model of IMAGE_MODELS) {
    modelsAttempted.push(model.name)

    const result = await callGeminiModel(model, prompt, apiKey)

    if (result.success && result.imageData) {
      return {
        success: true,
        imageData: result.imageData,
        modelUsed: model.name,
        modelsAttempted
      }
    }

    lastError = result.error
    console.warn(`[Image Generation] Model ${model.name} failed, trying next...`)
  }

  console.error(`[Image Generation] All ${modelsAttempted.length} models failed`)

  return {
    success: false,
    error: lastError,
    modelsAttempted
  }
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check authentication
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to generate images',
      code: 'UNAUTHORIZED'
    })
  }

  // Apply rate limiting
  const rateLimitConfig = RATE_LIMITS.IMAGE_GENERATION_AUTH
  const rateLimitResult = rateLimitCheck(req, rateLimitConfig, authResult.user?.id)

  // Set rate limit headers
  applyRateLimitHeaders(res, rateLimitConfig.max, rateLimitResult.remaining, rateLimitResult.resetTime)

  if (rateLimitResult.limited) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: rateLimitConfig.message,
      retryAfter: rateLimitResult.retryAfter,
      code: 'RATE_LIMITED'
    })
  }

  try {
    // Start timing for analytics
    const startTime = Date.now()

    // Validate request body with Zod schema
    const validationResult = validateImageGenerationRequest(req.body)

    if (!validationResult.success) {
      console.error('[Image Generation] Validation failed:', {
        body: req.body,
        error: validationResult.error
      })
      return res.status(400).json(validationResult.error)
    }

    const {
      prompt,
      style,
      position,
      logoSize,
      logoOpacity,
      logoRotation,
      memeFormat,
      memeTexts
    } = validationResult.data

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key not configured',
        message: 'Please add your Gemini API key to the .env file'
      })
    }

    // Import style configuration
    const { getStylePrompt } = await import('../../types/styles')

    // Get the style-specific prompt
    const stylePrompt = getStylePrompt(style as any)

    // Create the full prompt by combining style requirements with user input
    let fullPrompt = `${stylePrompt}

BUSINESS CONTEXT: ${prompt}

Please create an illustration that incorporates this business context while following all the style requirements above.`

    // Optimize prompt with LangChain if configured
    let promptOptimized = false
    if (isLangChainConfigured()) {
      try {
        const optimizationResult = await optimizeImagePrompt(prompt, style as any)
        if (optimizationResult.success && optimizationResult.optimizedPrompt) {
          fullPrompt = `${stylePrompt}

BUSINESS CONTEXT: ${optimizationResult.optimizedPrompt}

Please create an illustration that incorporates this business context while following all the style requirements above.`
          promptOptimized = true
          console.log('[LangChain] Prompt optimized successfully')
        }
      } catch (langChainError) {
        console.warn('[LangChain] Optimization failed, using original prompt:', langChainError)
      }
    }

    // Handle meme generation differently - use templates instead of AI
    if (style === 'meme') {
      console.log('Generating meme with template:', memeFormat)

      try {
        // Use meme template instead of AI generation
        const memeImage = await createMemeFromTemplate(memeFormat || 'drake', memeTexts)
        const finalImageUrl = await addLogoOverlay(memeImage, {
          style,
          position,
          logoSize,
          logoOpacity,
          logoRotation
        })

        return res.status(200).json({
          imageUrl: finalImageUrl,
          prompt: fullPrompt,
          originalPrompt: prompt,
          style: style,
          duration: Date.now() - startTime,
          message: 'Meme generated successfully with template'
        })
      } catch (memeError) {
        console.error('Meme template error:', memeError)

        // Fallback to placeholder
        const placeholderImage = await createPlaceholderImage(style, prompt)
        const finalImageUrl = await addLogoOverlay(placeholderImage, {
          style,
          position,
          logoSize,
          logoOpacity,
          logoRotation
        })

        return res.status(200).json({
          imageUrl: finalImageUrl,
          prompt: fullPrompt,
          originalPrompt: prompt,
          style: style,
          duration: Date.now() - startTime,
          message: 'Generated placeholder meme (template error)'
        })
      }
    }

    // For non-meme styles, use multi-model retry strategy
    console.log('Starting multi-model image generation...')
    console.log('Full prompt:', fullPrompt)

    const generationResult = await generateImageWithRetry(fullPrompt, GEMINI_API_KEY)

    if (generationResult.success && generationResult.imageData) {
      console.log(`Successfully generated image with model: ${generationResult.modelUsed}`)

      // Add logo overlay to the generated image
      const finalImageUrl = await addLogoOverlay(generationResult.imageData, {
        style,
        position,
        logoSize,
        logoOpacity,
        logoRotation
      })

      return res.status(200).json({
        imageUrl: finalImageUrl,
        prompt: fullPrompt,
        originalPrompt: prompt,
        style: style,
        fallback: false,
        modelUsed: generationResult.modelUsed,
        modelsAttempted: generationResult.modelsAttempted,
        promptOptimized,
        duration: Date.now() - startTime,
        message: `Image generated successfully with ${generationResult.modelUsed}`
      })
    }

    // All models failed - use placeholder as fallback
    console.warn('All image generation models failed, using placeholder')

    const placeholderImage = await createPlaceholderImage(style, prompt)
    const finalImageUrl = await addLogoOverlay(placeholderImage, {
      style,
      position,
      logoSize,
      logoOpacity,
      logoRotation
    })

    return res.status(200).json({
      imageUrl: finalImageUrl,
      prompt: fullPrompt,
      originalPrompt: prompt,
      style: style,
      fallback: true,
      fallbackReason: generationResult.error?.message || 'All image generation models failed',
      modelsAttempted: generationResult.modelsAttempted,
      promptOptimized,
      duration: Date.now() - startTime,
      message: 'Generated placeholder image (AI temporarily unavailable)'
    })

  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    console.error('Generate image error:', errorObj.message)

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined
    })
  }
}