/**
 * Image Serving API
 *
 * Serves images from local storage.
 * GET /api/images/[filename]
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { loadImage, getContentType } from '../../../lib/storage/imageStorage'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { filename } = req.query

  if (typeof filename !== 'string') {
    return res.status(400).json({ error: 'Invalid filename' })
  }

  // Security: Prevent directory traversal
  const sanitizedFilename = path.basename(filename)

  // Validate filename format (should be: userId_timestamp_random.ext)
  if (!/^[a-zA-Z0-9_-]+\.[a-z]+$/i.test(sanitizedFilename)) {
    return res.status(400).json({ error: 'Invalid filename format' })
  }

  try {
    const imageBuffer = await loadImage(sanitizedFilename)

    if (!imageBuffer) {
      return res.status(404).json({ error: 'Image not found' })
    }

    // Set headers
    const contentType = getContentType(sanitizedFilename)
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.setHeader('Content-Length', imageBuffer.length)

    // Send image
    res.send(imageBuffer)
  } catch (error) {
    console.error('Error serving image:', error)
    return res.status(500).json({ error: 'Failed to load image' })
  }
}
