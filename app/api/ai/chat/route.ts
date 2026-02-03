// ============================================
// SOLVE IT! - Smart AI Chat API
// Uses Cost/Quality Matrix for optimal routing
// SUPPORTS: Text + Images (Vision APIs)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { SmartCostQualityRouter, analyzeComplexity, PRICING_MATRIX } from '@/lib/ai/smart-router';
import { AIProvider, TaskType } from '@/lib/ai/types';

// Provider API endpoints
const ENDPOINTS = {
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
  claude: 'https://api.anthropic.com/v1/messages',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
};

// Vision-capable models
const VISION_MODELS = {
  openai: 'gpt-4o',
  gemini: 'gemini-1.5-flash',
  claude: 'claude-3-5-sonnet-20241022',
};

// ============================================
// MESSAGE TYPE HELPERS
// ============================================

interface ImageContent {
  type: 'image';
  data: string; // base64 or data URL
  mimeType?: string;
}

interface TextContent {
  type: 'text';
  text: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | (TextContent | ImageContent)[];
}

function hasImages(messages: ChatMessage[]): boolean {
  return messages.some(msg => 
    Array.isArray(msg.content) && 
    msg.content.some(c => c.type === 'image')
  );
}

function extractTextContent(content: string | (TextContent | ImageContent)[]): string {
  if (typeof content === 'string') return content;
  return content
    .filter(c => c.type === 'text')
    .map(c => (c as TextContent).text)
    .join('\n');
}

// ============================================
// PROVIDER CALL FUNCTIONS
// ============================================

async function callGroq(apiKey: string, messages: ChatMessage[], model: string): Promise<string> {
  // Groq doesn't support vision - convert to text only
  const textMessages = messages.map(msg => ({
    role: msg.role,
    content: extractTextContent(msg.content),
  }));

  const response = await fetch(ENDPOINTS.groq, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: textMessages,
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq Error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callOpenAI(apiKey: string, messages: ChatMessage[], model: string, hasVision: boolean): Promise<string> {
  // Format messages for OpenAI
  const formattedMessages = messages.map(msg => {
    if (typeof msg.content === 'string') {
      return { role: msg.role, content: msg.content };
    }
    
    // Handle multimodal content
    const content = msg.content.map(c => {
      if (c.type === 'text') {
        return { type: 'text', text: (c as TextContent).text };
      } else {
        const imgContent = c as ImageContent;
        // Ensure proper data URL format
        let imageUrl = imgContent.data;
        if (!imageUrl.startsWith('data:')) {
          const mimeType = imgContent.mimeType || 'image/png';
          imageUrl = `data:${mimeType};base64,${imgContent.data}`;
        }
        return {
          type: 'image_url',
          image_url: { url: imageUrl, detail: 'auto' }
        };
      }
    });
    
    return { role: msg.role, content };
  });

  // Use vision model if images present
  const actualModel = hasVision ? VISION_MODELS.openai : model;

  const response = await fetch(ENDPOINTS.openai, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: actualModel,
      messages: formattedMessages,
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callGemini(apiKey: string, messages: ChatMessage[], model: string, hasVision: boolean): Promise<string> {
  // Use vision-capable model if images present
  const actualModel = hasVision ? VISION_MODELS.gemini : model;
  
  // Convert messages to Gemini format
  const contents = messages
    .filter(msg => msg.role !== 'system') // Gemini handles system differently
    .map((msg) => {
      const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [];
      
      if (typeof msg.content === 'string') {
        parts.push({ text: msg.content });
      } else {
        msg.content.forEach(c => {
          if (c.type === 'text') {
            parts.push({ text: (c as TextContent).text });
          } else {
            const imgContent = c as ImageContent;
            // Extract base64 data
            let base64Data = imgContent.data;
            let mimeType = imgContent.mimeType || 'image/png';
            
            if (base64Data.startsWith('data:')) {
              const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
              if (match) {
                mimeType = match[1];
                base64Data = match[2];
              }
            }
            
            parts.push({
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            });
          }
        });
      }
      
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

  // Add system instruction if present
  const systemMsg = messages.find(m => m.role === 'system');
  const systemInstruction = systemMsg 
    ? { parts: [{ text: extractTextContent(systemMsg.content) }] }
    : undefined;

  const response = await fetch(
    `${ENDPOINTS.gemini}/${actualModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction,
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini Error: ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callClaude(apiKey: string, messages: ChatMessage[], model: string, hasVision: boolean): Promise<string> {
  // Use vision model if images present
  const actualModel = hasVision ? VISION_MODELS.claude : model;
  
  // Extract system message if present
  const systemMsg = messages.find((m) => m.role === 'system');
  const otherMsgs = messages.filter((m) => m.role !== 'system');

  // Format messages for Claude
  const formattedMessages = otherMsgs.map((msg) => {
    if (typeof msg.content === 'string') {
      return {
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      };
    }
    
    // Handle multimodal content
    const content = msg.content.map(c => {
      if (c.type === 'text') {
        return { type: 'text', text: (c as TextContent).text };
      } else {
        const imgContent = c as ImageContent;
        // Extract base64 data and mime type
        let base64Data = imgContent.data;
        let mimeType = imgContent.mimeType || 'image/png';
        
        if (base64Data.startsWith('data:')) {
          const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            base64Data = match[2];
          }
        }
        
        return {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType,
            data: base64Data,
          }
        };
      }
    });
    
    return {
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content,
    };
  });

  const response = await fetch(ENDPOINTS.claude, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: actualModel,
      max_tokens: 4096,
      system: systemMsg ? extractTextContent(systemMsg.content) : 'You are a helpful AI assistant.',
      messages: formattedMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude Error: ${error}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

async function callDeepSeek(apiKey: string, messages: ChatMessage[], model: string): Promise<string> {
  // DeepSeek doesn't support vision - convert to text only
  const textMessages = messages.map(msg => ({
    role: msg.role,
    content: extractTextContent(msg.content),
  }));

  const response = await fetch(ENDPOINTS.deepseek, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: textMessages,
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek Error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// ============================================
// MAIN API HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      messages, 
      apiKeys = {}, 
      taskType = 'general',
      forceProvider,
      forceModel,
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    // Check if any message contains images
    const containsImages = hasImages(messages);
    
    // Get the last user message for complexity analysis
    const lastUserMsg = messages.filter((m: ChatMessage) => m.role === 'user').pop();
    const prompt = lastUserMsg ? extractTextContent(lastUserMsg.content) : '';

    // Initialize smart router with available API keys
    const router = new SmartCostQualityRouter(apiKeys);
    
    // Get optimal route
    const route = router.getRoute(prompt, taskType as TaskType);
    
    // If images present, prioritize vision-capable providers
    let chain = route.chain;
    if (containsImages) {
      // Reorder: prioritize openai, gemini, claude (vision-capable)
      const visionProviders = ['openai', 'gemini', 'claude'];
      const visionChain = chain.filter(c => visionProviders.includes(c.provider));
      const nonVisionChain = chain.filter(c => !visionProviders.includes(c.provider));
      chain = [...visionChain, ...nonVisionChain];
      
      console.log('🖼️ Image detected - prioritizing vision models');
    }
    
    // Check if we have any providers
    if (chain.length === 0) {
      return NextResponse.json({ 
        error: 'لا توجد مفاتيح API متاحة. يرجى إضافة مفتاح واحد على الأقل في الإعدادات.',
        error_en: 'No API keys available. Please add at least one key in Settings.',
      }, { status: 400 });
    }

    // If forced provider/model, use that
    if (forceProvider && forceModel) {
      chain = [{ provider: forceProvider, model: forceModel }, ...chain.filter(c => c.provider !== forceProvider)];
    }

    // Try each provider in the chain
    const errors: string[] = [];
    
    for (const option of chain) {
      const { provider, model } = option;
      const apiKey = apiKeys[provider] || apiKeys.anthropic; // anthropic alias for claude
      
      if (!apiKey) continue;
      
      // Skip non-vision providers if images present
      if (containsImages && !['openai', 'gemini', 'claude'].includes(provider)) {
        console.log(`⏭️ Skipping ${provider} - no vision support`);
        continue;
      }

      try {
        console.log(`🔄 Trying ${provider}/${model}...`);
        
        let content: string;
        
        switch (provider) {
          case 'groq':
            content = await callGroq(apiKey, messages, model);
            break;
          case 'openai':
            content = await callOpenAI(apiKey, messages, model, containsImages);
            break;
          case 'gemini':
            content = await callGemini(apiKey, messages, model, containsImages);
            break;
          case 'claude':
            content = await callClaude(apiKey, messages, model, containsImages);
            break;
          case 'deepseek':
            content = await callDeepSeek(apiKey, messages, model);
            break;
          default:
            continue;
        }

        // Success!
        router.markSuccess(provider);
        
        // Calculate cost
        // Ensure provider exists in PRICING_MATRIX to prevent undefined error
        const providerPricing = PRICING_MATRIX[provider as keyof typeof PRICING_MATRIX];
        const pricing = providerPricing ? providerPricing[model as keyof typeof providerPricing] : null;
        const isFree = (pricing as any)?.free || false;
        
        // Get actual model used (might be vision model)
        const actualModel = containsImages && VISION_MODELS[provider as keyof typeof VISION_MODELS] 
          ? VISION_MODELS[provider as keyof typeof VISION_MODELS]
          : model;
        
        console.log(`✅ Success with ${provider}/${actualModel}`);
        
        return NextResponse.json({
          content,
          provider,
          model: actualModel,
          complexity: route.complexity,
          reason: route.reason,
          estimatedCost: route.estimatedCost,
          isFree,
          hasImages: containsImages,
          stats: router.getStats(),
        });

      } catch (error: any) {
        const errorMsg = `${provider}/${model}: ${error.message}`;
        errors.push(errorMsg);
        router.markFailure(provider);
        console.error(`❌ Failed: ${errorMsg}`);
        continue;
      }
    }

    // All providers failed
    return NextResponse.json({
      error: `فشلت جميع المزودات المتاحة:\n${errors.join('\n')}`,
      error_en: `All available providers failed:\n${errors.join('\n')}`,
      tried: chain.map(c => `${c.provider}/${c.model}`),
      stats: router.getStats(),
    }, { status: 500 });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown error',
    }, { status: 500 });
  }
}

// ============================================
// GET - Return routing matrix info
// ============================================

export async function GET() {
  return NextResponse.json({
    version: '2.1',
    features: [
      'Smart Cost/Quality Matrix Routing',
      'Automatic complexity detection',
      'FREE providers prioritized',
      'Intelligent fallback chain',
      '5 providers supported',
      '🖼️ Vision/Image support (NEW!)',
    ],
    routing: {
      simple: 'FREE providers (Groq, Gemini Flash)',
      medium: 'FREE → Cheap (DeepSeek, GPT-4o-mini)',
      complex: 'Quality/Price balance',
      expert: 'Best quality (Claude Sonnet, GPT-4o)',
    },
    vision: {
      openai: VISION_MODELS.openai,
      gemini: VISION_MODELS.gemini,
      claude: VISION_MODELS.claude,
    },
    providers: ['groq', 'gemini', 'deepseek', 'openai', 'claude'],
  });
}
