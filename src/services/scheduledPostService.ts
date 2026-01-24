/**
 * Scheduled Post Service
 *
 * Handles processing of scheduled posts - checks for pending posts
 * that are due and publishes them to LinkedIn.
 */

import { prisma } from '../lib/db/client'

// Maximum number of posts to process in one batch
// Keep small for Vercel Cron 15-second timeout (LinkedIn API calls are slow)
const BATCH_SIZE = 3

// Maximum retry attempts before marking as failed
const MAX_ATTEMPTS = 3

interface ProcessingResult {
  processed: number
  published: number
  failed: number
  errors: Array<{ postId: string; error: string }>
}

/**
 * Process all pending scheduled posts that are due
 */
export async function processScheduledPosts(): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    processed: 0,
    published: 0,
    failed: 0,
    errors: [],
  }

  const now = new Date()

  try {
    // Find posts that are due for publishing
    const pendingPosts = await prisma.scheduledPost.findMany({
      where: {
        status: 'pending',
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        user: true,
        post: true,
        linkedinConnection: true,
      },
      take: BATCH_SIZE,
      orderBy: {
        scheduledFor: 'asc',
      },
    })

    console.log(`[ScheduledPosts] Found ${pendingPosts.length} posts to process`)

    for (const scheduledPost of pendingPosts) {
      result.processed++

      try {
        // Validate LinkedIn connection
        if (!scheduledPost.linkedinConnection) {
          throw new Error('LinkedIn connection not found')
        }

        // Check if token is expired
        if (scheduledPost.linkedinConnection.tokenExpiresAt < now) {
          throw new Error('LinkedIn token expired. Please reconnect your account.')
        }

        // Get the image URL from the post
        const imageUrl = scheduledPost.post?.imageUrl || scheduledPost.post?.imagePath

        if (!imageUrl) {
          throw new Error('No image found for this scheduled post')
        }

        // Post to LinkedIn
        const linkedInResult = await postToLinkedIn({
          userId: scheduledPost.userId,
          postText: scheduledPost.postText,
          imageUrl,
        })

        // Update scheduled post as published
        await prisma.scheduledPost.update({
          where: { id: scheduledPost.id },
          data: {
            status: 'published',
            linkedinPostId: linkedInResult.postId,
            publishedAt: new Date(),
            errorMessage: null,
          },
        })

        result.published++
        console.log(`[ScheduledPosts] Published post ${scheduledPost.id}`)

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        // Update scheduled post with error
        await prisma.scheduledPost.update({
          where: { id: scheduledPost.id },
          data: {
            status: 'failed',
            errorMessage,
          },
        })

        result.failed++
        result.errors.push({
          postId: scheduledPost.id,
          error: errorMessage,
        })

        console.error(`[ScheduledPosts] Failed to publish post ${scheduledPost.id}:`, errorMessage)
      }
    }

    return result

  } catch (error) {
    console.error('[ScheduledPosts] Service error:', error)
    throw error
  }
}

/**
 * Get upcoming scheduled posts for a user
 */
export async function getUpcomingPosts(userId: string, limit = 10) {
  return prisma.scheduledPost.findMany({
    where: {
      userId,
      status: 'pending',
      scheduledFor: {
        gt: new Date(),
      },
    },
    include: {
      post: {
        select: {
          id: true,
          imagePath: true,
          imageUrl: true,
          headline: true,
        },
      },
    },
    orderBy: {
      scheduledFor: 'asc',
    },
    take: limit,
  })
}

/**
 * Cancel a scheduled post
 */
export async function cancelScheduledPost(postId: string, userId: string): Promise<boolean> {
  try {
    const post = await prisma.scheduledPost.findFirst({
      where: {
        id: postId,
        userId,
        status: 'pending',
      },
    })

    if (!post) {
      return false
    }

    await prisma.scheduledPost.update({
      where: { id: postId },
      data: { status: 'cancelled' },
    })

    return true
  } catch (error) {
    console.error('[ScheduledPosts] Cancel error:', error)
    return false
  }
}

/**
 * Post content to LinkedIn
 * Uses the linkedinService singleton to handle the posting
 */
async function postToLinkedIn(params: {
  userId: string
  postText: string
  imageUrl: string
}): Promise<{ postId: string }> {
  // Import the LinkedIn service dynamically to avoid circular deps
  const { linkedinService } = await import('./linkedinService')

  // Convert image URL to buffer
  let imageBuffer: Buffer

  if (params.imageUrl.startsWith('data:image/')) {
    // Handle base64 data URL
    const base64Data = params.imageUrl.split(',')[1]
    imageBuffer = Buffer.from(base64Data, 'base64')
  } else if (params.imageUrl.startsWith('http')) {
    // Handle HTTP URL - fetch and convert to buffer
    const response = await fetch(params.imageUrl)
    const arrayBuffer = await response.arrayBuffer()
    imageBuffer = Buffer.from(arrayBuffer)
  } else {
    // Handle local file path
    const fs = await import('fs/promises')
    imageBuffer = await fs.readFile(params.imageUrl)
  }

  const result = await linkedinService.postImageToLinkedIn(
    params.userId,
    imageBuffer,
    params.postText,
    'PUBLIC'
  )

  if (!result.success) {
    throw new Error(result.error || 'Failed to post to LinkedIn')
  }

  return { postId: result.postId || 'unknown' }
}

/**
 * Clean up old completed/failed scheduled posts
 */
export async function cleanupOldPosts(daysOld = 30): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const result = await prisma.scheduledPost.deleteMany({
    where: {
      status: {
        in: ['published', 'failed', 'cancelled'],
      },
      createdAt: {
        lt: cutoffDate,
      },
    },
  })

  console.log(`[ScheduledPosts] Cleaned up ${result.count} old posts`)
  return result.count
}
