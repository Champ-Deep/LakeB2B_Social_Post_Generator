import type { NextApiRequest, NextApiResponse } from 'next'
import { createCanvas, loadImage } from 'canvas'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { prompt, style = 'isometric' } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt must be a non-empty string' })
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured',
        message: 'Please add your Gemini API key to the .env file'
      })
    }

    // Import style configuration
    const { getStylePrompt } = await import('../../types/styles')
    
    // Get the style-specific prompt
    const stylePrompt = getStylePrompt(style as any)
    
    // Create the full prompt by combining style requirements with user input
    const fullPrompt = `${stylePrompt}

BUSINESS CONTEXT: ${prompt}

Please create an illustration that incorporates this business context while following all the style requirements above.`

    // Try to generate image with Gemini 2.5 Flash
    try {
      console.log('Generating image with Gemini 2.5 Flash...')
      console.log('Full prompt:', fullPrompt)
      
      // Call Gemini 2.5 Flash API
      const geminiResponse = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
        {
          contents: [{
            parts: [
              { text: fullPrompt }
            ]
          }],
          generationConfig: {
            responseModalities: ["Text", "Image"],
            imageConfig: {
              aspectRatio: "1:1"
            }
          }
        },
        {
          headers: {
            'x-goog-api-key': GEMINI_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      )

      // Extract the generated image from response
      if (geminiResponse.data?.candidates?.[0]?.content?.parts) {
        const parts = geminiResponse.data.candidates[0].content.parts
        
        // Find the image part in the response
        const imagePart = parts.find((part: any) => part.inlineData?.mimeType?.startsWith('image/'))
        
        if (imagePart?.inlineData?.data) {
          console.log('Successfully generated image with Gemini 2.5 Flash')
          
          // Add logo overlay to the generated image
          const finalImageUrl = await addLogoOverlay(imagePart.inlineData.data, style)
          
          return res.status(200).json({
            imageUrl: finalImageUrl,
            prompt: fullPrompt,
            originalPrompt: prompt,
            style: style,
            message: 'Image generated successfully with Gemini 2.5 Flash'
          })
        }
      }
      
      throw new Error('No image generated in Gemini response')
      
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError)
      console.log('Falling back to placeholder image generation...')
      
      // Fallback to placeholder if Gemini fails
      const placeholderImage = await createPlaceholderImage(style, prompt)
      const finalImageUrl = await addLogoOverlay(placeholderImage, style)
      
      return res.status(200).json({
        imageUrl: finalImageUrl,
        prompt: fullPrompt,
        originalPrompt: prompt,
        style: style,
        message: 'Generated placeholder image (Gemini API unavailable)'
      })
    }

  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    console.error('Generate image error:', errorObj.message)
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined
    })
  }
}

// Create placeholder image for development/testing
async function createPlaceholderImage(style: string, prompt: string): Promise<string> {
  try {
    console.log(`Creating placeholder image for style: ${style}`)
    
    // Create 1080x1080 canvas
    const canvas = createCanvas(1080, 1080)
    const ctx = canvas.getContext('2d')
    
    // Style-specific backgrounds
    let backgroundColor: string
    let textColor: string
    
    switch (style) {
      case 'newyork-cartoon':
        backgroundColor = '#FFFFFF'
        textColor = '#000000'
        break
      case 'minimalist-linkedin':
        backgroundColor = '#F8F9FA'
        textColor = '#6D08BE'
        break
      case 'isometric':
      default:
        // LakeB2B gradient colors
        const gradient = ctx.createLinearGradient(0, 0, 1080, 1080)
        gradient.addColorStop(0, '#6D08BE')
        gradient.addColorStop(0.5, '#FFB703')
        gradient.addColorStop(1, '#DD1286')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 1080, 1080)
        textColor = '#FFFFFF'
        backgroundColor = '#6D08BE' // Fallback color
        break
    }
    
    if (style !== 'isometric') {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, 1080, 1080)
    }
    
    // Add placeholder content
    ctx.fillStyle = textColor
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Split prompt into multiple lines
    const words = prompt.split(' ')
    const lines = []
    let currentLine = ''
    
    words.forEach(word => {
      const testLine = currentLine + word + ' '
      const metrics = ctx.measureText(testLine)
      if (metrics.width > 800 && currentLine !== '') {
        lines.push(currentLine.trim())
        currentLine = word + ' '
      } else {
        currentLine = testLine
      }
    })
    lines.push(currentLine.trim())
    
    // Draw text lines
    const startY = 540 - (lines.length * 30)
    lines.forEach((line, index) => {
      ctx.fillText(line, 540, startY + (index * 60))
    })
    
    // Add style indicator
    ctx.font = 'bold 24px Arial'
    ctx.fillText(`Style: ${style}`, 540, 980)
    
    // Convert to base64
    const buffer = canvas.toBuffer('image/png')
    return buffer.toString('base64')
    
  } catch (error) {
    console.error('Placeholder image creation failed:', error)
    // Return a minimal fallback image
    const canvas = createCanvas(1080, 1080)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#6D08BE'
    ctx.fillRect(0, 0, 1080, 1080)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('LakeB2B', 540, 540)
    const buffer = canvas.toBuffer('image/png')
    return buffer.toString('base64')
  }
}

// Simple logo overlay function - only bottom-left placement
async function addLogoOverlay(base64Image: string, style: string = 'isometric'): Promise<string> {
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
    const logoWidth = Math.max(200, generatedImage.width * 0.25)  // Minimum 200px or 25% of image width
    const logoHeight = (logo.height / logo.width) * logoWidth  // Maintain aspect ratio
    
    const x = 20  // 20px from left edge
    const y = generatedImage.height - logoHeight - 20  // 20px from bottom edge
    
    // Apply style-specific logo processing
    if (style === 'newyork-cartoon') {
      // Create a white background for the logo area to ensure visibility
      ctx.fillStyle = 'white'
      ctx.fillRect(x - 10, y - 10, logoWidth + 20, logoHeight + 20)
      
      // Convert logo to black and white for cartoon style
      const logoCanvas = createCanvas(logoWidth, logoHeight)
      const logoCtx = logoCanvas.getContext('2d')
      
      // First draw a white background
      logoCtx.fillStyle = 'white'
      logoCtx.fillRect(0, 0, logoWidth, logoHeight)
      
      // Then draw the logo
      logoCtx.drawImage(logo, 0, 0, logoWidth, logoHeight)
      
      // Apply improved black and white filter
      const imageData = logoCtx.getImageData(0, 0, logoWidth, logoHeight)
      const data = imageData.data
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3]
        
        // Skip transparent pixels
        if (a < 10) {
          data[i] = 255     // Red
          data[i + 1] = 255 // Green
          data[i + 2] = 255 // Blue
          continue
        }
        
        // Convert to grayscale with better contrast
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
        
        // Use a more nuanced threshold for better logo preservation
        // Dark colors (like the navy blue in "Lake") become black
        // Bright colors (like the orange/yellow in "B2B") also become black
        // This ensures both parts of the logo are visible
        let bw
        if (gray < 100) {
          bw = 0 // Dark colors -> Black
        } else if (gray > 200) {
          // Check if it's a colorful pixel (like the B2B gradient)
          const colorfulness = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)
          if (colorfulness > 100) {
            bw = 0 // Colorful bright pixels -> Black
          } else {
            bw = 255 // White/light gray pixels -> White
          }
        } else {
          // Mid-range grays - check for color
          const colorfulness = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)
          bw = colorfulness > 50 ? 0 : 255
        }
        
        data[i] = bw     // Red
        data[i + 1] = bw // Green
        data[i + 2] = bw // Blue
      }
      
      logoCtx.putImageData(imageData, 0, 0)
      
      // Add a subtle black border around the logo for better definition
      logoCtx.strokeStyle = 'black'
      logoCtx.lineWidth = 2
      logoCtx.strokeRect(0, 0, logoWidth, logoHeight)
      
      ctx.drawImage(logoCanvas, x, y)
    } else {
      // Draw the logo directly for other styles
      ctx.drawImage(logo, x, y, logoWidth, logoHeight)
    }
    
    // Convert back to base64
    const finalImage = canvas.toDataURL('image/png')
    
    console.log('Logo successfully placed in bottom-left corner')
    return finalImage
    
  } catch (error) {
    console.error('Logo placement failed:', error)
    return `data:image/png;base64,${base64Image}`
  }
}