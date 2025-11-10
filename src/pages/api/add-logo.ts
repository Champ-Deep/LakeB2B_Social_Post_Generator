import type { NextApiRequest, NextApiResponse } from 'next'
import { addLogoOverlay } from '../../utils/server/imageProcessor'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { imageUrl, style = 'isometric', position = 'bottom-left', logoSize = 35, logoOpacity = 85, logoRotation = 0 } = req.body

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' })
    }

    console.log('Applying logo overlay...')

    // Apply logo overlay using Sharp-based processor
    const replacedImageUrl = await addLogoOverlay(imageUrl, {
      style,
      position,
      logoSize,
      logoOpacity,
      logoRotation,
    })
    
    if (!replacedImageUrl) {
      return res.status(500).json({ error: 'Failed to replace logo' })
    }

    return res.status(200).json({
      imageUrl: replacedImageUrl,
      style: style,
      message: 'Logo replaced successfully'
    })

  } catch (error) {
    console.error('Logo replacement error:', error)
    
    return res.status(500).json({ 
      error: 'Failed to replace logo',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    })
  }
}