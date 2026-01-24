/**
 * Twitter/X Service
 *
 * Handles Twitter API interactions including OAuth, posting tweets with media,
 * and managing user connections.
 */

import { TwitterApi, TwitterApiReadWrite } from 'twitter-api-v2'
import { prisma } from '../lib/db/client'
import { isDatabaseConfigured } from '../lib/db/types'

// Twitter OAuth configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET
const TWITTER_CALLBACK_URL = process.env.TWITTER_CALLBACK_URL || 'http://localhost:3000/api/twitter/callback'

/**
 * Check if Twitter API is configured
 */
export function isTwitterConfigured(): boolean {
  return !!(TWITTER_CLIENT_ID && TWITTER_CLIENT_SECRET)
}

/**
 * Create a Twitter OAuth client
 */
function createOAuthClient(): TwitterApi {
  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    throw new Error('Twitter API credentials not configured')
  }

  return new TwitterApi({
    clientId: TWITTER_CLIENT_ID,
    clientSecret: TWITTER_CLIENT_SECRET,
  })
}

/**
 * Create an authenticated client from stored tokens
 */
function createAuthenticatedClient(accessToken: string): TwitterApiReadWrite {
  return new TwitterApi(accessToken).readWrite
}

/**
 * Twitter connection data stored in database
 */
export interface TwitterConnection {
  id: string
  userId: string
  accessToken: string
  refreshToken: string | null
  expiresAt: Date
  twitterUserId: string
  username: string
  profileImageUrl: string | null
}

/**
 * Result of posting to Twitter
 */
export interface TwitterPostResult {
  success: boolean
  tweetId?: string
  tweetUrl?: string
  error?: string
}

/**
 * Twitter Service class
 */
class TwitterService {
  /**
   * Generate OAuth authorization URL
   */
  async generateAuthUrl(state: string): Promise<{
    url: string
    codeVerifier: string
  }> {
    const client = createOAuthClient()

    const { url, codeVerifier } = client.generateOAuth2AuthLink(
      TWITTER_CALLBACK_URL,
      {
        scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
        state,
      }
    )

    return { url, codeVerifier }
  }

  /**
   * Exchange authorization code for tokens
   */
  async handleCallback(
    code: string,
    codeVerifier: string
  ): Promise<{
    accessToken: string
    refreshToken: string | null
    expiresIn: number
    user: {
      id: string
      username: string
      name: string
      profileImageUrl?: string
    }
  }> {
    const client = createOAuthClient()

    const {
      accessToken,
      refreshToken,
      expiresIn,
      client: authenticatedClient,
    } = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: TWITTER_CALLBACK_URL,
    })

    // Get user info
    const { data: user } = await authenticatedClient.v2.me({
      'user.fields': ['profile_image_url', 'name', 'username'],
    })

    return {
      accessToken,
      refreshToken: refreshToken || null,
      expiresIn,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        profileImageUrl: user.profile_image_url,
      },
    }
  }

  /**
   * Save Twitter connection to database
   */
  async saveConnection(
    userId: string,
    data: {
      accessToken: string
      refreshToken: string | null
      expiresIn: number
      twitterUserId: string
      username: string
      profileImageUrl?: string
    }
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + data.expiresIn * 1000)

    await prisma.twitterConnection.upsert({
      where: { userId },
      update: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt,
        twitterUserId: data.twitterUserId,
        username: data.username,
        profileImageUrl: data.profileImageUrl || null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt,
        twitterUserId: data.twitterUserId,
        username: data.username,
        profileImageUrl: data.profileImageUrl || null,
      },
    })
  }

  /**
   * Get Twitter connection for a user
   */
  async getConnection(userId: string): Promise<TwitterConnection | null> {
    return prisma.twitterConnection.findUnique({
      where: { userId },
    })
  }

  /**
   * Delete Twitter connection
   */
  async deleteConnection(userId: string): Promise<void> {
    await prisma.twitterConnection.delete({
      where: { userId },
    }).catch(() => {
      // Ignore if connection doesn't exist
    })
  }

  /**
   * Refresh access token if expired
   */
  async refreshAccessToken(userId: string): Promise<string | null> {
    const connection = await this.getConnection(userId)

    if (!connection) {
      return null
    }

    // Check if token is still valid
    if (new Date() < connection.expiresAt) {
      return connection.accessToken
    }

    // Token expired, need to refresh
    if (!connection.refreshToken) {
      console.warn('No refresh token available, user needs to re-authorize')
      return null
    }

    const client = createOAuthClient()

    try {
      const {
        accessToken,
        refreshToken,
        expiresIn,
      } = await client.refreshOAuth2Token(connection.refreshToken)

      // Save new tokens
      await this.saveConnection(userId, {
        accessToken,
        refreshToken: refreshToken || null,
        expiresIn,
        twitterUserId: connection.twitterUserId,
        username: connection.username,
        profileImageUrl: connection.profileImageUrl || undefined,
      })

      return accessToken
    } catch (error) {
      console.error('Failed to refresh Twitter token:', error)
      return null
    }
  }

  /**
   * Post a tweet with an image
   */
  async postWithImage(
    userId: string,
    text: string,
    imageBuffer: Buffer
  ): Promise<TwitterPostResult> {
    // Get fresh access token
    const accessToken = await this.refreshAccessToken(userId)

    if (!accessToken) {
      return {
        success: false,
        error: 'Not connected to Twitter or token expired',
      }
    }

    try {
      const client = createAuthenticatedClient(accessToken)

      // Upload media
      const mediaId = await client.v1.uploadMedia(imageBuffer, {
        mimeType: 'image/png',
      })

      // Post tweet with media
      const tweet = await client.v2.tweet({
        text,
        media: { media_ids: [mediaId] },
      })

      return {
        success: true,
        tweetId: tweet.data.id,
        tweetUrl: `https://twitter.com/i/status/${tweet.data.id}`,
      }
    } catch (error) {
      console.error('Twitter post error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to post to Twitter',
      }
    }
  }

  /**
   * Post a text-only tweet
   */
  async postTweet(userId: string, text: string): Promise<TwitterPostResult> {
    const accessToken = await this.refreshAccessToken(userId)

    if (!accessToken) {
      return {
        success: false,
        error: 'Not connected to Twitter or token expired',
      }
    }

    try {
      const client = createAuthenticatedClient(accessToken)

      const tweet = await client.v2.tweet({ text })

      return {
        success: true,
        tweetId: tweet.data.id,
        tweetUrl: `https://twitter.com/i/status/${tweet.data.id}`,
      }
    } catch (error) {
      console.error('Twitter post error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to post to Twitter',
      }
    }
  }

  /**
   * Check if user is connected to Twitter
   */
  async isConnected(userId: string): Promise<boolean> {
    const connection = await this.getConnection(userId)
    return !!connection
  }

  /**
   * Get connection status with details
   */
  async getConnectionStatus(userId: string): Promise<{
    connected: boolean
    username?: string
    profileImageUrl?: string
    expiresAt?: Date
  }> {
    const connection = await this.getConnection(userId)

    if (!connection) {
      return { connected: false }
    }

    return {
      connected: true,
      username: connection.username,
      profileImageUrl: connection.profileImageUrl || undefined,
      expiresAt: connection.expiresAt,
    }
  }
}

// Export singleton instance
export const twitterService = new TwitterService()
