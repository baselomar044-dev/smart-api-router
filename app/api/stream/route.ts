// ============================================
// API ROUTE: /api/stream - AI Streaming
// ============================================
import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { rateLimiters, withRateLimit } from '@/lib/rate-limiter'

const providers: Record<string, (key: string) => any> = {
  gemini: (apiKey) => createGoogleGenerativeAI({ apiKey }),
  openai: (apiKey) => createOpenAI({ apiKey }),
  anthropic: (apiKey) => createAnthropic({ apiKey }),
  groq: (apiKey) => createOpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' })
}

const defaultModels: Record<string, string> = {
  gemini: 'gemini-1.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-haiku-20240307',
  groq: 'llama-3.3-70b-versatile'
}

export async function POST(request: Request) {
  // Rate limiting
  const rateLimitResponse = await withRateLimit(rateLimiters.ai)(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { prompt, provider, apiKey, model, systemPrompt, temperature, maxTokens } = await request.json()

    if (!prompt || !provider || !apiKey) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const ai = providers[provider]?.(apiKey)
    if (!ai) {
      return Response.json({ error: 'Invalid provider' }, { status: 400 })
    }

    const selectedModel = model || defaultModels[provider]

    const result = streamText({
      model: ai(selectedModel),
      system: systemPrompt || 'You are a helpful AI assistant.',
      prompt,
      temperature: temperature || 0.7
    })

    return result.toTextStreamResponse()

  } catch (error) {
    console.error('Streaming error:', error)
    return Response.json({ error: (error as Error).message }, { status: 500 })
  }
}
