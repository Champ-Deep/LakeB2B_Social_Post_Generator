/**
 * Image Prompt Optimization Chain
 *
 * Uses LangChain to enhance and optimize prompts for image generation.
 * Incorporates LakeB2B brand guidelines and style-specific requirements.
 */

import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { createPromptOptimizerModel, isLangChainConfigured } from '../models'
import type { ImageStyle } from '../../schemas'

/**
 * Brand guidelines for LakeB2B
 */
const BRAND_GUIDELINES = `
LakeB2B Brand Guidelines:
- Primary Colors: Purple (#6D08BE), Orange (#FFB703), Magenta (#DD1286)
- Typography: Modern, professional, clean
- Style: Professional B2B aesthetic, data-driven, growth-focused
- Tone: Authoritative, innovative, results-oriented
- Audience: B2B marketers, sales professionals, business leaders
`

/**
 * Style-specific optimization instructions
 */
const STYLE_INSTRUCTIONS: Record<ImageStyle, string> = {
  isometric: `
    Create an isometric 3D illustration with:
    - Clean, geometric shapes and precise angles
    - Professional business/technology elements
    - Subtle gradients and soft shadows
    - Vibrant yet professional color palette
    - Data visualization or business growth metaphors
  `,
  infographic: `
    Create an infographic-style image with:
    - Clear visual hierarchy
    - Data visualization elements (charts, graphs, icons)
    - Professional typography-friendly layout
    - Clean sections and visual flow
    - Statistics or key metrics visualization
  `,
  'newyork-cartoon': `
    Create a New York magazine style cartoon with:
    - Sophisticated, editorial illustration style
    - Clean linework with subtle humor
    - Professional business setting
    - Smart visual metaphors
    - Elegant, understated color palette
  `,
  'minimalist-linkedin': `
    Create a minimalist LinkedIn-appropriate image with:
    - Clean, professional aesthetic
    - Ample white space
    - Subtle geometric elements
    - Professional, corporate feel
    - Focus on single concept or metaphor
  `,
  meme: `
    Create a professional meme-style image with:
    - Clear, readable text areas
    - Relatable B2B humor
    - Professional but approachable tone
    - Common meme format compatibility
    - Business/marketing context
  `,
}

/**
 * Main prompt template for optimization
 */
const optimizationPromptTemplate = PromptTemplate.fromTemplate(`
You are an expert prompt engineer specializing in B2B marketing visuals for LakeB2B.

{brandGuidelines}

STYLE REQUIREMENTS ({style}):
{styleInstructions}

USER'S ORIGINAL REQUEST:
{userPrompt}

Your task is to transform the user's request into an optimized image generation prompt that:
1. Incorporates all style requirements
2. Follows LakeB2B brand guidelines
3. Is specific and detailed for AI image generation
4. Maintains professional B2B aesthetics
5. Creates engaging, shareable social media content

IMPORTANT:
- Focus on visual elements, not text content
- Be specific about composition, colors, and style
- Include relevant business/technology visual metaphors
- Keep the prompt under 300 words

Return ONLY the optimized prompt, no explanations or preamble.

Optimized Image Prompt:
`)

/**
 * Create the prompt optimization chain
 */
export function createImagePromptChain() {
  if (!isLangChainConfigured()) {
    throw new Error('LangChain is not configured. Set GEMINI_API_KEY.')
  }

  const model = createPromptOptimizerModel()
  const outputParser = new StringOutputParser()

  return RunnableSequence.from([
    optimizationPromptTemplate,
    model,
    outputParser,
  ])
}

/**
 * Optimize an image generation prompt
 */
export async function optimizeImagePrompt(
  userPrompt: string,
  style: ImageStyle
): Promise<{
  success: boolean
  optimizedPrompt?: string
  error?: string
}> {
  if (!isLangChainConfigured()) {
    // Return original prompt if LangChain is not configured
    return {
      success: true,
      optimizedPrompt: userPrompt,
    }
  }

  try {
    const chain = createImagePromptChain()

    const result = await chain.invoke({
      brandGuidelines: BRAND_GUIDELINES,
      style,
      styleInstructions: STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.isometric,
      userPrompt,
    })

    // Clean up the result
    const optimizedPrompt = result
      .trim()
      .replace(/^(Optimized Image Prompt:|Here is the optimized prompt:)/i, '')
      .trim()

    return {
      success: true,
      optimizedPrompt,
    }
  } catch (error) {
    console.error('Error optimizing prompt:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to optimize prompt',
      // Fall back to original prompt
      optimizedPrompt: userPrompt,
    }
  }
}

/**
 * Generate prompt suggestions based on a topic
 */
export async function generatePromptSuggestions(
  topic: string,
  style: ImageStyle,
  count: number = 3
): Promise<{
  success: boolean
  suggestions?: string[]
  error?: string
}> {
  if (!isLangChainConfigured()) {
    return {
      success: false,
      error: 'LangChain is not configured',
    }
  }

  const suggestionTemplate = PromptTemplate.fromTemplate(`
You are a B2B marketing expert for LakeB2B creating image generation prompts.

{brandGuidelines}

Topic: {topic}
Style: {style}

Generate {count} unique, creative image prompt suggestions for this topic.
Each prompt should be specific, detailed, and optimized for the {style} style.

Return ONLY a numbered list of prompts, one per line:
1. [First prompt]
2. [Second prompt]
3. [Third prompt]
`)

  try {
    const model = createPromptOptimizerModel()
    const outputParser = new StringOutputParser()

    const chain = RunnableSequence.from([
      suggestionTemplate,
      model,
      outputParser,
    ])

    const result = await chain.invoke({
      brandGuidelines: BRAND_GUIDELINES,
      topic,
      style,
      count: count.toString(),
    })

    // Parse the numbered list
    const suggestions = result
      .split('\n')
      .filter((line: string) => /^\d+\./.test(line.trim()))
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line: string) => line.length > 0)

    return {
      success: true,
      suggestions,
    }
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate suggestions',
    }
  }
}

/**
 * Enhance an existing prompt with additional context
 */
export async function enhancePromptWithContext(
  prompt: string,
  context: {
    industry?: string
    audience?: string
    tone?: string
    additionalKeywords?: string[]
  }
): Promise<{
  success: boolean
  enhancedPrompt?: string
  error?: string
}> {
  if (!isLangChainConfigured()) {
    return {
      success: true,
      enhancedPrompt: prompt,
    }
  }

  const enhanceTemplate = PromptTemplate.fromTemplate(`
You are enhancing an image generation prompt with additional context.

Original Prompt: {prompt}

Additional Context:
- Industry: {industry}
- Target Audience: {audience}
- Tone: {tone}
- Keywords to Include: {keywords}

Enhance the original prompt by naturally incorporating the additional context.
Keep the core concept but make it more targeted and specific.
Return ONLY the enhanced prompt, no explanations.

Enhanced Prompt:
`)

  try {
    const model = createPromptOptimizerModel()
    const outputParser = new StringOutputParser()

    const chain = RunnableSequence.from([
      enhanceTemplate,
      model,
      outputParser,
    ])

    const result = await chain.invoke({
      prompt,
      industry: context.industry || 'B2B Technology',
      audience: context.audience || 'Business professionals',
      tone: context.tone || 'Professional and innovative',
      keywords: context.additionalKeywords?.join(', ') || 'growth, data, success',
    })

    return {
      success: true,
      enhancedPrompt: result.trim(),
    }
  } catch (error) {
    console.error('Error enhancing prompt:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enhance prompt',
      enhancedPrompt: prompt,
    }
  }
}
