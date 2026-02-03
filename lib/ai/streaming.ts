// ============================================
// 2. AI STREAMING RESPONSES
// ============================================
import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'

// Provider configurations
const providers = {
  gemini: (apiKey: string) => createGoogleGenerativeAI({ apiKey }),
  openai: (apiKey: string) => createOpenAI({ apiKey }),
  anthropic: (apiKey: string) => createAnthropic({ apiKey }),
  groq: (apiKey: string) => createOpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' })
}

const modelMap = {
  gemini: 'gemini-1.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-haiku-20240307',
  groq: 'llama-3.3-70b-versatile'
}

export interface StreamOptions {
  provider: keyof typeof providers
  apiKey: string
  model?: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  onToken?: (token: string) => void
  onComplete?: (fullText: string) => void
  onError?: (error: Error) => void
}

// Client-side streaming hook
export function useStreamingAI() {
  const streamResponse = async (
    prompt: string,
    options: StreamOptions
  ): Promise<AsyncIterable<string>> => {
    const response = await fetch('/api/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        provider: options.provider,
        apiKey: options.apiKey,
        model: options.model,
        systemPrompt: options.systemPrompt,
        temperature: options.temperature,
        maxTokens: options.maxTokens
      })
    })

    if (!response.ok) throw new Error('Stream request failed')
    if (!response.body) throw new Error('No response body')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    return {
      async *[Symbol.asyncIterator]() {
        let fullText = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            fullText += chunk
            options.onToken?.(chunk)
            yield chunk
          }
          options.onComplete?.(fullText)
        } catch (error) {
          options.onError?.(error as Error)
          throw error
        }
      }
    }
  }

  return { streamResponse }
}

// Server-side streaming handler
export async function handleStreamRequest(request: Request): Promise<Response> {
  const { prompt, provider, apiKey, model, systemPrompt, temperature, maxTokens } = await request.json()

  const ai = providers[provider as keyof typeof providers](apiKey)
  const selectedModel = model || modelMap[provider as keyof typeof modelMap]

  const result = streamText({
    model: ai(selectedModel),
    system: systemPrompt || 'You are a helpful AI assistant.',
    prompt,
    temperature: temperature || 0.7
  })

  return result.toTextStreamResponse()
}

// React hook for streaming with state management
export function useStreamingChat() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentResponse, setCurrentResponse] = useState('')

  const sendMessage = async (content: string, options: StreamOptions) => {
    setMessages(prev => [...prev, { role: 'user', content }])
    setIsStreaming(true)
    setCurrentResponse('')

    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: content, ...options })
      })

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullResponse += chunk
        setCurrentResponse(fullResponse)
      }

      setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }])
      setCurrentResponse('')
    } finally {
      setIsStreaming(false)
    }
  }

  return { messages, isStreaming, currentResponse, sendMessage }
}

import { useState } from 'react'
