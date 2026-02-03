// ============================================
// 🌊 STREAMING CHAT ROUTE - Real-time AI Responses
// ============================================
// Understands: Arabic, English, Franco-Arab
// ALWAYS responds in Arabic unless explicitly asked otherwise
// ============================================

import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { SmartRouter } from '../lib/smart-router';
import SYSTEM_PROMPT, { detectLanguage, getRequestedLanguage } from '../lib/personality';
import { generateUnlimitedSystemPrompt, DEFAULT_UNLIMITED_CONFIG } from '../lib/unlimited-ai';

const router = Router();

// Initialize AI clients
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize smart router
const smartRouter = new SmartRouter();

// In-memory stores (for demo - use database in production)
const personalityStore: Record<string, any> = {};
const memoryStore: Record<string, any[]> = {};

// Simple personality manager
class PersonalityManager {
  userId: string;
  data: any = { currentMood: 'neutral' };
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  async load() {
    this.data = personalityStore[this.userId] || { currentMood: 'neutral' };
  }
  
  async update(updates: any) {
    this.data = { ...this.data, ...updates };
    personalityStore[this.userId] = this.data;
  }
  
  getSystemPrompt() {
    return SYSTEM_PROMPT;
  }
}

// Simple memory manager
class MemoryManager {
  userId: string;
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  async getRelevantContext(_message: string): Promise<string> {
    const memories = memoryStore[this.userId] || [];
    if (memories.length === 0) return '';
    
    // Return last 5 relevant memories
    const relevant = memories.slice(-5);
    return '\n\n📝 ذكريات سابقة:\n' + relevant.map(m => `- ${m.content}`).join('\n');
  }
  
  async saveMemory(memory: { content: string; category: string }) {
    if (!memoryStore[this.userId]) {
      memoryStore[this.userId] = [];
    }
    memoryStore[this.userId].push({
      ...memory,
      timestamp: new Date().toISOString()
    });
  }
}

// Mood detection
function detectMood(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Happy indicators
  if (/😊|😄|😃|happy|great|awesome|شكرا|ممتاز|حلو|جميل|7elw|gameel|shokran/.test(lowerText)) {
    return 'happy';
  }
  
  // Frustrated indicators  
  if (/😤|😡|wtf|ugh|مش|ليه كدا|زهقت|msh|za7a8t|leih keda/.test(lowerText)) {
    return 'frustrated';
  }
  
  // Curious indicators
  if (/\?|؟|كيف|ازاي|ezay|how|what|why|ايه|eh|eih/.test(lowerText)) {
    return 'curious';
  }
  
  return 'neutral';
}

// Extract memories from message
function extractMemories(message: string): any[] {
  const memories: any[] = [];
  
  // Detect preferences
  const prefPatterns = [
    /i (love|like|prefer|enjoy|hate|dislike) (.+)/i,
    /أنا (أحب|بحب|أفضل|أكره) (.+)/,
    /ana (b7eb|ba7eb|bafadel|bakrah) (.+)/i,
  ];
  
  for (const pattern of prefPatterns) {
    const match = message.match(pattern);
    if (match) {
      memories.push({
        content: message,
        category: 'preference'
      });
    }
  }
  
  // Detect facts about user
  const factPatterns = [
    /my name is (.+)/i,
    /i am (\d+) years old/i,
    /i work (at|as|in) (.+)/i,
    /i live in (.+)/i,
    /اسمي (.+)/,
    /عمري (.+)/,
    /أعمل (.+)/,
    /أسكن في (.+)/,
    /esmi (.+)/i,
    /3omri (.+)/i,
    /bashta8al (.+)/i,
  ];
  
  for (const pattern of factPatterns) {
    const match = message.match(pattern);
    if (match) {
      memories.push({
        content: message,
        category: 'fact'
      });
    }
  }
  
  return memories;
}

// SSE Headers helper
function setSSEHeaders(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
}

// Send SSE event
function sendEvent(res: Response, type: string, data: any) {
  res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
}

// ================== STREAMING CHAT ENDPOINT ==================

router.post('/stream', async (req: Request, res: Response) => {
  const { 
    message, 
    images, 
    files, 
    systemPrompt: customSystemPrompt,
    temperature = 0.7,
    maxTokens = 4096,
    unlimitedConfig = DEFAULT_UNLIMITED_CONFIG,
  } = req.body;
  
  const userId = (req as any).user?.id || 'anonymous';
  
  // Set SSE headers
  setSSEHeaders(res);
  
  try {
    // Initialize personality and memory managers
    const personalityManager = new PersonalityManager(userId);
    const memoryManager = new MemoryManager(userId);
    
    await personalityManager.load();
    
    // Detect mood and update personality
    const mood = detectMood(message);
    await personalityManager.update({ currentMood: mood });
    
    // Get relevant memories
    const memoryContext = await memoryManager.getRelevantContext(message);
    
    // Extract new memories from message
    const newMemories = extractMemories(message);
    for (const memory of newMemories) {
      await memoryManager.saveMemory(memory);
    }
    
    // Detect input language for logging
    const inputLang = detectLanguage(message);
    console.log(`📝 Input detected as: ${inputLang}`);
    
    // Check if user requested specific response language
    const requestedLang = getRequestedLanguage(message);
    
    // Build system prompt - ALWAYS Arabic unless explicitly requested otherwise
    let languageInstruction = '\n\n🔴 تعليمات اللغة: رد بالعربية دائماً!';
    if (requestedLang) {
      languageInstruction = `\n\n🔴 Language instruction: Respond in ${requestedLang} as requested by user.`;
    }
    
    const personalityPrompt = personalityManager.getSystemPrompt();
    const unlimitedPrompt = generateUnlimitedSystemPrompt(unlimitedConfig, { conversationSummary: personalityPrompt });
    const fullSystemPrompt = customSystemPrompt 
      ? `${unlimitedPrompt}${languageInstruction}\n\n${customSystemPrompt}`
      : `${unlimitedPrompt}${languageInstruction}`;
    
    // Detect task type and get best provider
    const taskType = smartRouter.detectTaskType(message, { images, files });
    const routingDecision = await smartRouter.route(message, taskType);
    
    // Send metadata
    sendEvent(res, 'metadata', {
      model: routingDecision.model,
      provider: routingDecision.provider,
      taskType,
      inputLanguage: inputLang,
      responseLanguage: requestedLang || 'arabic',
      cached: false,
    });
    
    // Route to appropriate provider
    if (routingDecision.provider === 'groq') {
      await streamGroq(res, {
        message,
        systemPrompt: fullSystemPrompt,
        model: routingDecision.model,
        temperature,
        maxTokens,
        memoryContext,
      });
    } else if (routingDecision.provider === 'gemini') {
      await streamGemini(res, {
        message,
        systemPrompt: fullSystemPrompt,
        model: routingDecision.model,
        temperature,
        maxTokens,
        images,
        memoryContext,
      });
    } else if (routingDecision.provider === 'mistral') {
      await streamMistral(res, {
        message,
        systemPrompt: fullSystemPrompt,
        model: routingDecision.model,
        temperature,
        maxTokens,
        memoryContext,
      });
    } else if (routingDecision.provider === 'cohere') {
      await streamCohere(res, {
        message,
        systemPrompt: fullSystemPrompt,
        model: routingDecision.model,
        temperature,
        maxTokens,
        memoryContext,
      });
    } else {
      await streamOpenRouter(res, {
        message,
        systemPrompt: fullSystemPrompt,
        model: routingDecision.model,
        temperature,
        maxTokens,
        memoryContext,
      });
    }
    
    // Update rate limits
    smartRouter.recordUsage(routingDecision.provider);
    
    // End stream
    res.write('data: [DONE]\n\n');
    res.end();
    
  } catch (error: any) {
    console.error('Streaming error:', error);
    // Try to recover with fallback if not already committed
    if (!res.headersSent) {
       try {
         const fallback = await smartRouter.getBestProvider();
         if (fallback.name === 'openrouter') { // Prevent infinite loop if fallback is same
            sendEvent(res, 'error', { message: error.message });
            res.end();
            return;
         }
         
         // Basic fallback logic here could be expanded
         sendEvent(res, 'error', { message: 'Primary provider failed, please retry.' });
       } catch (e) {
         sendEvent(res, 'error', { message: error.message });
       }
    } else {
       sendEvent(res, 'error', { message: error.message });
    }
    res.end();
  }
});

// ================== PROVIDER STREAMING FUNCTIONS ==================

async function streamGroq(
  res: Response,
  options: {
    message: string;
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    memoryContext: string;
  }
) {
  const { message, systemPrompt, model, temperature, maxTokens, memoryContext } = options;
  
  const stream = await groq.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt + memoryContext },
      { role: 'user', content: message },
    ],
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      sendEvent(res, 'token', { content });
    }
  }
}

async function streamGemini(
  res: Response,
  options: {
    message: string;
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    images?: string[];
    memoryContext: string;
  }
) {
  const { message, systemPrompt, model, temperature, maxTokens, images, memoryContext } = options;
  
  const genModel = gemini.getGenerativeModel({ 
    model,
    systemInstruction: systemPrompt + memoryContext,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });
  
  // Build content parts
  const parts: any[] = [{ text: message }];
  
  // Add images if present
  if (images && images.length > 0) {
    for (const imageData of images) {
      // Assume base64 data
      const [mimeType, base64] = imageData.split(';base64,');
      parts.push({
        inlineData: {
          mimeType: mimeType.replace('data:', ''),
          data: base64,
        },
      });
    }
  }
  
  const result = await genModel.generateContentStream(parts);
  
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      sendEvent(res, 'token', { content: text });
    }
  }
}

async function streamMistral(
  res: Response,
  options: {
    message: string;
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    memoryContext: string;
  }
) {
  const { message, systemPrompt, model, temperature, maxTokens, memoryContext } = options;
  
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt + memoryContext },
        { role: 'user', content: message },
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Mistral error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) {
            sendEvent(res, 'token', { content });
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }
}

async function streamCohere(
  res: Response,
  options: {
    message: string;
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    memoryContext: string;
  }
) {
  const { message, systemPrompt, model, temperature, maxTokens, memoryContext } = options;
  
  const response = await fetch('https://api.cohere.com/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      model,
      message,
      preamble: systemPrompt + memoryContext,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Cohere error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.event_type === 'text-generation' && data.text) {
          sendEvent(res, 'token', { content: data.text });
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
}

async function streamOpenRouter(
  res: Response,
  options: {
    message: string;
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    memoryContext: string;
  }
) {
  const { message, systemPrompt, model, temperature, maxTokens, memoryContext } = options;
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt + memoryContext },
        { role: 'user', content: message },
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.statusText}`);
  }
  
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');
  
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) {
            sendEvent(res, 'token', { content });
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }
}

// ================== NON-STREAMING ENDPOINT (Fallback) ==================

router.post('/complete', async (req: Request, res: Response) => {
  const { message, images } = req.body;
  // const userId = (req as any).user?.id || 'anonymous';
  
  try {
    // Detect task and route
    const taskType = smartRouter.detectTaskType(message, { images });
    const routingDecision = await smartRouter.route(message, taskType);
    
    // Check if user requested specific response language
    const requestedLang = getRequestedLanguage(message);
    const languageInstruction = requestedLang 
      ? `Respond in ${requestedLang}.`
      : 'رد بالعربية دائماً - Always respond in Arabic.';
    
    let response: string;
    
    if (routingDecision.provider === 'groq') {
      const completion = await groq.chat.completions.create({
        model: routingDecision.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + '\n\n' + languageInstruction },
          { role: 'user', content: message }
        ],
      });
      response = completion.choices[0]?.message?.content || '';
    } else {
      const model = gemini.getGenerativeModel({ 
        model: routingDecision.model,
        systemInstruction: SYSTEM_PROMPT + '\n\n' + languageInstruction,
      });
      const result = await model.generateContent(message);
      response = result.response.text();
    }
    
    smartRouter.recordUsage(routingDecision.provider);
    
    res.json({
      response,
      metadata: {
        model: routingDecision.model,
        provider: routingDecision.provider,
        taskType,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================== USAGE STATS ENDPOINT ==================

router.get('/stats', (_req: Request, res: Response) => {
  const stats = smartRouter.getStats();
  res.json(stats);
});

export default router;
