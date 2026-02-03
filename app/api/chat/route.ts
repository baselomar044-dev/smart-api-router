import { NextRequest, NextResponse } from 'next/server'

// ============================================
// CHAT API ROUTE
// Supports: Groq, Gemini, Claude, OpenAI
// ============================================

export async function POST(req: NextRequest) {
  try {
    const { messages, model, apiKey } = await req.json()

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
    }

    let content: string

    switch (model) {
      case 'groq':
        content = await callGroq(messages, apiKey)
        break
      case 'gemini':
        content = await callGemini(messages, apiKey)
        break
      case 'claude':
        content = await callClaude(messages, apiKey)
        break
      case 'openai':
        content = await callOpenAI(messages, apiKey)
        break
      default:
        content = await callGroq(messages, apiKey)
    }

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ 
      error: error.message || 'حدث خطأ غير متوقع' 
    }, { status: 500 })
  }
}

// ============================================
// GROQ API
// ============================================
async function callGroq(messages: any[], apiKey: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      max_tokens: 4096,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Groq API error (${response.status})`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

// ============================================
// GEMINI API
// ============================================
async function callGemini(messages: any[], apiKey: string): Promise<string> {
  // Convert messages to Gemini format
  const geminiMessages = messages.map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  // Ensure first message is from user
  if (geminiMessages[0]?.role === 'model') {
    geminiMessages.shift()
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Gemini API error (${response.status})`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ============================================
// CLAUDE API
// ============================================
async function callClaude(messages: any[], apiKey: string): Promise<string> {
  // Extract system message if present
  let systemMessage = ''
  const chatMessages = messages.filter((m: any) => {
    if (m.role === 'system') {
      systemMessage = m.content
      return false
    }
    return true
  })

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemMessage || 'You are a helpful assistant.',
      messages: chatMessages.map((m: any) => ({
        role: m.role,
        content: m.content
      })),
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Claude API error (${response.status})`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

// ============================================
// OPENAI API
// ============================================
async function callOpenAI(messages: any[], apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 4096,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `OpenAI API error (${response.status})`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}
