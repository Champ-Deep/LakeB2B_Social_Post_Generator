import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { addLogoOverlay, createPlaceholderImage } from '../../utils/server/imageProcessor'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      prompt, 
      style = 'isometric', 
      position = 'bottom-left',
      logoSize = 35,
      logoOpacity = 85,
      logoRotation = 0
    } = req.body

    // Enhanced input validation
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Prompt is required',
        code: 'MISSING_PROMPT'
      })
    }

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Prompt must be a non-empty string',
        code: 'INVALID_PROMPT'
      })
    }

    if (prompt.length > 500) {
      return res.status(400).json({ 
        error: 'Prompt must be less than 500 characters',
        code: 'PROMPT_TOO_LONG'
      })
    }

    const validStyles = ['isometric', 'newyork-cartoon', 'minimalist-linkedin']
    if (!validStyles.includes(style)) {
      return res.status(400).json({ 
        error: `Invalid style. Must be one of: ${validStyles.join(', ')}`,
        code: 'INVALID_STYLE'
      })
    }

    const validPositions = ['bottom-left', 'bottom-right', 'top-right']
    if (!validPositions.includes(position)) {
      return res.status(400).json({ 
        error: `Invalid position. Must be one of: ${validPositions.join(', ')}`,
        code: 'INVALID_POSITION'
      })
    }

    if (typeof logoSize !== 'number' || logoSize < 10 || logoSize > 100) {
      return res.status(400).json({ 
        error: 'Logo size must be a number between 10 and 100 (percentage)',
        code: 'INVALID_LOGO_SIZE'
      })
    }

    if (typeof logoOpacity !== 'number' || logoOpacity < 0 || logoOpacity > 100) {
      return res.status(400).json({ 
        error: 'Logo opacity must be a number between 0 and 100 (percentage)',
        code: 'INVALID_LOGO_OPACITY'
      })
    }

    if (typeof logoRotation !== 'number' || logoRotation < -180 || logoRotation > 180) {
      return res.status(400).json({ 
        error: 'Logo rotation must be a number between -180 and 180 (degrees)',
        code: 'INVALID_LOGO_ROTATION'
      })
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
          
          // Convert base64 to data URL format
          const base64Image = `data:image/png;base64,${imagePart.inlineData.data}`
          
          // Add logo overlay to the generated image
          const finalImageUrl = await addLogoOverlay(base64Image, {
            style,
            position,
            logoSize,
            logoOpacity,
            logoRotation,
          })
          
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
      const finalImageUrl = await addLogoOverlay(placeholderImage, {
        style,
        position,
        logoSize,
        logoOpacity,
        logoRotation,
      })
      
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