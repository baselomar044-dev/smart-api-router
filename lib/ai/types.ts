// ============================================
// SOLVE IT! - AI Type Definitions
// تعريفات أنواع الذكاء الاصطناعي
// ============================================

export type AIProvider = 'groq' | 'gemini' | 'deepseek' | 'openai' | 'claude' | 'tavily';

export type TaskType = 
  | 'chat'
  | 'code'
  | 'creative'
  | 'analysis'
  | 'general'
  | 'simple_chat' 
  | 'complex_code' 
  | 'image_analysis' 
  | 'image_generation' 
  | 'web_search';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string; // Base64 encoded image
}

export interface ChatResponse {
  content: string;
  provider: AIProvider;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  fallbackUsed?: boolean;
  taskType?: TaskType;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  provider: 'tavily';
}

export interface ImageGenerationResponse {
  imageUrl: string;
  revisedPrompt?: string;
  provider: 'openai';
  model: 'dall-e-3';
}

export interface AIProviderStatus {
  provider: AIProvider;
  available: boolean;
  hasCredits: boolean;
  lastError?: string;
  lastChecked: Date;
}

export interface RouteResult {
  provider: AIProvider;
  model: string;
  reason: string;
  fallbackChain: AIProvider[];
  taskType: TaskType;
}

export interface ProviderConfig {
  models: Record<string, string>;
  capabilities: TaskType[];
  costPerToken: number;
  priority: number;
}

// API Key configuration stored in browser
export interface APIKeysConfig {
  groq?: string;
  gemini?: string;
  deepseek?: string;
  openai?: string;
  anthropic?: string;
  claude?: string; // alias for anthropic
  tavily?: string;
  // Media generation providers
  stability?: string;
  replicate?: string;
  runway?: string;
  pika?: string;
  [key: string]: string | undefined;
}
