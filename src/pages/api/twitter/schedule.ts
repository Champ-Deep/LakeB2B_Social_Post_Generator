/**
 * Twitter Schedule API
 *
 * POST /api/twitter/schedule - Schedule a Twitter post for later
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
    status: 'pending'
  }
  error?: string
}

const TWITTER_MAX_LENGTH = 280

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
  const { imageData, text, scheduledFor } = req.body

  // Validate required fields
  if (!text || !scheduledFor) {
    return res.status(400).json({
      success: false,
      error: 'Tweet text and schedule time are required'
    })
  }

  // Validate Twitter text length (max 280 characters)
  if (text.length > TWITTER_MAX_LENGTH) {
    return res.status(400).json({
      success: false,
      error: `Tweet text cannot exceed ${TWITTER_MAX_LENGTH} characters (current: ${text.length})`
    })
  }

  // Validate schedule time (5 minutes to 30 days from now)
  const scheduledTime = new Date(scheduledFor)
  const now = new Date()
  const minTime = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes from now
  const maxTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

  if (isNaN(scheduledTime.getTime())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid scheduled time format'
    })
  }

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
    // Check if user has a Twitter connection
    const twitterConnection = await prisma.twitterConnection.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!twitterConnection) {
      return res.status(400).json({
        success: false,
        error: 'Please connect your Twitter account first'
      })
    }

    // Save image to storage if provided
    let imageUrl: string | null = null
    let postId: string | null = null

    if (imageData) {
      // Save image to storage
      if (imageData.startsWith('data:image/')) {
        const saveResult = await saveImage(imageData, userId)
        if (saveResult.success && saveResult.publicUrl) {
          imageUrl = saveResult.publicUrl

          // Create a Post record to track the image
          const savedPost = await prisma.post.create({
            data: {
              userId,
              imagePath: saveResult.filePath!,
              imageUrl: saveResult.publicUrl!,
              prompt: text.slice(0, 500),
              style: 'scheduled',
              isPublic: false,
            },
            select: { id: true },
          })

          postId = savedPost.id
        } else {
          return res.status(500).json({
            success: false,
            error: 'Failed to save image'
          })
        }
      } else {
        // If imageData is already a URL, use it directly
        imageUrl = imageData
      }
    }

    // Create the scheduled post with platform: 'twitter'
    const createdSchedule = await prisma.scheduledPost.create({
      data: {
        userId,
        postId,
        platform: 'twitter',
        twitterConnectionId: twitterConnection.id,
        postText: text,
        imageUrl,
        scheduledFor: scheduledTime,
        status: 'pending',
      },
      select: {
        id: true,
        scheduledFor: true,
        status: true,
      },
    })

    return res.status(200).json({
      success: true,
      scheduledPost: {
        id: createdSchedule.id,
        scheduledFor: createdSchedule.scheduledFor.toISOString(),
        status: createdSchedule.status as 'pending'
      }
    })
  } catch (error) {
    console.error('Twitter schedule error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}
