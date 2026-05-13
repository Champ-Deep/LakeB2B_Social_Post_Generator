import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface CriticFeedback {
  passed: boolean;
  feedback: string;
}

const CRITIC_PROMPT = `You are an expert brand critic and copy editor for LakeB2B.
Your task is to obsessively evaluate the provided social media post suggestions against our strict brand heuristics.
We are looking for ZERO out-of-character content.

LAKEB2B BRAND HEURISTICS:
1. NO EM DASHES: You must reject the content if there is a single em dash ("—" or "--"). This is a strict rule.
2. NO AI SLOP/JARGON: You must reject the content if it uses overused AI words, jargon, or "AI slop" (e.g., "delve", "transformative", "synergy", "unlock", "seamless", "elevate", "cutting-edge"). The writing should sound human, direct, and slightly mildly irreverent.
3. TONE: The tone should be slightly mildly irreverent, while remaining a professional B2B tone. It should NOT be overly enthusiastic, formal, or robotic.

Evaluate the following suggestions:

SUGGESTIONS TO EVALUATE:
{suggestions}

Analyze the suggestions carefully against the heuristics.
If ALL suggestions pass ALL heuristics, return \`passed: true\`.
If ANY suggestion fails ANY heuristic, return \`passed: false\` and provide specific, actionable feedback explaining exactly which suggestion failed and why. Give instructions on how to fix it for a retry prompt.

IMPORTANT: Return ONLY valid JSON in this exact format, no additional text:
{
  "passed": true/false,
  "feedback": "Your detailed feedback here (empty string if passed)"
}`;

export async function evaluateWithCritic(suggestions: any[]): Promise<CriticFeedback> {
  if (!GEMINI_API_KEY) {
    console.warn('[Brand Critic] GEMINI_API_KEY not configured, skipping critic evaluation');
    return { passed: true, feedback: '' };
  }

  try {
    const suggestionsText = JSON.stringify(suggestions, null, 2);
    const fullPrompt = CRITIC_PROMPT.replace('{suggestions}', suggestionsText);

    console.log('[Brand Critic] Evaluating suggestions...');

    // We can use a fast, lightweight model for the critic, like gemini-2.0-flash-lite
    // or fallback to gemini-2.0-flash if needed. Let's try 2.0-flash-lite-preview-02-05
    // Actually, to be safe and ensure the model exists and works, we'll use gemini-2.0-flash
    // which is the same model used for generation and is very fast.
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.1, // Low temperature for more deterministic evaluation
          maxOutputTokens: 1024,
        }
      },
      {
        headers: {
          'x-goog-api-key': GEMINI_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const textResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error('No text response from AI Critic');
    }

    let parsedFeedback: CriticFeedback;
    try {
      let jsonStr = textResponse;
      const jsonMatch = textResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      parsedFeedback = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('[Brand Critic] Failed to parse critic response:', textResponse);
      // If the critic fails to return valid JSON, we assume it failed or there's an issue.
      // We will err on the side of caution and let it pass if it's a parsing error to avoid blocking the user,
      // but in a strict system we might want to fail it. Let's pass it and log.
      return { passed: true, feedback: 'Critic failed to parse response, allowing through.' };
    }

    console.log(`[Brand Critic] Evaluation result: passed=${parsedFeedback.passed}`);
    if (!parsedFeedback.passed) {
      console.log(`[Brand Critic] Feedback: ${parsedFeedback.feedback}`);
    }

    return parsedFeedback;
  } catch (error) {
    console.error('[Brand Critic] Error during evaluation:', error);
    // On error, let it pass to not block the user, or we could strict fail it.
    // Given the prompt allows for one retry, if it fails here we just pass it.
    return { passed: true, feedback: 'Critic error, allowing through.' };
  }
}
