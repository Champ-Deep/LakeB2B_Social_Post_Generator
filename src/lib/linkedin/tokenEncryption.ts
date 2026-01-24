/**
 * LinkedIn Token Encryption Utilities
 *
 * Provides AES-256-GCM encryption for LinkedIn access tokens before storage.
 * Tokens should never be stored in plain text in the database.
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16 // 128 bits

/**
 * Get the encryption key from environment variables
 * Key must be 32 bytes (64 hex characters) for AES-256
 */
function getEncryptionKey(): Buffer {
  const key = process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY

  if (!key) {
    throw new Error('LINKEDIN_TOKEN_ENCRYPTION_KEY is not configured')
  }

  // Key should be 64 hex characters = 32 bytes
  if (key.length !== 64) {
    throw new Error('LINKEDIN_TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  }

  return Buffer.from(key, 'hex')
}

/**
 * Encrypt a token using AES-256-GCM
 *
 * @param plainText - The token to encrypt
 * @returns Encrypted token in format: iv:authTag:encryptedData (all hex encoded)
 */
export function encryptToken(plainText: string): string {
  if (!plainText) {
    throw new Error('Cannot encrypt empty token')
  }

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plainText, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Return format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt a token using AES-256-GCM
 *
 * @param encryptedText - Encrypted token in format: iv:authTag:encryptedData
 * @returns Decrypted plain text token
 */
export function decryptToken(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error('Cannot decrypt empty token')
  }

  const parts = encryptedText.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format')
  }

  const [ivHex, authTagHex, encrypted] = parts

  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid IV length')
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid auth tag length')
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Check if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey()
    return true
  } catch {
    return false
  }
}

/**
 * Safely encrypt a token, returning null if encryption fails
 */
export function safeEncryptToken(plainText: string): string | null {
  try {
    return encryptToken(plainText)
  } catch (error) {
    console.error('Token encryption failed:', error)
    return null
  }
}

/**
 * Safely decrypt a token, returning null if decryption fails
 */
export function safeDecryptToken(encryptedText: string): string | null {
  try {
    return decryptToken(encryptedText)
  } catch (error) {
    console.error('Token decryption failed:', error)
    return null
  }
}
