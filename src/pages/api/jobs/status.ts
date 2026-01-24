/**
 * Job Status API Endpoint
 *
 * Check the status of async jobs (image generation, scheduled posts, etc.)
 *
 * GET /api/jobs/status?jobId=xxx - Get single job status
 * POST /api/jobs/status - Get multiple job statuses { jobIds: [...] }
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '../../../lib/auth/middleware'
import {
  getJobStatus,
  getBulkJobStatus,
  getQueueStats,
  cancelJob,
  type JobStatusResponse,
} from '../../../lib/queue/queues/imageGenerationQueue'
import { isQueueAvailable } from '../../../lib/queue/queueClient'

interface StatusResponse {
  success: boolean
  job?: JobStatusResponse
  jobs?: Record<string, JobStatusResponse>
  queueStats?: {
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
  }
  error?: string
  queueAvailable?: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  // Check authentication
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    })
  }

  // Check if queue system is available
  const queueAvailable = await isQueueAvailable()
  if (!queueAvailable) {
    return res.status(503).json({
      success: false,
      error: 'Queue system not available',
      queueAvailable: false,
    })
  }

  if (req.method === 'GET') {
    return handleGetStatus(req, res)
  } else if (req.method === 'POST') {
    return handleBulkStatus(req, res)
  } else if (req.method === 'DELETE') {
    return handleCancelJob(req, res)
  } else {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }
}

/**
 * GET - Get single job status or queue stats
 */
async function handleGetStatus(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  const { jobId, stats } = req.query

  // If stats requested, return queue statistics
  if (stats === 'true') {
    const queueStats = await getQueueStats()
    return res.status(200).json({
      success: true,
      queueStats: queueStats || undefined,
      queueAvailable: true,
    })
  }

  // Otherwise, get job status
  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'jobId query parameter is required',
    })
  }

  const status = await getJobStatus(jobId)

  if (!status) {
    return res.status(404).json({
      success: false,
      error: `Job ${jobId} not found`,
    })
  }

  return res.status(200).json({
    success: true,
    job: status,
    queueAvailable: true,
  })
}

/**
 * POST - Get multiple job statuses
 */
async function handleBulkStatus(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  const { jobIds } = req.body

  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'jobIds array is required in request body',
    })
  }

  if (jobIds.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 100 job IDs allowed per request',
    })
  }

  const statusMap = await getBulkJobStatus(jobIds)
  const jobs: Record<string, JobStatusResponse> = {}

  statusMap.forEach((status, id) => {
    jobs[id] = status
  })

  return res.status(200).json({
    success: true,
    jobs,
    queueAvailable: true,
  })
}

/**
 * DELETE - Cancel a pending job
 */
async function handleCancelJob(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  const { jobId } = req.query

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'jobId query parameter is required',
    })
  }

  const cancelled = await cancelJob(jobId)

  if (!cancelled) {
    return res.status(400).json({
      success: false,
      error: `Could not cancel job ${jobId}. It may be already processing or completed.`,
    })
  }

  return res.status(200).json({
    success: true,
    queueAvailable: true,
  })
}
