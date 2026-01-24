/**
 * LinkedIn Service
 *
 * Handles all LinkedIn API operations including:
 * - Token management and validation
 * - Profile fetching
 * - Image posting
 */

import { prisma } from '../lib/db/client'
import { decryptToken } from '../lib/linkedin/tokenEncryption'

// LinkedIn API endpoints
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2'
const REGISTER_UPLOAD_URL = `${LINKEDIN_API_BASE}/assets?action=registerUpload`
const UGC_POSTS_URL = `${LINKEDIN_API_BASE}/ugcPosts`

// Types
export interface LinkedInPostResult {
  success: boolean
  postId?: string
  postUrl?: string
  error?: string
}

interface RegisterUploadResponse {
  value: {
    uploadMechanism: {
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
        uploadUrl: string
        headers: Record<string, string>
      }
    }
    asset: string
    mediaArtifact: string
  }
}

interface UGCPostResponse {
  id: string
}

// Local type for LinkedIn connection (matches Prisma schema)
interface LinkedInConnectionData {
  id: string
  userId: string
  linkedinId: string
  accessToken: string
  refreshToken: string | null
  tokenExpiresAt: Date
  profileName: string | null
  profileUrl: string | null
  profileImageUrl: string | null
}

export class LinkedInService {
  private static instance: LinkedInService

  static getInstance(): LinkedInService {
    if (!LinkedInService.instance) {
      LinkedInService.instance = new LinkedInService()
    }
    return LinkedInService.instance
  }

  /**
   * Get valid access token for a user
   * Returns null if no connection exists or token is expired
   */
  async getValidToken(userId: string): Promise<string | null> {
    try {
      const connection = await prisma.linkedInConnection.findUnique({
        where: { userId },
      })

      if (!connection) {
        return null
      }

      // Check if token is expired
      if (this.isTokenExpired(connection)) {
        return null
      }

      // Decrypt and return token
      return decryptToken(connection.accessToken)
    } catch (error) {
      console.error('Error getting valid token:', error)
      return null
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(connection: LinkedInConnectionData): boolean {
    const expiresAt = new Date(connection.tokenExpiresAt)
    return expiresAt <= new Date()
  }

  /**
   * Check if token expires within specified days
   */
  isTokenExpiringSoon(connection: LinkedInConnectionData, days: number = 7): boolean {
    const expiresAt = new Date(connection.tokenExpiresAt)
    const warningThreshold = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    return expiresAt <= warningThreshold && !this.isTokenExpired(connection)
  }

  /**
   * Get LinkedIn connection for user
   */
  async getConnection(userId: string): Promise<LinkedInConnectionData | null> {
    try {
      const connection = await prisma.linkedInConnection.findUnique({
        where: { userId },
      })

      return connection
    } catch (error) {
      console.error('Error getting connection:', error)
      return null
    }
  }

  /**
   * Post an image to LinkedIn
   *
   * Three-step process:
   * 1. Register upload to get upload URL
   * 2. Upload image binary
   * 3. Create UGC post with image
   */
  async postImageToLinkedIn(
    userId: string,
    imageBuffer: Buffer,
    postText: string,
    visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC'
  ): Promise<LinkedInPostResult> {
    try {
      // Get valid token
      const accessToken = await this.getValidToken(userId)
      if (!accessToken) {
        return {
          success: false,
          error: 'LinkedIn account not connected or token expired. Please reconnect your account.'
        }
      }

      // Get connection for LinkedIn ID
      const connection = await this.getConnection(userId)
      if (!connection) {
        return {
          success: false,
          error: 'LinkedIn connection not found'
        }
      }

      const linkedinId = connection.linkedinId

      // Step 1: Register upload
      const uploadRegistration = await this.registerUpload(accessToken, linkedinId)
      if (!uploadRegistration) {
        return {
          success: false,
          error: 'Failed to register image upload with LinkedIn'
        }
      }

      // Step 2: Upload image
      const uploadSuccess = await this.uploadImage(
        uploadRegistration.uploadUrl,
        uploadRegistration.headers,
        imageBuffer
      )
      if (!uploadSuccess) {
        return {
          success: false,
          error: 'Failed to upload image to LinkedIn'
        }
      }

      // Step 3: Create post
      const postResult = await this.createUGCPost(
        accessToken,
        linkedinId,
        uploadRegistration.asset,
        postText,
        visibility
      )

      if (!postResult) {
        return {
          success: false,
          error: 'Failed to create LinkedIn post'
        }
      }

      return {
        success: true,
        postId: postResult.id,
        postUrl: `https://www.linkedin.com/feed/update/${postResult.id}`
      }
    } catch (error) {
      console.error('Error posting to LinkedIn:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error posting to LinkedIn'
      }
    }
  }

  /**
   * Step 1: Register upload with LinkedIn
   */
  private async registerUpload(
    accessToken: string,
    linkedinId: string
  ): Promise<{ uploadUrl: string; headers: Record<string, string>; asset: string } | null> {
    try {
      const response = await fetch(REGISTER_UPLOAD_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: `urn:li:person:${linkedinId}`,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent'
              }
            ]
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Register upload failed:', response.status, errorText)
        return null
      }

      const data: RegisterUploadResponse = await response.json()
      const uploadMechanism = data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']

      return {
        uploadUrl: uploadMechanism.uploadUrl,
        headers: uploadMechanism.headers || {},
        asset: data.value.asset
      }
    } catch (error) {
      console.error('Register upload error:', error)
      return null
    }
  }

  /**
   * Step 2: Upload image binary to LinkedIn
   */
  private async uploadImage(
    uploadUrl: string,
    headers: Record<string, string>,
    imageBuffer: Buffer
  ): Promise<boolean> {
    try {
      // Convert Buffer to Uint8Array for fetch compatibility
      const uint8Array = new Uint8Array(imageBuffer)

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'image/png'
        },
        body: uint8Array
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Image upload failed:', response.status, errorText)
        return false
      }

      return true
    } catch (error) {
      console.error('Image upload error:', error)
      return false
    }
  }

  /**
   * Step 3: Create UGC Post with image
   */
  private async createUGCPost(
    accessToken: string,
    linkedinId: string,
    assetUrn: string,
    postText: string,
    visibility: 'PUBLIC' | 'CONNECTIONS'
  ): Promise<{ id: string } | null> {
    try {
      const visibilityValue = visibility === 'PUBLIC'
        ? 'PUBLIC'
        : 'CONNECTIONS'

      const response = await fetch(UGC_POSTS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify({
          author: `urn:li:person:${linkedinId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: postText
              },
              shareMediaCategory: 'IMAGE',
              media: [
                {
                  status: 'READY',
                  media: assetUrn
                }
              ]
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': visibilityValue
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Create UGC post failed:', response.status, errorText)
        return null
      }

      const data: UGCPostResponse = await response.json()
      return { id: data.id }
    } catch (error) {
      console.error('Create UGC post error:', error)
      return null
    }
  }
}

export const linkedinService = LinkedInService.getInstance()
