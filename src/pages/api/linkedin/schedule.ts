/**
 * LinkedIn Schedule API
 *
 * POST /api/linkedin/schedule - Schedule a LinkedIn post for later
 *
 * Stores the scheduled post in the database for later processing.
 * A cron job or serverless function would pick up these posts and publish them at the scheduled time.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '../../../lib/auth/middleware'
import { prisma } from '../../../lib/db/client'
import { saveImage } from '../../../lib/storage/imageStorage'

interface ScheduleResponse {
  success: boolean
  scheduledPost?: {
    id: string
    scheduledFor: string
  }
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScheduleResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  // Check authentication
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    })
  }

  const userId = authResult.user.id
  const { imageData, postText, scheduledFor } = req.body

  // Validate required fields
  if (!postText || !scheduledFor) {
    return res.status(400).json({
      success: false,
      error: 'Post text and schedule time are required'
    })
  }

  // Validate schedule time
  const scheduledTime = new Date(scheduledFor)
  const now = new Date()
  const minTime = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes from now
  const maxTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

  if (scheduledTime < minTime) {
    return res.status(400).json({
      success: false,
      error: 'Scheduled time must be at least 5 minutes from now'
    })
  }

  if (scheduledTime > maxTime) {
    return res.status(400).json({
      success: false,
      error: 'Scheduled time cannot be more than 30 days in the future'
    })
  }

  try {
    // Check if user has a LinkedIn connection
    const linkedInConnection = await prisma.linkedInConnection.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!linkedInConnection) {
      return res.status(400).json({
        success: false,
        error: 'Please connect your LinkedIn account first'
      })
    }

    // First, save the post to get a post_id (if image is provided)
    let postId: string | null = null
    if (imageData) {
      // Save image to local storage
      let imagePath = imageData
      let imageUrl = imageData

      if (imageData.startsWith('data:image/')) {
        const saveResult = await saveImage(imageData, userId)
        if (saveResult.success) {
          imagePath = saveResult.filePath!
          imageUrl = saveResult.publicUrl!
        }
      }

      const savedPost = await prisma.post.create({
        data: {
          userId,
          imagePath,
          imageUrl,
          prompt: postText.slice(0, 500),
          style: 'scheduled',
          isPublic: false,
        },
        select: { id: true },
      })

      postId = savedPost.id
    }

    // Create the scheduled post
    const createdSchedule = await prisma.scheduledPost.create({
      data: {
        userId,
        postId,
        linkedinConnectionId: linkedInConnection.id,
        postText,
        scheduledFor: scheduledTime,
        status: 'pending',
      },
      select: { id: true, scheduledFor: true },
    })

    return res.status(200).json({
      success: true,
      scheduledPost: {
        id: createdSchedule.id,
        scheduledFor: createdSchedule.scheduledFor.toISOString()
      }
    })
  } catch (error) {
    console.error('Schedule error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}
