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
    const { imageUrl, style = 'isometric' } = req.body

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
    const replacedImageUrl = await replaceLogoWithAI(imageUrl, style)
    
    if (!replacedImageUrl) {
      return res.status(500).json({ error: 'Failed to replace logo with AI' })
    }

    return res.status(200).json({
      imageUrl: replacedImageUrl,
      style: style,
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

async function replaceLogoWithAI(imageUrl: string, style: string = 'isometric'): Promise<string | null> {
  try {
    // Validate input
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Invalid image URL provided')
    }

    // Extract base64 data from the data URL
    const base64Data = imageUrl.replace(/^data:image\/[a-z]+;base64,/, '')
    
    if (!base64Data || base64Data === imageUrl) {
      throw new Error('Invalid base64 image data')
    }
    
    // Create style-specific prompt for logo replacement
    let logoStyleInstructions = ''
    
    if (style === 'newyork-cartoon') {
      logoStyleInstructions = `
LOGO STYLE: Convert the LakeB2B logo to BLACK AND WHITE ONLY
- The logo must be completely monochrome (black and white, no colors)
- Use bold black lines and white fills to match the cartoon style
- Make the "ENABLING GROWTH" tagline also black and white
- Ensure the logo maintains cartoon-style bold line art aesthetic
- No gradients, no colors - strictly black and white only`
    } else if (style === 'minimalist-linkedin') {
      logoStyleInstructions = `
LOGO STYLE: Adapt logo for minimalist professional style
- Use LinkedIn blue (#0077B5) as the primary color for the logo
- Keep clean, simple lines with high contrast
- Make the logo very clean and readable for mobile viewing
- Use subtle shadows and minimal effects`
    } else {
      logoStyleInstructions = `
LOGO STYLE: Maintain original colorful logo style
- Use the existing purple-to-orange gradient colors to integrate the logo
- Match the vibrant brand colors of the background`
    }

    const prompt = `You are tasked with seamlessly integrating the real LakeB2B logo into this image. Focus specifically on:

TASK: Replace any generated/fake LakeB2B logo with the authentic LakeB2B branding

GENERAL REQUIREMENTS:
1. Identify and remove any existing placeholder or generated "LakeB2B" logos in the bottom-left corner
2. Seamlessly blend the authentic LakeB2B logo and "ENABLING GROWTH" tagline into the bottom-left area
3. Make the logo larger and more prominent (minimum 200x200 pixels)
4. Match the lighting, shadows, and perspective of the image style
5. Ensure the logo appears as if it was part of the original design, not overlaid
6. Maintain exact bottom-left positioning (20px from edges)
7. Keep ALL other visual elements completely unchanged

${logoStyleInstructions}

CRITICAL: The result should look like a single, cohesive design where the logo belongs naturally in the scene and matches the overall visual style.`

    // Call Gemini 2.5 Flash Image API with retry logic
    const maxRetries = 3
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting logo replacement (attempt ${attempt}/${maxRetries})`)
        
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
          const errorDetails = await handleApiError(response)
          throw new Error(`Gemini API error (${response.status}): ${errorDetails}`)
        }

        // Read response as text first
        const responseText = await response.text()
        
        // Validate response is not empty
        if (!responseText || responseText.trim().length === 0) {
          throw new Error('Empty response from Gemini API')
        }

        // Attempt to parse JSON with detailed error handling
        let data
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error(`JSON Parse Error (attempt ${attempt}):`, parseError)
          console.error('Raw Response:', responseText.substring(0, 500))
          
          // If this is the last attempt, throw with details
          if (attempt === maxRetries) {
            throw new Error(`Invalid JSON response from Gemini API. Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`)
          }
          
          // Otherwise, retry after a delay
          await delay(1000 * attempt)
          continue
        }

        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response structure from Gemini API')
        }

        // Look for image data in response
        const imageData = extractImageFromResponse(data)
        if (imageData) {
          console.log(`Logo replacement successful on attempt ${attempt}`)
          return imageData
        }

        throw new Error('No image data found in Gemini response')

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`Logo replacement attempt ${attempt} failed:`, lastError.message)
        
        // If this isn't the last attempt, wait before retrying
        if (attempt < maxRetries) {
          await delay(1000 * attempt) // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Logo replacement failed after all retries')

  } catch (error) {
    console.error('AI logo replacement error:', error)
    return null
  }
}

// Helper function to handle API errors
async function handleApiError(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      const errorData = await response.json()
      return errorData.error?.message || errorData.message || 'Unknown API error'
    } else {
      const textResponse = await response.text()
      return textResponse || 'Unknown API error'
    }
  } catch (parseError) {
    return `Unable to parse error response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
  }
}

// Helper function to extract image data from Gemini response
function extractImageFromResponse(data: any): string | null {
  try {
    if (data.candidates && 
        Array.isArray(data.candidates) &&
        data.candidates[0] && 
        data.candidates[0].content && 
        data.candidates[0].content.parts &&
        Array.isArray(data.candidates[0].content.parts)) {
      
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64Image = part.inlineData.data
          const mimeType = part.inlineData.mimeType || 'image/png'
          return `data:${mimeType};base64,${base64Image}`
        }
      }
    }
    return null
  } catch (error) {
    console.error('Error extracting image from response:', error)
    return null
  }
}

// Helper function for delays
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}