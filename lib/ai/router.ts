// ============================================
// SOLVE IT! - Smart AI Router
// الموجه الذكي للذكاء الاصطناعي
// ============================================

import { AIProvider, TaskType, RouteResult, AIProviderStatus, ProviderConfig } from './types';

// Provider configurations with costs and capabilities
// UPDATED: Using correct current model names
export const PROVIDER_CONFIGS: Record<Exclude<AIProvider, 'tavily'>, ProviderConfig> = {
  groq: {
    models: {
      fast: 'llama-3.3-70b-versatile',
      default: 'llama-3.3-70b-versatile', // Updated - old llama-3.1-8b-instant is deprecated
      code: 'llama-3.3-70b-versatile',
    },
    capabilities: ['simple_chat', 'general', 'complex_code'],
    costPerToken: 0, // FREE!
    priority: 1, // Highest priority (cheapest)
  },
  gemini: {
    models: {
      vision: 'gemini-1.5-flash',
      default: 'gemini-1.5-flash',
      pro: 'gemini-1.5-pro',
    },
    capabilities: ['image_analysis', 'simple_chat', 'general', 'complex_code'],
    costPerToken: 0.00025,
    priority: 2,
  },
  claude: {
    models: {
      default: 'claude-3-5-sonnet-20241022',
      complex: 'claude-3-5-sonnet-20241022',
    },
    capabilities: ['complex_code', 'general', 'simple_chat'],
    costPerToken: 0.015,
    priority: 4, // Reserve for complex tasks
  },
  openai: {
    models: {
      default: 'gpt-4o-mini',
      vision: 'gpt-4o',
      complex: 'gpt-4o',
      image_gen: 'dall-e-3',
    },
    capabilities: ['image_generation', 'complex_code', 'image_analysis', 'general', 'simple_chat'],
    costPerToken: 0.01,
    priority: 3,
  },
};

// Fallback chains - who to try next if a provider fails
export const FALLBACK_CHAINS: Record<AIProvider, AIProvider[]> = {
  groq: ['gemini', 'openai', 'claude'],
  gemini: ['openai', 'groq', 'claude'],
  claude: ['openai', 'gemini', 'groq'],
  openai: ['claude', 'gemini', 'groq'],
  tavily: [], // No fallback for search
};

// Best provider for each task type
const TASK_OPTIMAL_PROVIDER: Record<TaskType, AIProvider> = {
  simple_chat: 'groq',      // Free + fast
  complex_code: 'claude',   // Best quality for code
  image_analysis: 'gemini', // Specialized + cheap
  image_generation: 'openai', // DALL-E only option
  web_search: 'tavily',     // Only option
  general: 'groq',          // Default to cheapest
};

// In-memory provider status tracking
const providerStatus: Map<AIProvider, AIProviderStatus> = new Map();

// Initialize all providers as available
(['groq', 'gemini', 'claude', 'openai', 'tavily'] as AIProvider[]).forEach(provider => {
  providerStatus.set(provider, {
    provider,
    available: true,
    hasCredits: true,
    lastChecked: new Date(),
  });
});

/**
 * Detect task type from the prompt
 * يكتشف نوع المهمة من النص المدخل
 */
export function detectTaskType(prompt: string, hasImage: boolean = false): TaskType {
  const promptLower = prompt.toLowerCase();
  
  // Image analysis
  if (hasImage) {
    return 'image_analysis';
  }
  
  // Web search keywords
  const searchKeywords = [
    'search', 'find online', 'look up', 'google', 
    'ابحث', 'بحث في الإنترنت', 'جوجل', 'ما هو أحدث', 'آخر أخبار'
  ];
  if (searchKeywords.some(kw => promptLower.includes(kw))) {
    return 'web_search';
  }
  
  // Image generation keywords
  const imageGenKeywords = [
    'generate image', 'create image', 'draw', 'make a picture', 'create art',
    'ارسم', 'أنشئ صورة', 'ولد صورة', 'اصنع صورة', 'رسم'
  ];
  if (imageGenKeywords.some(kw => promptLower.includes(kw))) {
    return 'image_generation';
  }
  
  // Complex code keywords
  const complexCodeKeywords = [
    'build', 'create app', 'full stack', 'saas', 'complex', 'architecture',
    'refactor', 'optimize', 'debug', 'review code', 'fix bug',
    'authentication', 'database', 'api', 'backend', 'frontend',
    'ابني', 'أنشئ تطبيق', 'مشروع كامل', 'هيكل', 'معقد',
    'إصلاح', 'تحسين', 'مراجعة الكود'
  ];
  if (complexCodeKeywords.some(kw => promptLower.includes(kw))) {
    return 'complex_code';
  }
  
  // Simple chat (short messages)
  if (prompt.length < 100) {
    return 'simple_chat';
  }
  
  return 'general';
}

/**
 * Get the correct model for a provider and task type
 * يحصل على الموديل الصحيح لكل مزود ونوع مهمة
 */
export function getModelForProvider(provider: AIProvider, taskType: TaskType): string {
  if (provider === 'tavily') {
    return 'search';
  }
  
  const config = PROVIDER_CONFIGS[provider];
  
  // Select model based on task
  if (taskType === 'complex_code' && config.models.complex) {
    return config.models.complex;
  } else if (taskType === 'image_analysis' && config.models.vision) {
    return config.models.vision;
  } else if (taskType === 'image_generation' && config.models.image_gen) {
    return config.models.image_gen;
  }
  
  return config.models.default;
}

/**
 * Get the optimal route for a task
 * يحصل على أفضل مسار للمهمة
 */
export function routeTask(taskType: TaskType, forceProvider?: AIProvider, availableKeys?: string[]): RouteResult {
  // If forced provider, use it
  if (forceProvider && (!availableKeys || availableKeys.includes(forceProvider))) {
    return {
      provider: forceProvider,
      model: getModelForProvider(forceProvider, taskType),
      reason: 'مزود محدد',
      fallbackChain: FALLBACK_CHAINS[forceProvider].filter(p => !availableKeys || availableKeys.includes(p)),
      taskType,
    };
  }
  
  // Get optimal provider for task
  let optimalProvider = TASK_OPTIMAL_PROVIDER[taskType];
  
  // Check if optimal provider has API key
  if (availableKeys && !availableKeys.includes(optimalProvider)) {
    // Find alternative from fallback chain
    const fallbacks = FALLBACK_CHAINS[optimalProvider];
    const available = fallbacks.find(p => availableKeys.includes(p));
    if (available) {
      optimalProvider = available;
    }
  }
  
  return {
    provider: optimalProvider,
    model: getModelForProvider(optimalProvider, taskType),
    reason: getRouteReason(taskType, optimalProvider),
    fallbackChain: FALLBACK_CHAINS[optimalProvider].filter(p => !availableKeys || availableKeys.includes(p)),
    taskType,
  };
}

function getRouteReason(taskType: TaskType, provider: AIProvider): string {
  const reasons: Record<string, string> = {
    'groq-simple_chat': 'Groq سريع ومجاني للمحادثات البسيطة',
    'groq-general': 'Groq الخيار الافتراضي الأرخص',
    'gemini-image_analysis': 'Gemini متخصص في تحليل الصور',
    'claude-complex_code': 'Claude الأفضل للكود المعقد',
    'openai-image_generation': 'DALL-E الوحيد لتوليد الصور',
    'tavily-web_search': 'Tavily للبحث في الإنترنت',
  };
  return reasons[`${provider}-${taskType}`] || `${provider} للمهمة`;
}

/**
 * Mark provider as failed
 */
export function markProviderFailed(provider: AIProvider, error: string): void {
  const status = providerStatus.get(provider);
  if (status) {
    status.available = false;
    status.lastError = error;
    status.lastChecked = new Date();
  }
}

/**
 * Mark provider as recovered
 */
export function markProviderRecovered(provider: AIProvider): void {
  const status = providerStatus.get(provider);
  if (status) {
    status.available = true;
    status.lastError = undefined;
    status.lastChecked = new Date();
  }
}

/**
 * Get provider status
 */
export function getProviderStatus(provider: AIProvider): AIProviderStatus | undefined {
  return providerStatus.get(provider);
}

/**
 * Get all providers status
 */
export function getAllProvidersStatus(): AIProviderStatus[] {
  return Array.from(providerStatus.values());
}

/**
 * Check if any provider is available
 * يتحقق من توفر أي مزود
 */
export function isAnyProviderAvailable(): boolean {
  for (const [, status] of providerStatus) {
    if (status.available && status.hasCredits) {
      return true;
    }
  }
  return false;
}

/**
 * Reset all provider statuses
 * إعادة ضبط جميع حالات المزودين
 */
export function resetAllProviderStatuses(): void {
  providerStatus.forEach((status) => {
    status.available = true;
    status.hasCredits = true;
    status.lastError = undefined;
    status.lastChecked = new Date();
  });
}

/**
 * Estimate cost for a request (70-80% savings by routing to cheapest!)
 * تقدير تكلفة الطلب
 */
export function estimateCost(provider: AIProvider, inputTokens: number, outputTokens: number): number {
  if (provider === 'tavily') {
    return 0.01; // Per search
  }
  const config = PROVIDER_CONFIGS[provider];
  return (inputTokens + outputTokens) * config.costPerToken;
}

/**
 * Calculate savings compared to using OpenAI for everything
 * حساب التوفير مقارنة باستخدام OpenAI لكل شيء
 */
export function calculateSavings(provider: AIProvider, tokens: number): { saved: number; percentage: number } {
  const openaiCost = tokens * 0.01; // OpenAI baseline
  const actualCost = provider === 'tavily' ? 0.01 : tokens * PROVIDER_CONFIGS[provider].costPerToken;
  const saved = openaiCost - actualCost;
  const percentage = openaiCost > 0 ? Math.round((saved / openaiCost) * 100) : 0;
  return { saved, percentage };
}
