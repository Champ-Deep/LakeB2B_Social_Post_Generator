/**
 * Image Generation Worker
 *
 * Processes image generation jobs from the queue.
 * This worker should be run as a separate process in production.
 */

import { Job } from 'bullmq'
import axios, { AxiosError } from 'axios'
import { createWorker, QUEUE_NAMES } from '../queueClient'
import type {
  ImageGenerationJobData,
  ImageGenerationJobResult,
} from '../queues/imageGenerationQueue'

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Model configuration
interface ImageModel {
  name: string
  endpoint: 'generateContent' | 'predict'
  supportsImageConfig: boolean
}

const IMAGE_MODELS: ImageModel[] = [
  {
    name: 'gemini-2.5-flash-image',
    endpoint: 'generateContent',
    supportsImageConfig: true,
  },
  {
    name: 'gemini-3-pro-image-preview',
    endpoint: 'generateContent',
    supportsImageConfig: true,
  },
]

/**
 * Call a specific Gemini model to generate an image
 */
async function callGeminiModel(
  model: ImageModel,
  prompt: string,
  apiKey: string
): Promise<{ success: boolean; imageData?: string; error?: Error }> {
  console.log(`[Worker] Attempting model: ${model.name}`)

  try {
    if (model.endpoint === 'generateContent') {
      const requestBody: Record<string, unknown> = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          ...(model.supportsImageConfig && {
            imageConfig: { aspectRatio: '1:1' },
          }),
        },
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model.name}:generateContent`,
        requestBody,
        {
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      )

      const parts = response.data?.candidates?.[0]?.content?.parts
      const imagePart = parts?.find(
        (part: { inlineData?: { mimeType: string; data: string } }) =>
          part.inlineData?.mimeType?.startsWith('image/')
      )

      if (imagePart?.inlineData?.data) {
        console.log(`[Worker] SUCCESS with model: ${model.name}`)
        return {
          success: true,
          imageData: `data:image/png;base64,${imagePart.inlineData.data}`,
        }
      }

      return { success: false, error: new Error('No image in response') }
    } else if (model.endpoint === 'predict') {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model.name}:predict`,
        {
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: '1:1' },
        },
        {
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      )

      const prediction = response.data?.predictions?.[0]
      const imageData =
        prediction?.bytesBase64Encoded || prediction?.image?.imageBytes

      if (imageData) {
        console.log(`[Worker] SUCCESS with model: ${model.name}`)
        return {
          success: true,
          imageData: `data:image/png;base64,${imageData}`,
        }
      }

      return { success: false, error: new Error('No image in Imagen response') }
    }

    return { success: false, error: new Error('Unknown endpoint type') }
  } catch (err) {
    const error = err as AxiosError
    const errorMessage =
      (error.response?.data as { error?: { message?: string } })?.error
        ?.message ||
      error.message ||
      'Unknown API error'

    console.error(`[Worker] Model ${model.name} FAILED:`, errorMessage)
    return { success: false, error: new Error(errorMessage) }
  }
}

/**
 * Generate image with multi-model retry strategy
 */
async function generateImageWithRetry(
  prompt: string,
  apiKey: string,
  onProgress?: (progress: number) => void
): Promise<{
  success: boolean
  imageData?: string
  modelUsed?: string
  error?: Error
}> {
  const totalModels = IMAGE_MODELS.length

  for (let i = 0; i < totalModels; i++) {
    const model = IMAGE_MODELS[i]
    onProgress?.(Math.round(((i + 0.5) / totalModels) * 80)) // 0-80% for generation

    const result = await callGeminiModel(model, prompt, apiKey)

    if (result.success && result.imageData) {
      onProgress?.(80)
      return {
        success: true,
        imageData: result.imageData,
        modelUsed: model.name,
      }
    }

    console.warn(`[Worker] Model ${model.name} failed, trying next...`)
  }

  return {
    success: false,
    error: new Error('All image generation models failed'),
  }
}

/**
 * Process an image generation job
 */
export async function processImageGenerationJob(
  job: Job<ImageGenerationJobData>
): Promise<ImageGenerationJobResult> {
  const startTime = Date.now()
  const { prompt, headline, style, memeFormat } = job.data

  console.log(`[Worker] Processing job ${job.id}: ${prompt.slice(0, 50)}...`)

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  // Update job progress
  await job.updateProgress(10)

  // Import style configuration dynamically
  const { getStylePrompt } = await import('../../../types/styles')
  const stylePrompt = getStylePrompt(style as any)

  // Build the full prompt
  const fullPrompt = `${stylePrompt}

BUSINESS CONTEXT: ${prompt}${headline ? `\n\nHEADLINE: ${headline}` : ''}

Please create an illustration that incorporates this business context while following all the style requirements above.`

  await job.updateProgress(20)

  // Generate the image
  const result = await generateImageWithRetry(
    fullPrompt,
    GEMINI_API_KEY,
    async (progress) => {
      await job.updateProgress(20 + Math.round(progress * 0.6)) // Scale to 20-80%
    }
  )

  await job.updateProgress(85)

  if (!result.success || !result.imageData) {
    throw new Error(result.error?.message || 'Image generation failed')
  }

  // Add logo overlay
  const { addLogoOverlay } = await import(
    '../../../utils/server/imageProcessor'
  )
  const finalImageUrl = await addLogoOverlay(result.imageData, {
    style,
    position: 'bottom-left',
    logoSize: 35,
    logoOpacity: 85,
    logoRotation: 0,
  })

  await job.updateProgress(100)

  const processingTime = Date.now() - startTime
  console.log(`[Worker] Job ${job.id} completed in ${processingTime}ms`)

  return {
    imageUrl: finalImageUrl,
    processingTime,
    cached: false,
  }
}

/**
 * Start the image generation worker
 */
export function startImageGenerationWorker() {
  const worker = createWorker<ImageGenerationJobData, ImageGenerationJobResult>(
    QUEUE_NAMES.IMAGE_GENERATION,
    async (job) => processImageGenerationJob(job as Job<ImageGenerationJobData>),
    {
      concurrency: 2,
      limiter: {
        max: 10,
        duration: 60000, // 10 jobs per minute max
      },
    }
  )

  if (worker) {
    console.log('[Worker] Image generation worker started')

    worker.on('error', (error) => {
      console.error('[Worker] Error:', error)
    })

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[Worker] Shutting down...')
      await worker.close()
      process.exit(0)
    })
  } else {
    console.warn('[Worker] Failed to start - Redis not available')
  }

  return worker
}

// Start worker if run directly
if (require.main === module) {
  startImageGenerationWorker()
}
