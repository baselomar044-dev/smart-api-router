// ============================================
// SOLVE IT! - Smart Cost/Quality Matrix Router
// Best Quality + Cheapest Cost Strategy
// ============================================

import { AIProvider, TaskType, RouteResult } from './types';

// ============================================
// PRICING MATRIX (per 1M tokens - Jan 2025)
// ============================================
export const PRICING_MATRIX = {
  // Provider: { input: $/1M, output: $/1M, quality: 1-10, speed: 1-10 }
  groq: {
    'llama-3.3-70b-versatile': { input: 0, output: 0, quality: 7.5, speed: 10, free: true },
    'llama-3.1-70b-versatile': { input: 0, output: 0, quality: 7, speed: 10, free: true },
    'mixtral-8x7b-32768': { input: 0, output: 0, quality: 7, speed: 10, free: true },
    'gemma2-9b-it': { input: 0, output: 0, quality: 6.5, speed: 10, free: true },
  },
  gemini: {
    'gemini-1.5-flash': { input: 0.075, output: 0.30, quality: 8, speed: 9, free: true }, // Free tier available
    'gemini-1.5-pro': { input: 1.25, output: 5.00, quality: 9, speed: 7, free: false },
    'gemini-2.0-flash-exp': { input: 0, output: 0, quality: 8.5, speed: 9, free: true },
  },
  deepseek: {
    'deepseek-chat': { input: 0.14, output: 0.28, quality: 8.5, speed: 8, free: false },
    'deepseek-coder': { input: 0.14, output: 0.28, quality: 9, speed: 8, free: false }, // Best for code!
  },
  openai: {
    'gpt-4o-mini': { input: 0.15, output: 0.60, quality: 8, speed: 8, free: false },
    'gpt-4o': { input: 2.50, output: 10.00, quality: 9.5, speed: 7, free: false },
    'gpt-4-turbo': { input: 10.00, output: 30.00, quality: 9, speed: 6, free: false },
  },
  claude: {
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00, quality: 9.5, speed: 7, free: false },
    'claude-3-5-haiku-20241022': { input: 0.25, output: 1.25, quality: 8, speed: 9, free: false },
    'claude-3-opus-20240229': { input: 15.00, output: 75.00, quality: 10, speed: 5, free: false },
  },
};

// ============================================
// TASK COMPLEXITY LEVELS
// ============================================
export type ComplexityLevel = 'simple' | 'medium' | 'complex' | 'expert';

export function analyzeComplexity(prompt: string, taskType: TaskType): ComplexityLevel {
  const length = prompt.length;
  const words = prompt.split(/\s+/).length;
  
  // Complexity indicators
  const hasCode = /```|function|class|import|export|const |let |var |def |async |await/.test(prompt);
  const hasMultiStep = /step|first|then|after|finally|1\.|2\.|3\.|\d\)/.test(prompt.toLowerCase());
  const hasAnalysis = /analyze|compare|evaluate|review|assess|critique/.test(prompt.toLowerCase());
  const hasCreative = /write|create|design|build|generate|make/.test(prompt.toLowerCase());
  const hasDebug = /fix|debug|error|bug|issue|problem|not working/.test(prompt.toLowerCase());
  const hasExpert = /advanced|complex|detailed|comprehensive|in-depth|expert/.test(prompt.toLowerCase());
  
  let score = 0;
  
  // Length scoring
  if (length > 2000) score += 3;
  else if (length > 500) score += 2;
  else if (length > 100) score += 1;
  
  // Task type scoring
  if (taskType === 'code') score += 2;
  if (taskType === 'analysis') score += 2;
  if (taskType === 'creative') score += 1;
  
  // Content scoring
  if (hasCode) score += 2;
  if (hasMultiStep) score += 2;
  if (hasAnalysis) score += 2;
  if (hasDebug) score += 1;
  if (hasExpert) score += 3;
  if (hasCreative && words > 50) score += 1;
  
  // Determine level
  if (score >= 8) return 'expert';
  if (score >= 5) return 'complex';
  if (score >= 2) return 'medium';
  return 'simple';
}

// ============================================
// SMART ROUTING MATRIX
// Priority: FREE → CHEAP → QUALITY
// ============================================
export const ROUTING_MATRIX: Record<ComplexityLevel, Record<TaskType, {
  primary: { provider: AIProvider; model: string }[];
  fallback: { provider: AIProvider; model: string }[];
}>> = {
  // SIMPLE TASKS - Use FREE providers only
  simple: {
    chat: {
      primary: [
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },      // FREE + Fast
        { provider: 'gemini', model: 'gemini-1.5-flash' },           // FREE tier
      ],
      fallback: [
        { provider: 'deepseek', model: 'deepseek-chat' },            // Very cheap
        { provider: 'openai', model: 'gpt-4o-mini' },                // Cheap
      ],
    },
    code: {
      primary: [
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },      // FREE + Good at code
        { provider: 'gemini', model: 'gemini-1.5-flash' },           // FREE tier
      ],
      fallback: [
        { provider: 'deepseek', model: 'deepseek-coder' },           // Cheap + Code specialist
        { provider: 'openai', model: 'gpt-4o-mini' },
      ],
    },
    creative: {
      primary: [
        { provider: 'gemini', model: 'gemini-1.5-flash' },           // Good creative
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      ],
      fallback: [
        { provider: 'deepseek', model: 'deepseek-chat' },
        { provider: 'claude', model: 'claude-3-5-haiku-20241022' },  // Good creative
      ],
    },
    analysis: {
      primary: [
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
        { provider: 'gemini', model: 'gemini-1.5-flash' },
      ],
      fallback: [
        { provider: 'deepseek', model: 'deepseek-chat' },
        { provider: 'openai', model: 'gpt-4o-mini' },
      ],
    },
    general: {
      primary: [
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
        { provider: 'gemini', model: 'gemini-1.5-flash' },
      ],
      fallback: [
        { provider: 'deepseek', model: 'deepseek-chat' },
        { provider: 'openai', model: 'gpt-4o-mini' },
      ],
    },
  },

  // MEDIUM TASKS - Use FREE first, then CHEAP
  medium: {
    chat: {
      primary: [
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
        { provider: 'gemini', model: 'gemini-2.0-flash-exp' },       // Better quality, still free
      ],
      fallback: [
        { provider: 'deepseek', model: 'deepseek-chat' },
        { provider: 'openai', model: 'gpt-4o-mini' },
        { provider: 'claude', model: 'claude-3-5-haiku-20241022' },
      ],
    },
    code: {
      primary: [
        { provider: 'deepseek', model: 'deepseek-coder' },           // Best value for code!
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      ],
      fallback: [
        { provider: 'gemini', model: 'gemini-1.5-flash' },
        { provider: 'openai', model: 'gpt-4o-mini' },
        { provider: 'claude', model: 'claude-3-5-haiku-20241022' },
      ],
    },
    creative: {
      primary: [
        { provider: 'gemini', model: 'gemini-2.0-flash-exp' },
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      ],
      fallback: [
        { provider: 'claude', model: 'claude-3-5-haiku-20241022' },  // Great at creative
        { provider: 'deepseek', model: 'deepseek-chat' },
        { provider: 'openai', model: 'gpt-4o-mini' },
      ],
    },
    analysis: {
      primary: [
        { provider: 'gemini', model: 'gemini-2.0-flash-exp' },
        { provider: 'deepseek', model: 'deepseek-chat' },
      ],
      fallback: [
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
        { provider: 'openai', model: 'gpt-4o-mini' },
        { provider: 'claude', model: 'claude-3-5-haiku-20241022' },
      ],
    },
    general: {
      primary: [
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
        { provider: 'gemini', model: 'gemini-2.0-flash-exp' },
      ],
      fallback: [
        { provider: 'deepseek', model: 'deepseek-chat' },
        { provider: 'openai', model: 'gpt-4o-mini' },
        { provider: 'claude', model: 'claude-3-5-haiku-20241022' },
      ],
    },
  },

  // COMPLEX TASKS - Balance quality and cost
  complex: {
    chat: {
      primary: [
        { provider: 'deepseek', model: 'deepseek-chat' },            // Great quality/price
        { provider: 'gemini', model: 'gemini-1.5-pro' },             // High quality
      ],
      fallback: [
        { provider: 'openai', model: 'gpt-4o-mini' },
        { provider: 'claude', model: 'claude-3-5-haiku-20241022' },
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      ],
    },
    code: {
      primary: [
        { provider: 'deepseek', model: 'deepseek-coder' },           // BEST for complex code!
        { provider: 'claude', model: 'claude-3-5-haiku-20241022' },
      ],
      fallback: [
        { provider: 'openai', model: 'gpt-4o-mini' },
        { provider: 'gemini', model: 'gemini-1.5-pro' },
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      ],
    },
    creative: {
      primary: [
        { provider: 'claude', model: 'claude-3-5-haiku-20241022' },  // Best creative
        { provider: 'gemini', model: 'gemini-1.5-pro' },
      ],
      fallback: [
        { provider: 'deepseek', model: 'deepseek-chat' },
        { provider: 'openai', model: 'gpt-4o-mini' },
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      ],
    },
    analysis: {
      primary: [
        { provider: 'gemini', model: 'gemini-1.5-pro' },             // Great at analysis
        { provider: 'deepseek', model: 'deepseek-chat' },
      ],
      fallback: [
        { provider: 'openai', model: 'gpt-4o-mini' },
        { provider: 'claude', model: 'claude-3-5-haiku-20241022' },
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      ],
    },
    general: {
      primary: [
        { provider: 'deepseek', model: 'deepseek-chat' },
        { provider: 'gemini', model: 'gemini-1.5-pro' },
      ],
      fallback: [
        { provider: 'openai', model: 'gpt-4o-mini' },
        { provider: 'claude', model: 'claude-3-5-haiku-20241022' },
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      ],
    },
  },

  // EXPERT TASKS - Quality first, but still smart about cost
  expert: {
    chat: {
      primary: [
        { provider: 'claude', model: 'claude-3-5-sonnet-20241022' }, // Top quality
        { provider: 'openai', model: 'gpt-4o' },                     // Top quality
      ],
      fallback: [
        { provider: 'gemini', model: 'gemini-1.5-pro' },
        { provider: 'deepseek', model: 'deepseek-chat' },
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      ],
    },
    code: {
      primary: [
        { provider: 'claude', model: 'claude-3-5-sonnet-20241022' }, // BEST for expert code
        { provider: 'deepseek', model: 'deepseek-coder' },           // Great alternative
      ],
      fallback: [
        { provider: 'openai', model: 'gpt-4o' },
        { provider: 'gemini', model: 'gemini-1.5-pro' },
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      ],
    },
    creative: {
      primary: [
        { provider: 'claude', model: 'claude-3-5-sonnet-20241022' }, // BEST for creative
        { provider: 'openai', model: 'gpt-4o' },
      ],
      fallback: [
        { provider: 'gemini', model: 'gemini-1.5-pro' },
        { provider: 'deepseek', model: 'deepseek-chat' },
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      ],
    },
    analysis: {
      primary: [
        { provider: 'openai', model: 'gpt-4o' },                     // BEST for analysis
        { provider: 'claude', model: 'claude-3-5-sonnet-20241022' },
      ],
      fallback: [
        { provider: 'gemini', model: 'gemini-1.5-pro' },
        { provider: 'deepseek', model: 'deepseek-chat' },
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      ],
    },
    general: {
      primary: [
        { provider: 'claude', model: 'claude-3-5-sonnet-20241022' },
        { provider: 'openai', model: 'gpt-4o' },
      ],
      fallback: [
        { provider: 'gemini', model: 'gemini-1.5-pro' },
        { provider: 'deepseek', model: 'deepseek-chat' },
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      ],
    },
  },
};

// ============================================
// SMART ROUTER CLASS
// ============================================
export class SmartCostQualityRouter {
  private availableProviders: Set<AIProvider>;
  private providerFailures: Map<AIProvider, number> = new Map();
  private lastUsed: Map<AIProvider, number> = new Map();

  constructor(apiKeys: Record<string, string>) {
    this.availableProviders = new Set();
    
    // Check which providers have valid API keys
    if (apiKeys.groq) this.availableProviders.add('groq');
    if (apiKeys.gemini) this.availableProviders.add('gemini');
    if (apiKeys.openai) this.availableProviders.add('openai');
    if (apiKeys.claude || apiKeys.anthropic) this.availableProviders.add('claude');
    if (apiKeys.deepseek) this.availableProviders.add('deepseek');
  }

  getRoute(prompt: string, taskType: TaskType = 'general'): {
    chain: { provider: AIProvider; model: string }[];
    complexity: ComplexityLevel;
    reason: string;
    estimatedCost: string;
  } {
    const complexity = analyzeComplexity(prompt, taskType);
    const matrix = ROUTING_MATRIX[complexity][taskType];
    
    // Build chain from available providers
    const chain: { provider: AIProvider; model: string }[] = [];
    const reasons: string[] = [];
    
    // Add primary choices (filtered by availability)
    for (const option of matrix.primary) {
      if (this.availableProviders.has(option.provider)) {
        chain.push(option);
      }
    }
    
    // Add fallback choices
    for (const option of matrix.fallback) {
      if (this.availableProviders.has(option.provider) && 
          !chain.some(c => c.provider === option.provider)) {
        chain.push(option);
      }
    }
    
    // Calculate estimated cost
    const estimatedCost = this.estimateCost(chain[0], prompt.length);
    
    // Build reason
    const reason = this.buildReason(complexity, taskType, chain);
    
    return { chain, complexity, reason, estimatedCost };
  }

  private estimateCost(option: { provider: AIProvider; model: string }, promptLength: number): string {
    const pricing = PRICING_MATRIX[option.provider]?.[option.model as keyof typeof PRICING_MATRIX[typeof option.provider]];
    if (!pricing) return 'Unknown';
    
    if (pricing.free) return 'FREE ✨';
    
    // Estimate tokens (rough: 4 chars = 1 token)
    const inputTokens = Math.ceil(promptLength / 4);
    const outputTokens = inputTokens * 2; // Assume 2x output
    
    const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
    
    if (cost < 0.001) return '< $0.001';
    if (cost < 0.01) return `~$${cost.toFixed(4)}`;
    return `~$${cost.toFixed(3)}`;
  }

  private buildReason(complexity: ComplexityLevel, taskType: TaskType, chain: { provider: AIProvider; model: string }[]): string {
    const complexityEmoji = {
      simple: '🟢',
      medium: '🟡', 
      complex: '🟠',
      expert: '🔴'
    };
    
    const taskEmoji = {
      chat: '💬',
      code: '💻',
      creative: '🎨',
      analysis: '📊',
      general: '📝'
    };
    
    const primary = chain[0];
    const pricing = PRICING_MATRIX[primary.provider]?.[primary.model as keyof typeof PRICING_MATRIX[typeof primary.provider]];
    
    let reason = `${complexityEmoji[complexity]} ${complexity.toUpperCase()} ${taskEmoji[taskType]} ${taskType}\n`;
    reason += `Primary: ${primary.provider}/${primary.model}`;
    
    if (pricing?.free) {
      reason += ' (FREE)';
    } else if (pricing) {
      reason += ` (Quality: ${pricing.quality}/10)`;
    }
    
    if (chain.length > 1) {
      reason += `\nFallback: ${chain.slice(1).map(c => c.provider).join(' → ')}`;
    }
    
    return reason;
  }

  markFailure(provider: AIProvider): void {
    const failures = this.providerFailures.get(provider) || 0;
    this.providerFailures.set(provider, failures + 1);
  }

  markSuccess(provider: AIProvider): void {
    this.providerFailures.set(provider, 0);
    this.lastUsed.set(provider, Date.now());
  }

  getStats(): {
    available: AIProvider[];
    failures: Record<string, number>;
  } {
    return {
      available: Array.from(this.availableProviders),
      failures: Object.fromEntries(this.providerFailures),
    };
  }
}

// ============================================
// COST SUMMARY FOR UI DISPLAY
// ============================================
export function getCostQualityMatrix(): {
  providers: {
    name: AIProvider;
    models: {
      name: string;
      quality: number;
      speed: number;
      inputCost: string;
      outputCost: string;
      free: boolean;
      bestFor: string[];
    }[];
  }[];
} {
  return {
    providers: [
      {
        name: 'groq',
        models: [
          { name: 'llama-3.3-70b-versatile', quality: 7.5, speed: 10, inputCost: 'FREE', outputCost: 'FREE', free: true, bestFor: ['Simple tasks', 'Fast responses', 'Chat'] },
        ]
      },
      {
        name: 'gemini',
        models: [
          { name: 'gemini-1.5-flash', quality: 8, speed: 9, inputCost: '$0.075', outputCost: '$0.30', free: true, bestFor: ['General tasks', 'Analysis', 'Creative'] },
          { name: 'gemini-1.5-pro', quality: 9, speed: 7, inputCost: '$1.25', outputCost: '$5.00', free: false, bestFor: ['Complex analysis', 'Long context'] },
        ]
      },
      {
        name: 'deepseek',
        models: [
          { name: 'deepseek-coder', quality: 9, speed: 8, inputCost: '$0.14', outputCost: '$0.28', free: false, bestFor: ['CODE (Best value!)', 'Technical tasks'] },
          { name: 'deepseek-chat', quality: 8.5, speed: 8, inputCost: '$0.14', outputCost: '$0.28', free: false, bestFor: ['General chat', 'Good quality/price'] },
        ]
      },
      {
        name: 'openai',
        models: [
          { name: 'gpt-4o-mini', quality: 8, speed: 8, inputCost: '$0.15', outputCost: '$0.60', free: false, bestFor: ['Balanced tasks', 'Reliable'] },
          { name: 'gpt-4o', quality: 9.5, speed: 7, inputCost: '$2.50', outputCost: '$10.00', free: false, bestFor: ['Expert analysis', 'Complex reasoning'] },
        ]
      },
      {
        name: 'claude',
        models: [
          { name: 'claude-3-5-haiku', quality: 8, speed: 9, inputCost: '$0.25', outputCost: '$1.25', free: false, bestFor: ['Fast quality', 'Creative'] },
          { name: 'claude-3-5-sonnet', quality: 9.5, speed: 7, inputCost: '$3.00', outputCost: '$15.00', free: false, bestFor: ['BEST Code', 'BEST Creative', 'Expert tasks'] },
        ]
      },
    ]
  };
}
