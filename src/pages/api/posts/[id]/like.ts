/**
 * Post Like API
 *
 * POST /api/posts/[id]/like - Toggle like on a post
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '../../../../lib/auth/middleware'
import { prisma } from '../../../../lib/db/client'

interface LikeResponse {
  success: boolean
  liked?: boolean
  likesCount?: number
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LikeResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    })
  }

  const userId = authResult.user.id
  const postId = req.query.id as string

  if (!postId) {
    return res.status(400).json({
      success: false,
      error: 'Post ID is required'
    })
  }

  try {
    // Check if user already liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    })

    let liked = false

    if (existingLike) {
      // Unlike - remove the like and decrement count
      await prisma.$transaction([
        prisma.postLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } },
        }),
      ])
      liked = false
    } else {
      // Like - add new like and increment count
      await prisma.$transaction([
        prisma.postLike.create({
          data: {
            postId,
            userId,
          },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
        }),
      ])
      liked = true
    }

    // Get updated likes count
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { likesCount: true },
    })

    return res.status(200).json({
      success: true,
      liked,
      likesCount: post?.likesCount || 0
    })
  } catch (error) {
    console.error('Like error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}
