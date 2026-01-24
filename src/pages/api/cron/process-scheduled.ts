/**
 * Cron Endpoint: Process Scheduled Posts
 *
 * This endpoint is called by Vercel Cron or an external scheduler
 * to process pending scheduled posts.
 *
 * Schedule: Every 5 minutes (cron: 0/5 * * * *)
 *
 * Security: Protected by CRON_SECRET environment variable
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { processScheduledPosts, cleanupOldPosts } from '../../../services/scheduledPostService'

// Vercel cron sends this header
const CRON_SECRET = process.env.CRON_SECRET

interface CronResponse {
  success: boolean
  result?: {
    processed: number
    published: number
    failed: number
    cleaned?: number
  }
  error?: string
  timestamp: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CronResponse>
) {
  // Only allow GET (Vercel Cron) or POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    })
  }

  // Verify cron secret for security
  const authHeader = req.headers.authorization
  const cronSecret = authHeader?.replace('Bearer ', '')

  // In production, require the cron secret
  if (process.env.NODE_ENV === 'production' && CRON_SECRET) {
    if (cronSecret !== CRON_SECRET) {
      console.warn('[Cron] Unauthorized access attempt')
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        timestamp: new Date().toISOString(),
      })
    }
  }

  const timestamp = new Date().toISOString()
  console.log(`[Cron] Starting scheduled post processing at ${timestamp}`)

  try {
    // Process scheduled posts
    const result = await processScheduledPosts()

    // Run cleanup once per hour (when minute is 0-4)
    const currentMinute = new Date().getMinutes()
    let cleaned = 0
    if (currentMinute < 5) {
      cleaned = await cleanupOldPosts(30)
    }

    console.log(`[Cron] Completed: ${result.published} published, ${result.failed} failed`)

    return res.status(200).json({
      success: true,
      result: {
        processed: result.processed,
        published: result.published,
        failed: result.failed,
        cleaned,
      },
      timestamp,
    })

  } catch (error) {
    console.error('[Cron] Error processing scheduled posts:', error)

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp,
    })
  }
}

// Vercel cron configuration
// Note: Vercel Cron has a 10-15 second timeout on most plans
// Keep batch sizes small to ensure completion within timeout
export const config = {
  maxDuration: 15, // 15 seconds max for Vercel Cron compatibility
}
