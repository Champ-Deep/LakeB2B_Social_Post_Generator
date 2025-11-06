import type { NextApiRequest, NextApiResponse } from 'next'
import { createCanvas, loadImage } from 'canvas'
import fs from 'fs'
import path from 'path'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { imageUrl, style = 'isometric' } = req.body

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' })
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured'
      })
    }

    console.log('Starting logo replacement with simplified approach...')

    const replacedImageUrl = await replaceLogoSimple(imageUrl, style)
    
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

// Canvas-based logo overlay function - immediate working solution
async function applyLogoOverlay(imageUrl: string, style: string): Promise<string> {
  try {
    console.log('Applying logo overlay with canvas...')
    
    // Extract base64 data from data URL
    const base64Data = imageUrl.replace(/^data:image\/[a-z]+;base64,/, '')
    
    if (!base64Data || base64Data === imageUrl) {
      throw new Error('Invalid image format - expected data URL')
    }
    
    // Load the image from base64
    const imageBuffer = Buffer.from(base64Data, 'base64')
    const image = await loadImage(imageBuffer)
    
    // Load the LakeB2B logo
    const logoPath = path.join(process.cwd(), 'public', 'logos', 'LakeB2B Logo Square.png')
    
    // Check if logo file exists
    if (!fs.existsSync(logoPath)) {
      console.error('Logo file not found at:', logoPath)
      
      // Create a simple text-based logo overlay as fallback
      const canvas = createCanvas(image.width, image.height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0)
      
      // Add text logo
      ctx.fillStyle = style === 'newyork-cartoon' ? '#000000' : '#6D08BE'
      ctx.font = 'bold 32px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('LakeB2B', 20, image.height - 60)
      ctx.font = 'bold 16px Arial'
      ctx.fillText('ENABLING GROWTH', 20, image.height - 30)
      
      return canvas.toDataURL('image/png')
    }
    
    const logo = await loadImage(logoPath)
    
    // Create canvas
    const canvas = createCanvas(image.width, image.height)
    const ctx = canvas.getContext('2d')
    
    // Draw the original image
    ctx.drawImage(image, 0, 0)
    
    // Calculate logo size and position
    const logoWidth = Math.max(200, image.width * 0.25)
    const logoHeight = (logo.height / logo.width) * logoWidth
    const x = 20
    const y = image.height - logoHeight - 20
    
    // Apply style-specific logo processing
    if (style === 'newyork-cartoon') {
      // Convert logo to black and white
      const logoCanvas = createCanvas(logoWidth, logoHeight)
      const logoCtx = logoCanvas.getContext('2d')
      logoCtx.drawImage(logo, 0, 0, logoWidth, logoHeight)
      
      const imageData = logoCtx.getImageData(0, 0, logoWidth, logoHeight)
      const data = imageData.data
      
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
        const bw = gray > 128 ? 255 : 0
        data[i] = bw
        data[i + 1] = bw
        data[i + 2] = bw
      }
      
      logoCtx.putImageData(imageData, 0, 0)
      ctx.drawImage(logoCanvas, x, y)
    } else {
      // Draw original color logo
      ctx.drawImage(logo, x, y, logoWidth, logoHeight)
    }
    
    console.log('Logo overlay applied successfully')
    return canvas.toDataURL('image/png')
    
  } catch (error) {
    console.error('Logo overlay failed:', error)
    throw new Error(`Logo overlay failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function replaceLogoSimple(imageUrl: string, style: string): Promise<string | null> {
  try {
    // Extract base64 data
    const base64Data = imageUrl.replace(/^data:image\/[a-z]+;base64,/, '')
    
    if (!base64Data || base64Data === imageUrl) {
      throw new Error('Invalid image format - expected base64 data URL')
    }

    // Create style-specific logo instructions
    let logoColorInstructions = ''
    if (style === 'newyork-cartoon') {
      logoColorInstructions = 'Convert the logo to pure black and white only to match the cartoon style.'
    } else if (style === 'minimalist-linkedin') {
      logoColorInstructions = 'Use LakeB2B purple (#6D08BE) as the primary logo color with clean, minimalist styling.'
    } else {
      logoColorInstructions = 'Use the original LakeB2B brand colors (purple to orange gradient).'
    }

    // Simplified prompt focusing on logo replacement only
    const prompt = `Replace any generated or fake LakeB2B logo in this image with the authentic LakeB2B logo and "ENABLING GROWTH" tagline.

REQUIREMENTS:
1. Find and remove any existing LakeB2B logo in the bottom-left area
2. Place the real LakeB2B logo in the exact same position  
3. Make the logo prominent and clearly visible (minimum 200px width)
4. ${logoColorInstructions}
5. Keep everything else in the image exactly the same

Return only the updated image with the authentic logo properly integrated.`

    // NOTE: Using canvas-based logo overlay for development
    // This provides immediate functionality while proper image AI integration can be added later
    console.log('Applying logo overlay using canvas manipulation...')
    
    // Apply logo directly using canvas (no external API needed)
    const result = await applyLogoOverlay(imageUrl, style)
    
    if (!result) {
      throw new Error('Logo overlay failed')
    }
    
    return result
    
  } catch (error) {
    console.error('Logo replacement error:', error)
    return null
  }
}