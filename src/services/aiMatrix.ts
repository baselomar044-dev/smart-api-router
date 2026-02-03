import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

// ==================== TRY-IT! AI MATRIX v2.0 ====================
// Multi-provider AI system with automatic fallback
// Always responds in Arabic unless told otherwise

// ===== TYPES =====
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  thinkingSteps?: string[];
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface MemoryItem {
  key: string;
  value: string;
  category: 'personal' | 'preference' | 'fact' | 'relationship';
  timestamp: number;
}

export interface RelationshipPerson {
  id: string;
  name: string;
  nickname?: string;
  birthday?: string;
  favoriteFood?: string;
  favoriteGifts?: string[];
  notes?: string;
  lastContact?: string;
  reminders?: { date: string; text: string }[];
}

// ===== API KEYS =====
const KEYS = {
  groq: import.meta.env.VITE_GROQ_API_KEY || '',
  gemini: import.meta.env.VITE_GEMINI_API_KEY || '',
  mistral: import.meta.env.VITE_MISTRAL_API_KEY || '',
  cohere: import.meta.env.VITE_COHERE_API_KEY || '',
  tavily: import.meta.env.VITE_TAVILY_API_KEY || '',
  firecrawl: import.meta.env.VITE_FIRECRAWL_API_KEY || '',
  elevenlabs: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
  replicate: import.meta.env.VITE_REPLICATE_API_KEY || '',
  e2b: import.meta.env.VITE_E2B_API_KEY || '',
  resend: import.meta.env.VITE_RESEND_API_KEY || '',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

// ===== ARABIC SYSTEM PROMPT (Professional & Modern) =====
const ARABIC_SYSTEM_PROMPT = `You are "Try-It!", a professional, advanced AI assistant.

## Core Identity:
- Name: Try-It!
- Role: Intelligent Professional Assistant
- Tone: Professional, Helpful, Concise, Modern, Polite.
- Languages: Fluent in Arabic and English. Default to Arabic if the user speaks Arabic, English if the user speaks English.

## Guidelines:
- Provide accurate, direct, and high-quality answers.
- Avoid slang, informal language, or overly casual expressions (no "ya m3allem", "ya basha", etc.).
- Use standard, modern terminology.
- Be efficient and solution-oriented.
- If the user asks for code, provide clean, well-commented, and production-ready code.
- If the user asks for help, guide them step-by-step professionally.

## Examples:
User: "Hello"
You: "Hello! How can I assist you today?"

User: "مرحبا"
You: "أهلاً بك. كيف يمكنني مساعدتك اليوم?"

User: "fix this code"
You: "Certainly. Please provide the code you would like me to fix."
`;

const ENGLISH_SYSTEM_PROMPT = `You are a helpful AI assistant named "Try-It!"

## IMPORTANT:
- Always respond in Arabic (Egyptian dialect) unless explicitly asked to use another language
- Even if the user writes in English, respond in Arabic

## Personality:
- Friendly, helpful, slightly witty
- Concise but thorough
- Professional yet approachable

## Capabilities:
- Generate PDF, Excel, Word documents
- Web search and scraping
- Read images and files (vision)
- Generate images
- Send emails
- Execute code
- Remember user information

## Important:
- When asked to create documents, actually create them - don't say "I can't"
- Ask clarifying questions when needed`;

// ===== CHAT PROVIDERS =====
interface ChatProvider {
  name: string;
  model: string;
  endpoint: string;
  supportsVision: boolean;
  getHeaders: () => Record<string, string>;
  formatBody: (messages: ChatMessage[], systemPrompt?: string) => any;
  parseResponse: (data: any) => string;
}

const CHAT_PROVIDERS: ChatProvider[] = [
  {
    name: 'gemini',
    model: 'gemini-1.5-pro',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    supportsVision: true,
    getHeaders: () => ({
      'Content-Type': 'application/json',
      'x-goog-api-key': KEYS.gemini,
    }),
    formatBody: (messages: ChatMessage[], systemPrompt?: string) => {
      const contents: any[] = [];
      const systemInstruction = systemPrompt || ARABIC_SYSTEM_PROMPT;
      
      for (const m of messages) {
        if (m.role === 'system') continue;
        
        const parts: any[] = [];
        
        if (m.content) {
          parts.push({ text: m.content });
        }
        
        if (m.image) {
          parts.push({
            inline_data: {
              mime_type: 'image/jpeg',
              data: m.image.replace(/^data:image\/\w+;base64,/, ''),
            },
          });
        }
        
        contents.push({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts,
        });
      }
      
      return {
        contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      };
    },
    parseResponse: (data: any) => {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini');
      return text;
    },
  },
  {
    name: 'groq',
    model: 'llama-3.3-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    supportsVision: false,
    getHeaders: () => ({
      'Authorization': `Bearer ${KEYS.groq}`,
      'Content-Type': 'application/json',
    }),
    formatBody: (messages: ChatMessage[], systemPrompt?: string) => {
      const formattedMessages = [];
      
      formattedMessages.push({
        role: 'system',
        content: systemPrompt || ARABIC_SYSTEM_PROMPT,
      });
      
      for (const m of messages) {
        if (m.role !== 'system') {
          formattedMessages.push({
            role: m.role,
            content: m.content,
          });
        }
      }
      
      return {
        model: 'llama-3.3-70b-versatile',
        messages: formattedMessages,
        max_tokens: 4096,
        temperature: 0.7,
      };
    },
    parseResponse: (data: any) => data.choices[0].message.content,
  },
  {
    name: 'mistral',
    model: 'mistral-large-latest',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    supportsVision: false,
    getHeaders: () => ({
      'Authorization': `Bearer ${KEYS.mistral}`,
      'Content-Type': 'application/json',
    }),
    formatBody: (messages: ChatMessage[], systemPrompt?: string) => {
      const formattedMessages = [];
      
      formattedMessages.push({
        role: 'system',
        content: systemPrompt || ARABIC_SYSTEM_PROMPT,
      });
      
      for (const m of messages) {
        if (m.role !== 'system') {
          formattedMessages.push({
            role: m.role,
            content: m.content,
          });
        }
      }
      
      return {
        model: 'mistral-large-latest',
        messages: formattedMessages,
        max_tokens: 4096,
      };
    },
    parseResponse: (data: any) => data.choices[0].message.content,
  },
  {
    name: 'cohere',
    model: 'command-r-08-2024',
    endpoint: 'https://api.cohere.ai/v1/chat',
    supportsVision: false,
    getHeaders: () => ({
      'Authorization': `Bearer ${KEYS.cohere}`,
      'Content-Type': 'application/json',
    }),
    formatBody: (messages: ChatMessage[], systemPrompt?: string) => {
      const lastMsg = messages[messages.length - 1];
      const history = messages.slice(0, -1)
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
          message: m.content,
        }));
      
      return {
        message: lastMsg.content,
        chat_history: history,
        model: 'command-r-08-2024',
        preamble: systemPrompt || ARABIC_SYSTEM_PROMPT,
      };
    },
    parseResponse: (data: any) => data.text,
  },
];

// ===== MEMORY MANAGER =====
class MemoryManager {
  private memories: Map<string, MemoryItem> = new Map();
  private relationships: Map<string, RelationshipPerson> = new Map();
  private storageKey = 'tryit_memory_v2';
  private relationshipsKey = 'tryit_relationships_v1';

  constructor() {
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const items: MemoryItem[] = JSON.parse(stored);
        items.forEach(item => this.memories.set(item.key, item));
      }
      
      const storedRel = localStorage.getItem(this.relationshipsKey);
      if (storedRel) {
        const items: RelationshipPerson[] = JSON.parse(storedRel);
        items.forEach(item => this.relationships.set(item.id, item));
      }
    } catch (e) {
      console.warn('Memory load failed, using empty memory');
    }
  }

  private save() {
    try {
      const items = Array.from(this.memories.values());
      localStorage.setItem(this.storageKey, JSON.stringify(items));
      
      const relations = Array.from(this.relationships.values());
      localStorage.setItem(this.relationshipsKey, JSON.stringify(relations));
    } catch (e) {
      console.warn('Memory save failed');
    }
  }

  remember(key: string, value: string, category: MemoryItem['category']) {
    const item: MemoryItem = {
      key,
      value,
      category,
      timestamp: Date.now(),
    };
    this.memories.set(key, item);
    this.save();
  }

  recall(key: string): string | null {
    return this.memories.get(key)?.value || null;
  }

  getAllMemories(): MemoryItem[] {
    return Array.from(this.memories.values());
  }

  addRelationship(person: RelationshipPerson) {
    this.relationships.set(person.id, person);
    this.save();
  }

  getRelationships(): RelationshipPerson[] {
    return Array.from(this.relationships.values());
  }

  getMemoryContext(): string {
    const memories = this.getAllMemories();
    const relationships = this.getRelationships();
    
    if (memories.length === 0 && relationships.length === 0) {
      return '';
    }

    let context = '\n\n[معلومات متذكرها عن المستخدم]:\n';
    
    for (const m of memories.slice(-20)) {
      context += `- ${m.key}: ${m.value}\n`;
    }
    
    if (relationships.length > 0) {
      context += '\n[علاقات المستخدم]:\n';
      for (const r of relationships) {
        context += `- ${r.name}`;
        if (r.nickname) context += ` (${r.nickname})`;
        if (r.birthday) context += ` - عيد ميلاده: ${r.birthday}`;
        context += '\n';
      }
    }
    
    return context;
  }

  extractMemoriesFromChat(userMessage: string) {
    const patterns = [
      { regex: /اسمي\s+(.+?)(?:\s|$|\.)/i, key: 'اسم المستخدم', category: 'personal' as const },
      { regex: /my name is\s+(\w+)/i, key: 'اسم المستخدم', category: 'personal' as const },
      { regex: /ana\s+(\w+)/i, key: 'اسم المستخدم', category: 'personal' as const },
      { regex: /بحب\s+(.+?)(?:\s|$|\.)/i, key: 'حاجة بيحبها', category: 'preference' as const },
      { regex: /i love\s+(.+?)(?:\s|$|\.)/i, key: 'حاجة بيحبها', category: 'preference' as const },
      { regex: /بشتغل\s+(.+?)(?:\s|$|\.)/i, key: 'الشغل', category: 'personal' as const },
      { regex: /i work as\s+(.+?)(?:\s|$|\.)/i, key: 'الشغل', category: 'personal' as const },
      { regex: /عيد ميلادي\s+(.+?)(?:\s|$|\.)/i, key: 'عيد الميلاد', category: 'personal' as const },
      { regex: /my birthday is\s+(.+?)(?:\s|$|\.)/i, key: 'عيد الميلاد', category: 'personal' as const },
    ];

    for (const p of patterns) {
      const match = userMessage.match(p.regex);
      if (match && match[1]) {
        this.remember(p.key, match[1].trim(), p.category);
      }
    }
  }
}

export const memoryManager = new MemoryManager();

// ===== RESPONSE CACHE =====
const responseCache = new Map<string, { response: AIResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(messages: ChatMessage[]): string {
  return JSON.stringify(messages.slice(-3));
}

function getCachedResponse(key: string): AIResponse | null {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response;
  }
  responseCache.delete(key);
  return null;
}

function setCachedResponse(key: string, response: AIResponse) {
  responseCache.set(key, { response, timestamp: Date.now() });
}

// ===== PROVIDER HEALTH TRACKING =====
const providerHealth = new Map<string, { failures: number; lastFailure: number }>();

function getHealthyProviders(): ChatProvider[] {
  const now = Date.now();
  const COOLDOWN = 60000; // 1 minute cooldown after 3 failures
  
  const healthy = CHAT_PROVIDERS.filter(p => {
    const health = providerHealth.get(p.name);
    if (!health) return true;
    if (health.failures < 3) return true;
    if (now - health.lastFailure > COOLDOWN) {
      providerHealth.delete(p.name);
      return true;
    }
    return false;
  });

  // If all providers are down, reset health for all to try again immediately
  if (healthy.length === 0) {
    console.warn('All providers marked as unhealthy. Resetting health status to force retry.');
    providerHealth.clear();
    return CHAT_PROVIDERS;
  }

  return healthy;
}

function recordFailure(providerName: string) {
  const health = providerHealth.get(providerName) || { failures: 0, lastFailure: 0 };
  health.failures++;
  health.lastFailure = Date.now();
  providerHealth.set(providerName, health);
}

function recordSuccess(providerName: string) {
  providerHealth.delete(providerName);
}

// ===== MAIN CHAT FUNCTION =====
export async function chat(
  messages: ChatMessage[],
  options: {
    systemPrompt?: string;
    requireVision?: boolean;
    timeout?: number;
  } = {}
): Promise<AIResponse> {
  const { systemPrompt, requireVision = false, timeout = 30000 } = options;
  
  // Check cache
  const cacheKey = getCacheKey(messages);
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    return { ...cached, provider: `${cached.provider} (cached)` };
  }
  
  // Get healthy providers
  let providers = getHealthyProviders();
  if (requireVision) {
    providers = providers.filter(p => p.supportsVision);
  }
  
  if (providers.length === 0) {
    throw new Error('لا يوجد مزودين متاحين حالياً. جرب تاني بعد شوية.');
  }
  
  const errors: string[] = [];
  const thinkingSteps: string[] = [];
  
  for (const provider of providers) {
    thinkingSteps.push(`جاري المحاولة مع ${provider.name}...`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: provider.getHeaders(),
        body: JSON.stringify(provider.formatBody(messages, systemPrompt)),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText.substring(0, 200)}`);
      }
      
      const data = await response.json();
      const content = provider.parseResponse(data);
      
      recordSuccess(provider.name);
      
      const result: AIResponse = {
        content,
        provider: provider.name,
        model: provider.model,
        thinkingSteps,
      };
      
      // Cache the response
      setCachedResponse(cacheKey, result);
      
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`❌ ${provider.name} failed:`, errorMsg);
      thinkingSteps.push(`❌ ${provider.name} فشل: ${errorMsg.substring(0, 50)}...`);
      errors.push(`${provider.name}: ${errorMsg}`);
      recordFailure(provider.name);
    }
  }
  
  throw new Error(`كل المزودين فشلوا. جرب تاني.\n${errors.join('\n')}`);
}

// ===== VISION / IMAGE ANALYSIS =====
export async function analyzeImage(imageBase64: string, question?: string): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: question || 'إيه اللي في الصورة دي؟ اوصفها بالتفصيل.',
      image: imageBase64,
    },
  ];
  
  const response = await chat(messages, { requireVision: true });
  return response.content;
}

// ===== SMART CHAT (with memory + optional search) =====
export async function smartChat(
  messages: ChatMessage[],
  options: {
    enableWebSearch?: boolean;
    enableMemory?: boolean;
    language?: 'ar' | 'en';
  } = {}
): Promise<AIResponse> {
  const { enableWebSearch = false, enableMemory = true, language = 'ar' } = options;
  
  let enrichedMessages = [...messages];
  const lastUserMsg = messages.filter(m => m.role === 'user').pop();
  
  // Add memory context
  if (enableMemory) {
    const memoryContext = memoryManager.getMemoryContext();
    if (memoryContext && enrichedMessages.length > 0) {
      enrichedMessages[0] = {
        ...enrichedMessages[0],
        content: enrichedMessages[0].content + memoryContext,
      };
    }
  }
  
  // Add web search if enabled and looks like a search query
  if (enableWebSearch && lastUserMsg) {
    const searchIndicators = ['ابحث', 'دور', 'search', 'find', 'إيه', 'مين', 'فين', 'إمتى', 'ليه', 'كيف', 'ازاي'];
    const needsSearch = searchIndicators.some(i => lastUserMsg.content.toLowerCase().includes(i.toLowerCase()));
    
    if (needsSearch) {
      try {
        const results = await webSearch(lastUserMsg.content);
        if (results.length > 0) {
          const searchContext = `\n\n[نتائج البحث]:\n${results.slice(0, 3).map(r => `- ${r.title}: ${r.snippet}`).join('\n')}`;
          enrichedMessages[enrichedMessages.length - 1] = {
            ...enrichedMessages[enrichedMessages.length - 1],
            content: enrichedMessages[enrichedMessages.length - 1].content + searchContext,
          };
        }
      } catch (e) {
        console.warn('Web search failed, continuing without it');
      }
    }
  }
  
  // Select system prompt based on language
  const systemPrompt = language === 'en' ? ENGLISH_SYSTEM_PROMPT : ARABIC_SYSTEM_PROMPT;
  
  const response = await chat(enrichedMessages, { systemPrompt });
  
  // Extract memories from conversation
  if (enableMemory && lastUserMsg) {
    memoryManager.extractMemoriesFromChat(lastUserMsg.content);
  }
  
  return response;
}

// ===== WEB SEARCH =====
export async function webSearch(query: string): Promise<WebSearchResult[]> {
  if (!KEYS.tavily) {
    console.warn('Tavily API key not set');
    return [];
  }
  
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: KEYS.tavily,
      query,
      search_depth: 'basic',
      max_results: 5,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results?.map((r: any) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
  })) || [];
}

// ===== WEB SCRAPE =====
export async function webScrape(url: string): Promise<string> {
  if (!KEYS.firecrawl) {
    throw new Error('Firecrawl API key not set');
  }
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KEYS.firecrawl}`,
    },
    body: JSON.stringify({ url, formats: ['markdown'] }),
  });
  
  if (!response.ok) {
    throw new Error(`Scrape failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data?.markdown || data.data?.content || '';
}

// ===== TEXT TO SPEECH =====
export async function textToSpeech(text: string, voiceId = 'EXAVITQu4vr4xnSDxMaL'): Promise<Blob> {
  if (!KEYS.elevenlabs) {
    throw new Error('ElevenLabs API key not set');
  }
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': KEYS.elevenlabs,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`TTS failed: ${response.status}`);
  }
  
  return response.blob();
}

// ===== SPEECH TO TEXT =====
export async function speechToText(audioBlob: Blob): Promise<string> {
  if (!KEYS.groq) {
    throw new Error('Groq API key not set');
  }
  
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3');
  
  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEYS.groq}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`STT failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.text || '';
}

// ===== IMAGE GENERATION =====
export async function generateImage(prompt: string): Promise<string> {
  if (!KEYS.replicate) {
    throw new Error('Replicate API key not set');
  }
  
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${KEYS.replicate}`,
    },
    body: JSON.stringify({
      version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
      input: {
        prompt,
        width: 1024,
        height: 1024,
        num_outputs: 1,
      },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Image generation failed: ${response.status}`);
  }
  
  const result = await response.json();
  
  // Poll for completion
  let attempts = 0;
  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 2000));
    
    const pollResponse = await fetch(result.urls.get, {
      headers: { 'Authorization': `Token ${KEYS.replicate}` },
    });
    
    const pollResult = await pollResponse.json();
    
    if (pollResult.status === 'succeeded') {
      return pollResult.output[0];
    } else if (pollResult.status === 'failed') {
      throw new Error('Image generation failed');
    }
    
    attempts++;
  }
  
  throw new Error('Image generation timed out');
}

// ===== PDF GENERATION =====
export async function generatePDF(content: {
  title: string;
  sections: { heading?: string; body: string }[];
}): Promise<Blob> {
  // Create PDF using jsPDF-like approach via HTML
  const html = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Arial', sans-serif; padding: 40px; direction: rtl; }
        h1 { color: #1a1a2e; border-bottom: 2px solid #16213e; padding-bottom: 10px; }
        h2 { color: #16213e; margin-top: 30px; }
        p { line-height: 1.8; color: #333; }
      </style>
    </head>
    <body>
      <h1>${content.title}</h1>
      ${content.sections.map(s => `
        ${s.heading ? `<h2>${s.heading}</h2>` : ''}
        <p>${s.body}</p>
      `).join('')}
    </body>
    </html>
  `;
  
  return new Blob([html], { type: 'text/html' });
}

// ===== EXCEL GENERATION =====
export async function generateExcel(data: {
  sheetName: string;
  headers: string[];
  rows: any[][];
}): Promise<Blob> {
  try {
    const wb = XLSX.utils.book_new();
    const wsData = [data.headers, ...data.rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set RTL direction if headers contain Arabic
    if (data.headers.some(h => /[\u0600-\u06FF]/.test(h))) {
      ws['!views'] = [{ rightToLeft: true }];
    }
    
    XLSX.utils.book_append_sheet(wb, ws, data.sheetName);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (e) {
    console.error('Excel generation failed, falling back to CSV', e);
    // Fallback to CSV
    const csv = [
      data.headers.join(','),
      ...data.rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  }
}

// ===== WORD GENERATION =====
export async function generateWord(content: {
  title: string;
  sections: { heading?: string; body: string }[];
}): Promise<Blob> {
  try {
    const children: Paragraph[] = [
      new Paragraph({
        text: content.title,
        heading: HeadingLevel.HEADING_1,
        bidirectional: true,
      }),
    ];

    for (const section of content.sections) {
      if (section.heading) {
        children.push(new Paragraph({
          text: section.heading,
          heading: HeadingLevel.HEADING_2,
          bidirectional: true,
        }));
      }
      children.push(new Paragraph({
        children: [new TextRun({
          text: section.body,
          rightToLeft: true, // Assume Arabic/RTL for safety
        })],
        bidirectional: true,
      }));
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });

    return await Packer.toBlob(doc);
  } catch (e) {
    console.error('Word generation failed, falling back to HTML', e);
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; padding: 40px; direction: rtl; }
          h1 { color: #1a1a2e; }
          h2 { color: #16213e; }
          p { line-height: 1.8; }
        </style>
      </head>
      <body>
        <h1>${content.title}</h1>
        ${content.sections.map(s => `
          ${s.heading ? `<h2>${s.heading}</h2>` : ''}
          <p>${s.body}</p>
        `).join('')}
      </body>
      </html>
    `;
    return new Blob([html], { type: 'application/msword' });
  }
}

// ===== SEND EMAIL =====
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!KEYS.resend) {
    throw new Error('Resend API key not set');
  }
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KEYS.resend}`,
    },
    body: JSON.stringify({
      from: 'Try-It! <notifications@tryit.app>',
      to,
      subject,
      html,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Email failed: ${response.status}`);
  }
  
  return true;
}

// ===== CODE EXECUTION =====
export async function executeCode(code: string, language: 'python' | 'javascript' = 'python'): Promise<{
  output: string;
  error?: string;
}> {
  if (!KEYS.e2b) {
    return {
      output: '',
      error: 'E2B API key not set. Code execution is not available.',
    };
  }
  
  try {
    const response = await fetch('https://api.e2b.dev/v1/sandboxes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': KEYS.e2b,
      },
      body: JSON.stringify({
        template: language === 'python' ? 'Python3' : 'Nodejs',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create sandbox: ${response.status}`);
    }
    
    const sandbox = await response.json();
    
    const execResponse = await fetch(`https://api.e2b.dev/v1/sandboxes/${sandbox.id}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': KEYS.e2b,
      },
      body: JSON.stringify({ code }),
    });
    
    const result = await execResponse.json();
    
    return {
      output: result.stdout || '',
      error: result.stderr || result.error,
    };
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Code execution failed',
    };
  }
}

// ===== CHECK API KEYS =====
export function checkApiKeys(): Record<string, boolean> {
  return {
    gemini: !!KEYS.gemini,
    groq: !!KEYS.groq,
    mistral: !!KEYS.mistral,
    cohere: !!KEYS.cohere,
    tavily: !!KEYS.tavily,
    firecrawl: !!KEYS.firecrawl,
    elevenlabs: !!KEYS.elevenlabs,
    replicate: !!KEYS.replicate,
    e2b: !!KEYS.e2b,
    resend: !!KEYS.resend,
    supabase: !!KEYS.supabaseUrl && !!KEYS.supabaseKey,
  };
}

// ===== SCRAPE WEBSITE (alias for webScrape) =====
export const scrapeWebsite = webScrape;

// ===== DOWNLOAD FILE =====
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== GET MATRIX STATUS =====
export function getMatrixStatus(): {
  providers: { name: string; status: 'healthy' | 'degraded' | 'down' }[];
  activeKeys: Record<string, boolean>;
} {
  const keys = checkApiKeys();
  const providers = [
    { name: 'Gemini', key: 'gemini' },
    { name: 'Groq', key: 'groq' },
    { name: 'Mistral', key: 'mistral' },
    { name: 'Cohere', key: 'cohere' },
  ].map(p => ({
    name: p.name,
    status: keys[p.key] ? ('healthy' as const) : ('down' as const),
  }));
  
  return { providers, activeKeys: keys };
}

// ===== ADD REMINDER =====
export interface Reminder {
  id: string;
  text: string;
  date: string;
  time?: string;
  completed: boolean;
}

const REMINDERS_KEY = 'tryit_reminders';

export function addReminder(text: string, date: string, time?: string): Reminder {
  const reminder: Reminder = {
    id: crypto.randomUUID(),
    text,
    date,
    time,
    completed: false,
  };
  
  try {
    const stored = localStorage.getItem(REMINDERS_KEY);
    const reminders: Reminder[] = stored ? JSON.parse(stored) : [];
    reminders.push(reminder);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  } catch (e) {
    console.warn('Failed to save reminder');
  }
  
  return reminder;
}

export function getReminders(): Reminder[] {
  try {
    const stored = localStorage.getItem(REMINDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function completeReminder(id: string): void {
  try {
    const stored = localStorage.getItem(REMINDERS_KEY);
    const reminders: Reminder[] = stored ? JSON.parse(stored) : [];
    const index = reminders.findIndex(r => r.id === id);
    if (index !== -1) {
      reminders[index].completed = true;
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    }
  } catch {
    console.warn('Failed to complete reminder');
  }
}

export function deleteReminder(id: string): void {
  try {
    const stored = localStorage.getItem(REMINDERS_KEY);
    const reminders: Reminder[] = stored ? JSON.parse(stored) : [];
    const filtered = reminders.filter(r => r.id !== id);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(filtered));
  } catch {
    console.warn('Failed to delete reminder');
  }
}

// ===== EXPORT USEFUL FUNCTIONS =====
export {
  ARABIC_SYSTEM_PROMPT,
  ENGLISH_SYSTEM_PROMPT,
  KEYS,
};
