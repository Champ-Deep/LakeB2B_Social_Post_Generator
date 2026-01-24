import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { rateLimitCheck, applyRateLimitHeaders, RATE_LIMITS } from '../../lib/rateLimit'
import { getSessionFromRequest } from '../../lib/auth/middleware'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export type ImprovementGoal = 'engagement' | 'clarity' | 'brand_alignment' | 'visual_appeal'

interface SuggestPromptRequest {
  prompt: string
  headline: string
  style: string
  goal?: ImprovementGoal
}

interface PromptSuggestion {
  id: string
  improvedPrompt: string
  improvedHeadline: string
  explanation: string
  tags: string[]
}

interface SuggestPromptResponse {
  success: boolean
  suggestions?: PromptSuggestion[]
  error?: string
}

const GOAL_INSTRUCTIONS: Record<ImprovementGoal, string> = {
  engagement: 'Focus on making the content more engaging, action-oriented, and likely to drive interactions (likes, comments, shares).',
  clarity: 'Focus on making the message clearer, more concise, and easier to understand at a glance.',
  brand_alignment: 'Focus on professional B2B tone, industry-relevant language, and authoritative positioning.',
  visual_appeal: 'Focus on elements that will translate well to visual imagery - specific scenes, colors, and compositions.'
}

const SUGGESTION_PROMPT = `You are an expert B2B marketing copywriter and social media strategist for LakeB2B, a data solutions company.

Your task is to improve the following social media post content to make it more effective.

CURRENT CONTENT:
- Post Message: "{prompt}"
- Headline: "{headline}"
- Visual Style: {style}

IMPROVEMENT GOAL:
{goalInstruction}

LAKEB2B BRAND GUIDELINES:
- Professional B2B tone
- Focus on data-driven solutions, growth, and business transformation
- Colors: Purple (#6D08BE), Orange (#FFB703), Magenta (#DD1286)
- Tagline: "Enabling Growth"

Provide exactly 3 improved versions. For each suggestion:
1. Rewrite the post message to be more effective
2. Rewrite the headline to be punchier and more engaging
3. Explain why this version is better (1-2 sentences)
4. Add 2-3 relevant tags describing the improvements

IMPORTANT: Return ONLY valid JSON in this exact format, no additional text:
{
  "suggestions": [
    {
      "id": "1",
      "improvedPrompt": "Your improved post message here",
      "improvedHeadline": "Your improved headline here",
      "explanation": "Why this version is better",
      "tags": ["tag1", "tag2"]
    },
    {
      "id": "2",
      "improvedPrompt": "Second improved version",
      "improvedHeadline": "Second headline",
      "explanation": "Explanation for version 2",
      "tags": ["tag1", "tag2"]
    },
    {
      "id": "3",
      "improvedPrompt": "Third improved version",
      "improvedHeadline": "Third headline",
      "explanation": "Explanation for version 3",
      "tags": ["tag1", "tag2"]
    }
  ]
}`

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuggestPromptResponse>
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  // Check authentication
  const authResult = await getSessionFromRequest(req)
  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    })
  }

  // Rate limiting
  const rateLimitResult = rateLimitCheck(req, RATE_LIMITS.API_GENERAL, authResult.user.id)
  applyRateLimitHeaders(res, RATE_LIMITS.API_GENERAL.max, rateLimitResult.remaining, rateLimitResult.resetTime)

  if (rateLimitResult.limited) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.'
    })
  }

  // Validate API key
  if (!GEMINI_API_KEY) {
    console.error('[Suggest Prompt] GEMINI_API_KEY not configured')
    return res.status(500).json({
      success: false,
      error: 'AI service not configured'
    })
  }

  try {
    const { prompt, headline, style, goal = 'engagement' } = req.body as SuggestPromptRequest

    // Validate input
    if (!prompt || !headline) {
      return res.status(400).json({
        success: false,
        error: 'Both prompt and headline are required'
      })
    }

    // Build the full prompt
    const goalInstruction = GOAL_INSTRUCTIONS[goal] || GOAL_INSTRUCTIONS.engagement
    const fullPrompt = SUGGESTION_PROMPT
      .replace('{prompt}', prompt)
      .replace('{headline}', headline)
      .replace('{style}', style || 'isometric')
      .replace('{goalInstruction}', goalInstruction)

    console.log(`[Suggest Prompt] Generating suggestions for goal: ${goal}`)

    // Call Gemini API for text generation
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
        }
      },
      {
        headers: {
          'x-goog-api-key': GEMINI_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    // Extract text response
    const textResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textResponse) {
      throw new Error('No text response from AI')
    }

    // Parse JSON from response
    let suggestions: PromptSuggestion[]
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      let jsonStr = textResponse
      const jsonMatch = textResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1]
      }

      const parsed = JSON.parse(jsonStr.trim())
      suggestions = parsed.suggestions || []
    } catch (parseError) {
      console.error('[Suggest Prompt] Failed to parse AI response:', textResponse)

      // Fallback: Generate simple suggestions
      suggestions = [
        {
          id: '1',
          improvedPrompt: `${prompt} - Driving business growth through innovative solutions.`,
          improvedHeadline: `${headline} | LakeB2B`,
          explanation: 'Added brand alignment and call to action.',
          tags: ['brand', 'cta']
        },
        {
          id: '2',
          improvedPrompt: `Discover how ${prompt.toLowerCase()} can transform your business outcomes.`,
          improvedHeadline: `Transform Your Results: ${headline}`,
          explanation: 'Reframed with action-oriented language.',
          tags: ['action', 'transformation']
        },
        {
          id: '3',
          improvedPrompt: `${prompt} Our data-driven approach delivers measurable results.`,
          improvedHeadline: `Data-Driven ${headline}`,
          explanation: 'Emphasized data and measurable outcomes.',
          tags: ['data', 'results']
        }
      ]
    }

    console.log(`[Suggest Prompt] Generated ${suggestions.length} suggestions`)

    return res.status(200).json({
      success: true,
      suggestions
    })

  } catch (error) {
    console.error('[Suggest Prompt] Error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to generate suggestions'

    return res.status(500).json({
      success: false,
      error: errorMessage
    })
  }
}
