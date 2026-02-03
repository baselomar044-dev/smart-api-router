// ============================================
// SOLVE IT! - AI Providers Implementation
// تنفيذ مزودي الذكاء الاصطناعي
// FIXED: Proper fallback with correct models per provider
// ============================================

import { 
  AIProvider, 
  ChatMessage, 
  ChatResponse, 
  SearchResponse,
  ImageGenerationResponse,
  APIKeysConfig 
} from './types';
import { 
  detectTaskType, 
  routeTask, 
  markProviderFailed, 
  markProviderRecovered,
  getModelForProvider,
  FALLBACK_CHAINS 
} from './router';

// ============================================
// MAIN CHAT FUNCTION
// ============================================

export async function chat(
  messages: ChatMessage[],
  apiKeys: APIKeysConfig,
  options?: {
    forceProvider?: AIProvider;
    systemPrompt?: string;
  }
): Promise<ChatResponse> {
  const lastMessage = messages[messages.length - 1];
  const hasImage = !!lastMessage?.image;
  const taskType = detectTaskType(lastMessage?.content || '', hasImage);
  
  // Get available providers based on API keys
  const availableKeys = Object.entries(apiKeys)
    .filter(([_, value]) => !!value)
    .map(([key]) => key as AIProvider);
  
  if (availableKeys.length === 0) {
    throw new Error('لا توجد مفاتيح API متاحة. يرجى إضافة مفتاح واحد على الأقل في الإعدادات.');
  }
  
  // Get optimal route
  const route = routeTask(taskType, options?.forceProvider, availableKeys);
  let currentProvider = route.provider;
  let fallbackIndex = 0;
  let lastError: Error | null = null;
  const triedProviders: string[] = [];
  
  // Try providers in chain until one works
  while (true) {
    try {
      // Check if we have API key for this provider
      const apiKey = apiKeys[currentProvider];
      if (!apiKey) {
        throw new Error(`No API key for ${currentProvider}`);
      }
      
      // IMPORTANT: Get the correct model for THIS provider
      const modelForProvider = getModelForProvider(currentProvider, taskType);
      
      console.log(`Trying ${currentProvider} with model ${modelForProvider}...`);
      triedProviders.push(`${currentProvider}:${modelForProvider}`);
      
      const response = await callProvider(
        currentProvider, 
        messages, 
        modelForProvider, // Use provider-specific model
        apiKey,
        options?.systemPrompt
      );
      
      markProviderRecovered(currentProvider);
      
      return {
        ...response,
        provider: currentProvider,
        model: modelForProvider,
        fallbackUsed: currentProvider !== route.provider,
        taskType,
      };
    } catch (error: any) {
      lastError = error;
      console.error(`Provider ${currentProvider} failed:`, error.message);
      
      markProviderFailed(currentProvider, error.message);
      
      // Try next in fallback chain that has an API key
      const availableFallbacks = route.fallbackChain.filter(p => apiKeys[p] && !triedProviders.some(t => t.startsWith(p + ':')));
      if (fallbackIndex < availableFallbacks.length) {
        currentProvider = availableFallbacks[fallbackIndex];
        fallbackIndex++;
        console.log(`Falling back to ${currentProvider}...`);
      } else {
        // All providers failed
        const triedList = triedProviders.join(', ');
        throw new Error(`فشلت جميع المزودات المتاحة (${triedList}). آخر خطأ: ${lastError?.message}`);
      }
    }
  }
}

// ============================================
// PROVIDER CALLER
// ============================================

async function callProvider(
  provider: AIProvider,
  messages: ChatMessage[],
  model: string,
  apiKey: string,
  systemPrompt?: string
): Promise<Omit<ChatResponse, 'provider' | 'model' | 'fallbackUsed' | 'taskType'>> {
  switch (provider) {
    case 'groq':
      return callGroq(messages, model, apiKey, systemPrompt);
    case 'gemini':
      return callGemini(messages, model, apiKey, systemPrompt);
    case 'claude':
      return callClaude(messages, model, apiKey, systemPrompt);
    case 'openai':
      return callOpenAI(messages, model, apiKey, systemPrompt);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// ============================================
// GROQ PROVIDER
// ============================================

async function callGroq(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
  systemPrompt?: string
): Promise<Omit<ChatResponse, 'provider' | 'model' | 'fallbackUsed' | 'taskType'>> {
  const formattedMessages = systemPrompt 
    ? [{ role: 'system' as const, content: systemPrompt }, ...messages.map(m => ({ role: m.role, content: m.content }))]
    : messages.map(m => ({ role: m.role, content: m.content }));
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Groq API error: ${response.status}`);
  }
  
  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    usage: {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
    },
  };
}

// ============================================
// GEMINI PROVIDER
// ============================================

async function callGemini(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
  systemPrompt?: string
): Promise<Omit<ChatResponse, 'provider' | 'model' | 'fallbackUsed' | 'taskType'>> {
  // Build parts array
  const parts: any[] = [];
  
  if (systemPrompt) {
    parts.push({ text: systemPrompt + '\n\n' });
  }
  
  // Add conversation history
  for (const msg of messages) {
    if (msg.image) {
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: msg.image.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }
    parts.push({ text: `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}` });
  }
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  return {
    content,
    usage: {
      inputTokens: data.usageMetadata?.promptTokenCount || 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
    },
  };
}

// ============================================
// CLAUDE PROVIDER
// ============================================

async function callClaude(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
  systemPrompt?: string
): Promise<Omit<ChatResponse, 'provider' | 'model' | 'fallbackUsed' | 'taskType'>> {
  const formattedMessages = messages.map(msg => {
    if (msg.image) {
      return {
        role: msg.role,
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: msg.image.replace(/^data:image\/\w+;base64,/, ''),
            },
          },
          { type: 'text', text: msg.content },
        ],
      };
    }
    return { role: msg.role, content: msg.content };
  });
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: formattedMessages,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Claude API error: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.content?.[0]?.text || '';
  
  return {
    content,
    usage: {
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
    },
  };
}

// ============================================
// OPENAI PROVIDER
// ============================================

async function callOpenAI(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
  systemPrompt?: string
): Promise<Omit<ChatResponse, 'provider' | 'model' | 'fallbackUsed' | 'taskType'>> {
  const formattedMessages: any[] = [];
  
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }
  
  for (const msg of messages) {
    if (msg.image) {
      formattedMessages.push({
        role: msg.role,
        content: [
          { type: 'text', text: msg.content },
          {
            type: 'image_url',
            image_url: {
              url: msg.image.startsWith('data:') ? msg.image : `data:image/jpeg;base64,${msg.image}`,
            },
          },
        ],
      });
    } else {
      formattedMessages.push({ role: msg.role, content: msg.content });
    }
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }
  
  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    usage: {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
    },
  };
}

// ============================================
// TAVILY SEARCH
// ============================================

export async function searchWeb(
  query: string,
  apiKey: string,
  options?: {
    maxResults?: number;
    searchDepth?: 'basic' | 'advanced';
  }
): Promise<SearchResponse> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: options?.maxResults || 5,
      search_depth: options?.searchDepth || 'basic',
      include_answer: true,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Tavily API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    query,
    provider: 'tavily',
    results: data.results?.map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    })) || [],
  };
}

// ============================================
// DALL-E IMAGE GENERATION
// ============================================

export async function generateImage(
  prompt: string,
  apiKey: string,
  options?: {
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
  }
): Promise<ImageGenerationResponse> {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: options?.size || '1024x1024',
      quality: options?.quality || 'standard',
      style: options?.style || 'vivid',
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `DALL-E API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    imageUrl: data.data[0]?.url || '',
    revisedPrompt: data.data[0]?.revised_prompt,
    provider: 'openai',
    model: 'dall-e-3',
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getAvailableProviders(apiKeys: APIKeysConfig): AIProvider[] {
  return Object.entries(apiKeys)
    .filter(([_, value]) => !!value)
    .map(([key]) => key as AIProvider);
}

export function hasAnyApiKey(apiKeys: APIKeysConfig): boolean {
  return Object.values(apiKeys).some(key => !!key);
}
