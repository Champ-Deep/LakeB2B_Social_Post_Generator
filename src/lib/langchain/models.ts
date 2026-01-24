/**
 * LangChain Model Configuration
 *
 * Centralized configuration for LangChain models used in the application.
 * Uses Google Gemini as the primary model.
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai'

// Check if Gemini API is configured
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

/**
 * Check if LangChain models are configured
 */
export function isLangChainConfigured(): boolean {
  return !!GEMINI_API_KEY
}

/**
 * Create a Gemini chat model instance
 * Default model: gemini-2.0-flash for fast responses
 */
export function createGeminiChat(options: {
  modelName?: string
  temperature?: number
  maxOutputTokens?: number
} = {}): ChatGoogleGenerativeAI {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const {
    modelName = 'gemini-2.0-flash',
    temperature = 0.7,
    maxOutputTokens = 2048,
  } = options

  return new ChatGoogleGenerativeAI({
    model: modelName,
    apiKey: GEMINI_API_KEY,
    temperature,
    maxOutputTokens,
  })
}

/**
 * Pre-configured model for creative tasks (higher temperature)
 */
export function createCreativeModel(): ChatGoogleGenerativeAI {
  return createGeminiChat({
    modelName: 'gemini-2.0-flash',
    temperature: 0.9,
    maxOutputTokens: 2048,
  })
}

/**
 * Pre-configured model for analytical tasks (lower temperature)
 */
export function createAnalyticalModel(): ChatGoogleGenerativeAI {
  return createGeminiChat({
    modelName: 'gemini-2.0-flash',
    temperature: 0.3,
    maxOutputTokens: 2048,
  })
}

/**
 * Pre-configured model for prompt optimization
 */
export function createPromptOptimizerModel(): ChatGoogleGenerativeAI {
  return createGeminiChat({
    modelName: 'gemini-2.0-flash',
    temperature: 0.6,
    maxOutputTokens: 1024,
  })
}

/**
 * Model configurations for different use cases
 */
export const MODEL_CONFIGS = {
  creative: {
    modelName: 'gemini-2.0-flash',
    temperature: 0.9,
    maxOutputTokens: 2048,
    description: 'For creative content generation, brainstorming',
  },
  analytical: {
    modelName: 'gemini-2.0-flash',
    temperature: 0.3,
    maxOutputTokens: 2048,
    description: 'For analysis, summarization, structured output',
  },
  prompt: {
    modelName: 'gemini-2.0-flash',
    temperature: 0.6,
    maxOutputTokens: 1024,
    description: 'For prompt optimization and enhancement',
  },
  conversational: {
    modelName: 'gemini-2.0-flash',
    temperature: 0.7,
    maxOutputTokens: 4096,
    description: 'For general conversation and Q&A',
  },
} as const

export type ModelConfigKey = keyof typeof MODEL_CONFIGS
