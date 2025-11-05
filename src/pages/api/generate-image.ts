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
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured',
        message: 'Please add your Gemini API key to the .env file'
      })
    }

    // Create simple business illustration prompt
    const fullPrompt = `Create a professional isometric 3D business illustration:

STYLE: Clean isometric perspective, modern 3D graphics with sharp geometric shapes
BACKGROUND: Vibrant gradient from deep purple to orange to magenta (LakeB2B brand colors)
ELEMENTS: Business professionals, floating screens with data visualizations, laptops, modern technology
BUSINESS CONTEXT: ${prompt}

CRITICAL REQUIREMENTS: 
- Square format (1080x1080)
- ABSOLUTELY NO logos, text, labels, or branding anywhere in the image
- Keep the bottom-left corner (200x150px area) completely clear and unoccupied by any elements
- Do not place any visual elements, characters, or objects in the bottom-left corner area
- Professional B2B social media quality
- Focus all visual elements in the center and right portions of the image`

    // Direct Gemini 2.5 Flash Image API call
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 8192
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    
    // Check for image in response
    if (data.candidates && 
        data.candidates[0] && 
        data.candidates[0].content && 
        data.candidates[0].content.parts) {
      
      // Look for image data in parts
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64Image = part.inlineData.data
          
          // Add logo overlay
          const finalImageUrl = await addLogoOverlay(base64Image)
          
          return res.status(200).json({
            imageUrl: finalImageUrl,
            prompt: fullPrompt,
            originalPrompt: prompt,
            message: 'Image generated and logo added successfully'
          })
        }
      }
      
      // If no image found, return text response
      const textResponse = data.candidates[0].content.parts[0].text || 'No content generated'
      return res.status(200).json({
        imageUrl: null,
        prompt: fullPrompt,
        originalPrompt: prompt,
        message: 'Text response received instead of image',
        textResponse
      })
    }

    throw new Error('No response from Gemini')

  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    console.error('Generate image error:', errorObj.message)
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined
    })
  }
}

// Simple logo overlay function - only bottom-left placement
async function addLogoOverlay(base64Image: string): Promise<string> {
  try {
    console.log('Placing logo in bottom-left corner only')
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64')
    
    // Load the generated image
    const generatedImage = await loadImage(imageBuffer)
    
    // Load the LakeB2B logo
    const logoPath = path.join(process.cwd(), 'public', 'logos', 'LakeB2B Logo Square.png')
    
    // Verify logo file exists
    if (!fs.existsSync(logoPath)) {
      console.error('Logo file not found at:', logoPath)
      return `data:image/png;base64,${base64Image}`
    }
    
    const logo = await loadImage(logoPath)
    
    // Create canvas with same dimensions as generated image
    const canvas = createCanvas(generatedImage.width, generatedImage.height)
    const ctx = canvas.getContext('2d')
    
    // Draw the generated image first
    ctx.drawImage(generatedImage, 0, 0)
    
    // Calculate logo position - ONLY bottom-left
    const logoWidth = 150  // Fixed logo width
    const logoHeight = (logo.height / logo.width) * logoWidth  // Maintain aspect ratio
    
    const x = 20  // 20px from left edge
    const y = generatedImage.height - logoHeight - 20  // 20px from bottom edge
    
    // Draw the logo directly without background for natural blending
    ctx.drawImage(logo, x, y, logoWidth, logoHeight)
    
    // Convert back to base64
    const finalImage = canvas.toDataURL('image/png')
    
    console.log('Logo successfully placed in bottom-left corner')
    return finalImage
    
  } catch (error) {
    console.error('Logo placement failed:', error)
    return `data:image/png;base64,${base64Image}`
  }
}