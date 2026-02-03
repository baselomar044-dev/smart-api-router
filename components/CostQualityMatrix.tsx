'use client'

import { useState } from 'react'

// ============================================
// Cost/Quality Matrix Display Component
// Shows users how their API keys are used
// ============================================

interface MatrixProps {
  apiKeys: Record<string, string>;
  language?: 'en' | 'ar';
}

const MATRIX_DATA = {
  providers: [
    {
      id: 'groq',
      name: 'Groq',
      color: 'from-orange-500 to-red-500',
      models: [
        { 
          name: 'llama-3.3-70b-versatile', 
          quality: 7.5, 
          speed: 10, 
          inputCost: 'FREE', 
          outputCost: 'FREE', 
          free: true, 
          bestFor: ['Simple tasks', 'Fast responses', 'Chat'],
          bestForAr: ['المهام البسيطة', 'الردود السريعة', 'المحادثة']
        },
      ]
    },
    {
      id: 'gemini',
      name: 'Gemini',
      color: 'from-blue-500 to-purple-500',
      models: [
        { 
          name: 'gemini-1.5-flash', 
          quality: 8, 
          speed: 9, 
          inputCost: 'FREE*', 
          outputCost: 'FREE*', 
          free: true, 
          bestFor: ['General tasks', 'Analysis', 'Creative'],
          bestForAr: ['المهام العامة', 'التحليل', 'الإبداعية']
        },
        { 
          name: 'gemini-1.5-pro', 
          quality: 9, 
          speed: 7, 
          inputCost: '$1.25', 
          outputCost: '$5.00', 
          free: false, 
          bestFor: ['Complex analysis', 'Long context'],
          bestForAr: ['التحليل المعقد', 'السياق الطويل']
        },
      ]
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      color: 'from-green-500 to-teal-500',
      models: [
        { 
          name: 'deepseek-coder', 
          quality: 9, 
          speed: 8, 
          inputCost: '$0.14', 
          outputCost: '$0.28', 
          free: false, 
          bestFor: ['CODE ⭐ BEST VALUE', 'Technical tasks'],
          bestForAr: ['الكود ⭐ أفضل قيمة', 'المهام التقنية']
        },
        { 
          name: 'deepseek-chat', 
          quality: 8.5, 
          speed: 8, 
          inputCost: '$0.14', 
          outputCost: '$0.28', 
          free: false, 
          bestFor: ['General chat', 'Great value'],
          bestForAr: ['المحادثة العامة', 'قيمة رائعة']
        },
      ]
    },
    {
      id: 'openai',
      name: 'OpenAI',
      color: 'from-emerald-500 to-green-600',
      models: [
        { 
          name: 'gpt-4o-mini', 
          quality: 8, 
          speed: 8, 
          inputCost: '$0.15', 
          outputCost: '$0.60', 
          free: false, 
          bestFor: ['Balanced tasks', 'Reliable'],
          bestForAr: ['المهام المتوازنة', 'موثوق']
        },
        { 
          name: 'gpt-4o', 
          quality: 9.5, 
          speed: 7, 
          inputCost: '$2.50', 
          outputCost: '$10.00', 
          free: false, 
          bestFor: ['Expert analysis', 'Complex reasoning'],
          bestForAr: ['تحليل خبير', 'التفكير المعقد']
        },
      ]
    },
    {
      id: 'claude',
      name: 'Claude',
      color: 'from-amber-500 to-orange-500',
      models: [
        { 
          name: 'claude-3-5-haiku', 
          quality: 8, 
          speed: 9, 
          inputCost: '$0.25', 
          outputCost: '$1.25', 
          free: false, 
          bestFor: ['Fast quality', 'Creative'],
          bestForAr: ['جودة سريعة', 'إبداعي']
        },
        { 
          name: 'claude-3-5-sonnet', 
          quality: 9.5, 
          speed: 7, 
          inputCost: '$3.00', 
          outputCost: '$15.00', 
          free: false, 
          bestFor: ['⭐ BEST Code', '⭐ BEST Creative'],
          bestForAr: ['⭐ أفضل كود', '⭐ أفضل إبداعي']
        },
      ]
    },
  ],
  
  routingStrategy: {
    simple: {
      en: 'FREE providers first (Groq → Gemini Flash)',
      ar: 'المزودون المجانيون أولاً (Groq → Gemini Flash)',
      providers: ['groq', 'gemini'],
    },
    medium: {
      en: 'FREE → Cheap (DeepSeek, GPT-4o-mini)',
      ar: 'مجاني → رخيص (DeepSeek, GPT-4o-mini)',
      providers: ['groq', 'gemini', 'deepseek', 'openai'],
    },
    complex: {
      en: 'Quality/Price balance (DeepSeek Coder, Gemini Pro)',
      ar: 'توازن الجودة/السعر (DeepSeek Coder, Gemini Pro)',
      providers: ['deepseek', 'gemini', 'openai', 'claude'],
    },
    expert: {
      en: 'Best quality (Claude Sonnet, GPT-4o)',
      ar: 'أفضل جودة (Claude Sonnet, GPT-4o)',
      providers: ['claude', 'openai', 'gemini', 'deepseek'],
    },
  },
};

export default function CostQualityMatrix({ apiKeys, language = 'en' }: MatrixProps) {
  const [selectedComplexity, setSelectedComplexity] = useState<'simple' | 'medium' | 'complex' | 'expert'>('simple');
  
  const isRTL = language === 'ar';
  const activeProviders = new Set(Object.keys(apiKeys).filter(k => apiKeys[k]));
  
  const t = {
    title: isRTL ? 'مصفوفة التكلفة والجودة' : 'Cost/Quality Matrix',
    subtitle: isRTL ? 'كيف يتم استخدام مفاتيح API الخاصة بك' : 'How your API keys are used',
    quality: isRTL ? 'الجودة' : 'Quality',
    speed: isRTL ? 'السرعة' : 'Speed',
    input: isRTL ? 'الإدخال' : 'Input',
    output: isRTL ? 'الإخراج' : 'Output',
    bestFor: isRTL ? 'الأفضل لـ' : 'Best for',
    perMillion: isRTL ? 'لكل مليون رمز' : 'per 1M tokens',
    active: isRTL ? 'نشط' : 'Active',
    inactive: isRTL ? 'غير نشط' : 'Inactive',
    routing: isRTL ? 'استراتيجية التوجيه' : 'Routing Strategy',
    complexity: {
      simple: isRTL ? 'بسيط' : 'Simple',
      medium: isRTL ? 'متوسط' : 'Medium',
      complex: isRTL ? 'معقد' : 'Complex',
      expert: isRTL ? 'خبير' : 'Expert',
    },
    yourKeys: isRTL ? 'مفاتيحك النشطة' : 'Your Active Keys',
    noKeys: isRTL ? 'لم يتم إضافة مفاتيح بعد' : 'No keys added yet',
    recommendation: isRTL ? 'التوصية' : 'Recommendation',
    freeNote: isRTL ? '* مجاني ضمن الحد اليومي' : '* Free within daily limit',
  };

  const complexityColors = {
    simple: 'bg-green-500',
    medium: 'bg-yellow-500',
    complex: 'bg-orange-500',
    expert: 'bg-red-500',
  };

  const strategy = MATRIX_DATA.routingStrategy[selectedComplexity];

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">{t.title}</h3>
        <p className="text-white/60 text-sm">{t.subtitle}</p>
      </div>

      {/* Active Keys Summary */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h4 className="text-sm font-medium text-white/80 mb-3">{t.yourKeys}</h4>
        <div className="flex flex-wrap gap-2">
          {MATRIX_DATA.providers.map(provider => {
            const isActive = activeProviders.has(provider.id) || 
                           (provider.id === 'claude' && activeProviders.has('anthropic'));
            return (
              <div 
                key={provider.id}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  isActive 
                    ? `bg-gradient-to-r ${provider.color} text-white` 
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {isActive && <span className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                {provider.name}
                <span className="text-xs opacity-70">
                  {isActive ? `✓ ${t.active}` : t.inactive}
                </span>
              </div>
            );
          })}
        </div>
        {activeProviders.size === 0 && (
          <p className="text-white/40 text-sm mt-2">{t.noKeys}</p>
        )}
      </div>

      {/* Complexity Selector */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h4 className="text-sm font-medium text-white/80 mb-3">{t.routing}</h4>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {(['simple', 'medium', 'complex', 'expert'] as const).map(level => (
            <button
              key={level}
              onClick={() => setSelectedComplexity(level)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedComplexity === level
                  ? `${complexityColors[level]} text-white shadow-lg`
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {t.complexity[level]}
            </button>
          ))}
        </div>
        
        {/* Current Strategy */}
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/80 text-sm mb-2">
            {isRTL ? strategy.ar : strategy.en}
          </p>
          <div className="flex items-center gap-1 flex-wrap">
            {strategy.providers.map((pid, idx) => {
              const provider = MATRIX_DATA.providers.find(p => p.id === pid);
              const isActive = activeProviders.has(pid) || 
                             (pid === 'claude' && activeProviders.has('anthropic'));
              return (
                <div key={pid} className="flex items-center">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    isActive 
                      ? `bg-gradient-to-r ${provider?.color} text-white` 
                      : 'bg-white/10 text-white/30 line-through'
                  }`}>
                    {provider?.name}
                  </span>
                  {idx < strategy.providers.length - 1 && (
                    <span className="mx-1 text-white/30">→</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Provider Details */}
      <div className="space-y-3">
        {MATRIX_DATA.providers.map(provider => {
          const isActive = activeProviders.has(provider.id) || 
                         (provider.id === 'claude' && activeProviders.has('anthropic'));
          
          return (
            <div 
              key={provider.id}
              className={`rounded-xl border overflow-hidden transition-all ${
                isActive 
                  ? 'bg-white/10 border-white/20' 
                  : 'bg-white/5 border-white/5 opacity-50'
              }`}
            >
              {/* Provider Header */}
              <div className={`bg-gradient-to-r ${provider.color} px-4 py-2 flex items-center justify-between`}>
                <span className="font-bold text-white">{provider.name}</span>
                {isActive ? (
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs text-white">
                    ✓ {t.active}
                  </span>
                ) : (
                  <span className="bg-black/20 px-2 py-0.5 rounded text-xs text-white/60">
                    {t.inactive}
                  </span>
                )}
              </div>
              
              {/* Models */}
              <div className="p-3 space-y-2">
                {provider.models.map(model => (
                  <div 
                    key={model.name}
                    className="bg-white/5 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-sm">{model.name}</span>
                      {model.free && (
                        <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-bold">
                          FREE ✨
                        </span>
                      )}
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white/50">{t.quality}:</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-500 to-green-500 rounded-full"
                            style={{ width: `${model.quality * 10}%` }}
                          />
                        </div>
                        <span className="text-white/80">{model.quality}/10</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/50">{t.speed}:</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                            style={{ width: `${model.speed * 10}%` }}
                          />
                        </div>
                        <span className="text-white/80">{model.speed}/10</span>
                      </div>
                    </div>

                    {/* Cost */}
                    {!model.free && (
                      <div className="flex gap-4 text-xs text-white/60 mb-2">
                        <span>{t.input}: <span className="text-white">{model.inputCost}</span></span>
                        <span>{t.output}: <span className="text-white">{model.outputCost}</span></span>
                        <span className="text-white/40">{t.perMillion}</span>
                      </div>
                    )}
                    
                    {/* Best For */}
                    <div className="flex flex-wrap gap-1">
                      {(isRTL ? model.bestForAr : model.bestFor).map((tag, i) => (
                        <span 
                          key={i}
                          className="bg-white/10 text-white/70 px-2 py-0.5 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendation */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
        <h4 className="text-sm font-bold text-white mb-2">💡 {t.recommendation}</h4>
        <p className="text-white/80 text-sm">
          {isRTL 
            ? 'للحصول على أفضل توازن: استخدم Groq (مجاني) + DeepSeek (رخيص للكود) + Gemini (تحليل). هذا يغطي 95% من المهام بتكلفة قريبة من الصفر!'
            : 'For best balance: Use Groq (free) + DeepSeek (cheap for code) + Gemini (analysis). This covers 95% of tasks at near-zero cost!'
          }
        </p>
      </div>

      <p className="text-white/40 text-xs text-center">{t.freeNote}</p>
    </div>
  );
}
