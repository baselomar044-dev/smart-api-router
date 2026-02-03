// ============================================
// SOLVE IT! - Streaming AI API (Trae-like)
// Real-time streaming with multi-step workflow
// ============================================

import { NextRequest } from 'next/server';

const ENDPOINTS = {
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
  claude: 'https://api.anthropic.com/v1/messages',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
};

// Default models for each provider
const DEFAULT_MODELS = {
  groq: 'llama-3.3-70b-versatile',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-1.5-flash',
  claude: 'claude-3-5-sonnet-20241022',
  deepseek: 'deepseek-chat',
};

// ============================================
// STREAMING PROVIDER FUNCTIONS
// ============================================

async function* streamGroq(apiKey: string, messages: any[], model: string): AsyncGenerator<string> {
  const response = await fetch(ENDPOINTS.groq, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 8192,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq Error: ${error}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error('No reader available');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

    for (const line of lines) {
      const data = line.replace('data: ', '').trim();
      if (data === '[DONE]') continue;
      
      try {
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
}

async function* streamOpenAI(apiKey: string, messages: any[], model: string): AsyncGenerator<string> {
  const response = await fetch(ENDPOINTS.openai, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 8192,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Error: ${error}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error('No reader available');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

    for (const line of lines) {
      const data = line.replace('data: ', '').trim();
      if (data === '[DONE]') continue;
      
      try {
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
}

async function* streamDeepSeek(apiKey: string, messages: any[], model: string): AsyncGenerator<string> {
  const response = await fetch(ENDPOINTS.deepseek, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 8192,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek Error: ${error}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error('No reader available');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

    for (const line of lines) {
      const data = line.replace('data: ', '').trim();
      if (data === '[DONE]') continue;
      
      try {
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
}

async function* streamClaude(apiKey: string, messages: any[], model: string): AsyncGenerator<string> {
  const systemMsg = messages.find((m: any) => m.role === 'system');
  const otherMsgs = messages.filter((m: any) => m.role !== 'system');

  const response = await fetch(ENDPOINTS.claude, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: systemMsg?.content || 'You are a helpful AI assistant.',
      messages: otherMsgs.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude Error: ${error}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error('No reader available');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

    for (const line of lines) {
      const data = line.replace('data: ', '').trim();
      
      try {
        const json = JSON.parse(data);
        if (json.type === 'content_block_delta') {
          const content = json.delta?.text;
          if (content) yield content;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
}

async function* streamGemini(apiKey: string, messages: any[], model: string): AsyncGenerator<string> {
  const systemMsg = messages.find((m: any) => m.role === 'system');
  const otherMsgs = messages.filter((m: any) => m.role !== 'system');
  
  const contents = otherMsgs.map((msg: any) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const response = await fetch(
    `${ENDPOINTS.gemini}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini Error: ${error}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error('No reader available');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

    for (const line of lines) {
      const data = line.replace('data: ', '').trim();
      
      try {
        const json = JSON.parse(data);
        const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) yield content;
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
}

// ============================================
// MAIN API HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, apiKeys = {}, provider: requestedProvider } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Determine which provider to use
    const availableProviders = Object.entries(apiKeys)
      .filter(([_, key]) => key && typeof key === 'string' && key.trim() !== '')
      .map(([provider]) => provider);

    if (availableProviders.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No API keys configured. Please add at least one API key in Settings.' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use requested provider if available, otherwise pick first available
    let provider = requestedProvider && availableProviders.includes(requestedProvider) 
      ? requestedProvider 
      : availableProviders[0];
    
    // Handle claude/anthropic alias
    if (provider === 'anthropic') provider = 'claude';
    if (provider === 'claude' && !apiKeys.claude && apiKeys.anthropic) {
      apiKeys.claude = apiKeys.anthropic;
    }

    const apiKey = apiKeys[provider] || apiKeys.anthropic;
    const model = DEFAULT_MODELS[provider as keyof typeof DEFAULT_MODELS] || DEFAULT_MODELS.groq;

    // Create streaming response
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let generator: AsyncGenerator<string>;
          
          switch (provider) {
            case 'groq':
              generator = streamGroq(apiKey, messages, model);
              break;
            case 'openai':
              generator = streamOpenAI(apiKey, messages, model);
              break;
            case 'deepseek':
              generator = streamDeepSeek(apiKey, messages, model);
              break;
            case 'claude':
              generator = streamClaude(apiKey, messages, model);
              break;
            case 'gemini':
              generator = streamGemini(apiKey, messages, model);
              break;
            default:
              // Fallback to groq
              generator = streamGroq(apiKey, messages, DEFAULT_MODELS.groq);
          }

          for await (const chunk of generator) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error: any) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
