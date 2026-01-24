/**
 * BullMQ Queue Client Configuration
 *
 * Provides Redis connection and queue factory for background job processing.
 * Falls back gracefully when Redis is not available (development mode).
 */

import { Queue, Worker, QueueEvents, ConnectionOptions } from 'bullmq'
import Redis, { RedisOptions } from 'ioredis'

// Redis connection configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Parse Redis URL for base connection options
function parseRedisUrl(url: string): { host: string; port: number; password?: string; username?: string } {
  try {
    const parsed = new URL(url)
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
      username: parsed.username || undefined,
    }
  } catch {
    return {
      host: 'localhost',
      port: 6379,
    }
  }
}

// Base connection options
const baseOptions = parseRedisUrl(REDIS_URL)

// Connection options for BullMQ (requires maxRetriesPerRequest: null)
const bullmqConnectionOptions: ConnectionOptions = {
  ...baseOptions,
  maxRetriesPerRequest: null,
}

// Connection options for ioredis client
const ioredisOptions: RedisOptions = {
  ...baseOptions,
  lazyConnect: true,
  retryStrategy: (times: number) => {
    if (times > 3) {
      console.warn('[Queue] Redis connection failed after 3 retries, running without queue')
      return null
    }
    return Math.min(times * 200, 1000)
  },
}

// Singleton Redis connection for reuse
let redisConnection: Redis | null = null
let isRedisAvailable: boolean | null = null

/**
 * Get or create Redis connection
 */
export async function getRedisConnection(): Promise<Redis | null> {
  if (redisConnection) {
    return redisConnection
  }

  try {
    redisConnection = new Redis(ioredisOptions)

    await redisConnection.connect()
    isRedisAvailable = true
    console.log('[Queue] Redis connected successfully')
    return redisConnection
  } catch (error) {
    console.warn('[Queue] Redis not available, background jobs disabled:', error)
    isRedisAvailable = false
    redisConnection = null
    return null
  }
}

/**
 * Check if Redis/queue system is available
 */
export async function isQueueAvailable(): Promise<boolean> {
  if (isRedisAvailable !== null) {
    return isRedisAvailable
  }

  const connection = await getRedisConnection()
  return connection !== null
}

/**
 * Create a new queue with the given name
 */
export function createQueue<T = unknown>(queueName: string): Queue<T> | null {
  if (isRedisAvailable === false) {
    return null
  }

  try {
    return new Queue<T>(queueName, {
      connection: bullmqConnectionOptions,
      defaultJobOptions: {
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
          age: 24 * 3600, // Keep for 24 hours
        },
        removeOnFail: {
          count: 50, // Keep last 50 failed jobs
          age: 7 * 24 * 3600, // Keep for 7 days
        },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    })
  } catch (error) {
    console.error(`[Queue] Failed to create queue ${queueName}:`, error)
    return null
  }
}

/**
 * Create a worker for processing jobs
 */
export function createWorker<T = unknown, R = unknown>(
  queueName: string,
  processor: (job: { data: T; id?: string; name: string }) => Promise<R>,
  options?: {
    concurrency?: number
    limiter?: { max: number; duration: number }
  }
): Worker<T, R> | null {
  if (isRedisAvailable === false) {
    return null
  }

  try {
    const worker = new Worker<T, R>(
      queueName,
      async (job) => processor({ data: job.data, id: job.id, name: job.name }),
      {
        connection: bullmqConnectionOptions,
        concurrency: options?.concurrency || 2,
        limiter: options?.limiter,
      }
    )

    worker.on('completed', (job) => {
      console.log(`[Queue] Job ${job.id} completed`)
    })

    worker.on('failed', (job, error) => {
      console.error(`[Queue] Job ${job?.id} failed:`, error.message)
    })

    return worker
  } catch (error) {
    console.error(`[Queue] Failed to create worker for ${queueName}:`, error)
    return null
  }
}

/**
 * Create queue events listener for real-time updates
 */
export function createQueueEvents(queueName: string): QueueEvents | null {
  if (isRedisAvailable === false) {
    return null
  }

  try {
    return new QueueEvents(queueName, {
      connection: bullmqConnectionOptions,
    })
  } catch (error) {
    console.error(`[Queue] Failed to create events for ${queueName}:`, error)
    return null
  }
}

/**
 * Gracefully close all connections
 */
export async function closeConnections(): Promise<void> {
  if (redisConnection) {
    await redisConnection.quit()
    redisConnection = null
  }
}

// Queue names enum for type safety
export const QUEUE_NAMES = {
  IMAGE_GENERATION: 'image-generation',
  SCHEDULED_POSTS: 'scheduled-posts',
} as const

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES]
