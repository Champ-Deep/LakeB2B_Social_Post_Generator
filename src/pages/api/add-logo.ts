import type { NextApiRequest, NextApiResponse } from 'next'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { imageUrl } = req.body

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' })
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured'
      })
    }

    console.log('Starting AI-powered logo replacement...')

    // Use Gemini AI to replace logo intelligently
    const replacedImageUrl = await replaceLogoWithAI(imageUrl)
    
    if (!replacedImageUrl) {
      return res.status(500).json({ error: 'Failed to replace logo with AI' })
    }

    return res.status(200).json({
      imageUrl: replacedImageUrl,
      message: 'Logo replaced successfully with AI'
    })

  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    console.error('Logo replacement error:', errorObj.message)
    
    return res.status(500).json({ 
      error: 'Failed to replace logo',
      message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined
    })
  }
}

async function replaceLogoWithAI(imageUrl: string): Promise<string | null> {
  try {
    // Extract base64 data from the data URL
    const base64Data = imageUrl.replace(/^data:image\/[a-z]+;base64,/, '')
    
    // Create focused prompt for seamless logo blending
    const prompt = `You are tasked with seamlessly integrating the real LakeB2B logo into this image. Focus specifically on:

TASK: Replace any generated/fake LakeB2B logo with the authentic LakeB2B branding

REQUIREMENTS:
1. Identify and remove any existing placeholder or generated "LakeB2B" logos in the bottom-left corner
2. Seamlessly blend the authentic LakeB2B logo and "ENABLING GROWTH" tagline into the bottom-left area
3. Match the lighting, shadows, and perspective of the background gradient
4. Use the existing purple-to-orange gradient colors to naturally integrate the logo
5. Ensure the logo appears as if it was part of the original design, not overlaid
6. Maintain exact bottom-left positioning (20px from edges)
7. Keep ALL other visual elements completely unchanged

CRITICAL: The result should look like a single, cohesive design where the logo belongs naturally in the scene.`

    // Call Gemini 2.5 Flash Image API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY!
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { 
              inlineData: {
                mimeType: 'image/png',
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096
        }
      })
    })

    if (!response.ok) {
      let errorMessage = `Gemini API error: ${response.status}`
      try {
        const responseText = await response.text()
        try {
          const errorData = JSON.parse(responseText)
          errorMessage += ` - ${errorData.error?.message || 'Unknown error'}`
        } catch {
          errorMessage += ` - ${responseText || 'Unknown error'}`
        }
      } catch {
        errorMessage += ' - Unable to read error response'
      }
      throw new Error(errorMessage)
    }

    let data
    const responseText = await response.text()
    try {
      data = JSON.parse(responseText)
    } catch (jsonError) {
      console.error('Failed to parse Gemini response as JSON. Response body:', responseText)
      throw new Error('Invalid JSON response from Gemini API')
    }
    
    // Look for image data in response
    if (data.candidates && 
        data.candidates[0] && 
        data.candidates[0].content && 
        data.candidates[0].content.parts) {
      
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64Image = part.inlineData.data
          const mimeType = part.inlineData.mimeType || 'image/png'
          return `data:${mimeType};base64,${base64Image}`
        }
      }
    }

    throw new Error('No image data in Gemini response')

  } catch (error) {
    console.error('AI logo replacement error:', error)
    return null
  }
}