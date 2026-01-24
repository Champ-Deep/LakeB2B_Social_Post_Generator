/**
 * Image Generation Queue
 *
 * Handles async image generation jobs for better scalability.
 * Falls back to synchronous generation when Redis is unavailable.
 */

import { Queue, Job } from 'bullmq'
import { createQueue, createQueueEvents, QUEUE_NAMES, isQueueAvailable } from '../queueClient'

// Job data types
export interface ImageGenerationJobData {
  prompt: string
  headline?: string
  style: string
  memeFormat?: string
  userId?: string
  requestId: string
}

export interface ImageGenerationJobResult {
  imageUrl: string
  processingTime: number
  cached: boolean
}

// Job status types
export type JobStatus = 'queued' | 'active' | 'completed' | 'failed' | 'delayed'

export interface JobStatusResponse {
  jobId: string
  status: JobStatus
  progress?: number
  result?: ImageGenerationJobResult
  error?: string
  createdAt?: number
  processedAt?: number
  finishedAt?: number
  attemptsMade?: number
}

// Singleton queue instance
let imageQueue: Queue<ImageGenerationJobData, ImageGenerationJobResult> | null = null

/**
 * Get or create the image generation queue
 */
export function getImageGenerationQueue(): Queue<ImageGenerationJobData, ImageGenerationJobResult> | null {
  if (imageQueue) {
    return imageQueue
  }

  imageQueue = createQueue<ImageGenerationJobData>(QUEUE_NAMES.IMAGE_GENERATION)
  return imageQueue
}

/**
 * Add an image generation job to the queue
 */
export async function addImageGenerationJob(
  data: ImageGenerationJobData,
  options?: {
    priority?: number
    delay?: number
  }
): Promise<{ jobId: string; queued: boolean } | null> {
  const queue = getImageGenerationQueue()

  if (!queue) {
    console.log('[ImageQueue] Queue not available, will process synchronously')
    return null
  }

  try {
    const job = await queue.add('generate', data, {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
      jobId: data.requestId, // Use requestId as jobId for easy lookup
    })

    console.log(`[ImageQueue] Job ${job.id} added to queue`)

    return {
      jobId: job.id || data.requestId,
      queued: true,
    }
  } catch (error) {
    console.error('[ImageQueue] Failed to add job:', error)
    return null
  }
}

/**
 * Get the status of an image generation job
 */
export async function getJobStatus(jobId: string): Promise<JobStatusResponse | null> {
  const queue = getImageGenerationQueue()

  if (!queue) {
    return null
  }

  try {
    const job = await queue.getJob(jobId)

    if (!job) {
      return null
    }

    const state = await job.getState()
    const progress = job.progress as number | undefined

    const response: JobStatusResponse = {
      jobId: job.id || jobId,
      status: mapJobState(state),
      progress: typeof progress === 'number' ? progress : undefined,
      createdAt: job.timestamp,
      attemptsMade: job.attemptsMade,
    }

    if (state === 'completed') {
      response.result = job.returnvalue as ImageGenerationJobResult
      response.finishedAt = job.finishedOn
      response.processedAt = job.processedOn
    }

    if (state === 'failed') {
      response.error = job.failedReason
      response.finishedAt = job.finishedOn
    }

    return response
  } catch (error) {
    console.error('[ImageQueue] Failed to get job status:', error)
    return null
  }
}

/**
 * Get multiple job statuses
 */
export async function getBulkJobStatus(jobIds: string[]): Promise<Map<string, JobStatusResponse>> {
  const results = new Map<string, JobStatusResponse>()
  const queue = getImageGenerationQueue()

  if (!queue) {
    return results
  }

  await Promise.all(
    jobIds.map(async (jobId) => {
      const status = await getJobStatus(jobId)
      if (status) {
        results.set(jobId, status)
      }
    })
  )

  return results
}

/**
 * Cancel a pending job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  const queue = getImageGenerationQueue()

  if (!queue) {
    return false
  }

  try {
    const job = await queue.getJob(jobId)

    if (!job) {
      return false
    }

    const state = await job.getState()

    // Can only cancel waiting or delayed jobs
    if (state === 'waiting' || state === 'delayed') {
      await job.remove()
      console.log(`[ImageQueue] Job ${jobId} cancelled`)
      return true
    }

    console.log(`[ImageQueue] Cannot cancel job ${jobId} in state ${state}`)
    return false
  } catch (error) {
    console.error('[ImageQueue] Failed to cancel job:', error)
    return false
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
} | null> {
  const queue = getImageGenerationQueue()

  if (!queue) {
    return null
  }

  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ])

    return { waiting, active, completed, failed, delayed }
  } catch (error) {
    console.error('[ImageQueue] Failed to get queue stats:', error)
    return null
  }
}

// Helper to map BullMQ states to our JobStatus type
function mapJobState(state: string): JobStatus {
  switch (state) {
    case 'waiting':
    case 'prioritized':
      return 'queued'
    case 'active':
      return 'active'
    case 'completed':
      return 'completed'
    case 'failed':
      return 'failed'
    case 'delayed':
      return 'delayed'
    default:
      return 'queued'
  }
}
