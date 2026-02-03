'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { translations } from '@/lib/i18n'
import { safeStorage } from '@/lib/safeStorage';

export default function Dashboard() {
  const { 
    language, 
    projects, 
    conversations,
    agents, 
    tools, 
    workflows, 
    notes,
    favorites,
    lastAutoSave,
    setCurrentService 
  } = useAppStore()
  const t = translations[language]

  // Daily Prompt Ideas - refreshes daily
  const allPromptIdeas = {
    en: [
      { icon: '🚀', prompt: 'Build a landing page for a SaaS product with pricing section', category: 'Web Development' },
      { icon: '🤖', prompt: 'Create an AI chatbot for customer support with FAQ handling', category: 'AI & Automation' },
      { icon: '📊', prompt: 'Design a real-time analytics dashboard with charts and filters', category: 'Data Visualization' },
      { icon: '🛒', prompt: 'Build an e-commerce checkout flow with payment integration', category: 'E-commerce' },
      { icon: '📱', prompt: 'Create a mobile-first social media app UI with stories feature', category: 'Mobile App' },
      { icon: '🎮', prompt: 'Build a simple 2D game with score tracking and levels', category: 'Game Development' },
      { icon: '📝', prompt: 'Design a note-taking app with markdown support and tagging', category: 'Productivity' },
      { icon: '🔐', prompt: 'Create a secure authentication system with 2FA', category: 'Security' },
      { icon: '📧', prompt: 'Build an email template builder with drag and drop', category: 'Marketing' },
      { icon: '🎨', prompt: 'Design a portfolio website with animated transitions', category: 'Design' },
      { icon: '💬', prompt: 'Create a real-time chat application with file sharing', category: 'Communication' },
      { icon: '📅', prompt: 'Build a project management tool with Kanban board', category: 'Project Management' },
      { icon: '🔍', prompt: 'Design a search engine interface with filters and suggestions', category: 'Search & Discovery' },
      { icon: '📈', prompt: 'Create a stock market tracker with price alerts', category: 'Finance' },
      { icon: '🎵', prompt: 'Build a music player with playlist management', category: 'Entertainment' },
      { icon: '🏋️', prompt: 'Design a fitness tracking app with workout plans', category: 'Health & Fitness' },
      { icon: '🍽️', prompt: 'Create a recipe finder with nutritional information', category: 'Food & Cooking' },
      { icon: '🗺️', prompt: 'Build an interactive map with location markers and routes', category: 'Maps & Navigation' },
      { icon: '📚', prompt: 'Design an online learning platform with progress tracking', category: 'Education' },
      { icon: '🎬', prompt: 'Create a video streaming interface with recommendations', category: 'Media' },
      { icon: '💼', prompt: 'Build a job board with resume builder and applications', category: 'Career' },
      { icon: '🏠', prompt: 'Design a smart home control dashboard with IoT integration', category: 'IoT' },
      { icon: '✈️', prompt: 'Create a travel booking system with itinerary planner', category: 'Travel' },
      { icon: '🎁', prompt: 'Build a gift recommendation engine with wishlists', category: 'E-commerce' },
      { icon: '📰', prompt: 'Design a news aggregator with personalized feed', category: 'News & Media' },
      { icon: '🔧', prompt: 'Create a code snippet manager with syntax highlighting', category: 'Developer Tools' },
      { icon: '🌐', prompt: 'Build a multi-language website with auto-translation', category: 'Internationalization' },
      { icon: '📦', prompt: 'Design an inventory management system with barcode scanning', category: 'Business' },
      { icon: '🎤', prompt: 'Create a podcast platform with transcription features', category: 'Audio' },
      { icon: '🖼️', prompt: 'Build an AI image generator with style presets', category: 'AI & Creative' },
    ],
    ar: [
      { icon: '🚀', prompt: 'إنشاء صفحة هبوط لمنتج SaaS مع قسم التسعير', category: 'تطوير الويب' },
      { icon: '🤖', prompt: 'إنشاء روبوت دردشة ذكي لدعم العملاء مع الأسئلة الشائعة', category: 'الذكاء الاصطناعي' },
      { icon: '📊', prompt: 'تصميم لوحة تحليلات في الوقت الفعلي مع الرسوم البيانية', category: 'تصور البيانات' },
      { icon: '🛒', prompt: 'بناء تدفق الدفع للتجارة الإلكترونية مع تكامل الدفع', category: 'التجارة الإلكترونية' },
      { icon: '📱', prompt: 'إنشاء واجهة تطبيق وسائل التواصل الاجتماعي للموبايل', category: 'تطبيقات الموبايل' },
      { icon: '🎮', prompt: 'بناء لعبة 2D بسيطة مع تتبع النقاط والمستويات', category: 'تطوير الألعاب' },
      { icon: '📝', prompt: 'تصميم تطبيق ملاحظات مع دعم Markdown والوسوم', category: 'الإنتاجية' },
      { icon: '🔐', prompt: 'إنشاء نظام مصادقة آمن مع التحقق الثنائي', category: 'الأمان' },
      { icon: '📧', prompt: 'بناء منشئ قوالب البريد الإلكتروني بالسحب والإفلات', category: 'التسويق' },
      { icon: '🎨', prompt: 'تصميم موقع محفظة أعمال مع انتقالات متحركة', category: 'التصميم' },
      { icon: '💬', prompt: 'إنشاء تطبيق دردشة في الوقت الفعلي مع مشاركة الملفات', category: 'التواصل' },
      { icon: '📅', prompt: 'بناء أداة إدارة المشاريع مع لوحة كانبان', category: 'إدارة المشاريع' },
      { icon: '🔍', prompt: 'تصميم واجهة محرك بحث مع فلاتر واقتراحات', category: 'البحث والاكتشاف' },
      { icon: '📈', prompt: 'إنشاء متتبع سوق الأسهم مع تنبيهات الأسعار', category: 'المالية' },
      { icon: '🎵', prompt: 'بناء مشغل موسيقى مع إدارة قوائم التشغيل', category: 'الترفيه' },
      { icon: '🏋️', prompt: 'تصميم تطبيق تتبع اللياقة البدنية مع خطط التمارين', category: 'الصحة واللياقة' },
      { icon: '🍽️', prompt: 'إنشاء باحث وصفات مع معلومات غذائية', category: 'الطعام والطبخ' },
      { icon: '🗺️', prompt: 'بناء خريطة تفاعلية مع علامات المواقع والمسارات', category: 'الخرائط والملاحة' },
      { icon: '📚', prompt: 'تصميم منصة تعلم إلكتروني مع تتبع التقدم', category: 'التعليم' },
      { icon: '🎬', prompt: 'إنشاء واجهة بث الفيديو مع التوصيات', category: 'الوسائط' },
      { icon: '💼', prompt: 'بناء لوحة وظائف مع منشئ السيرة الذاتية', category: 'المهنة' },
      { icon: '🏠', prompt: 'تصميم لوحة تحكم المنزل الذكي مع تكامل IoT', category: 'إنترنت الأشياء' },
      { icon: '✈️', prompt: 'إنشاء نظام حجز السفر مع مخطط الرحلات', category: 'السفر' },
      { icon: '🎁', prompt: 'بناء محرك توصيات الهدايا مع قوائم الأمنيات', category: 'التجارة الإلكترونية' },
      { icon: '📰', prompt: 'تصميم مجمع أخبار مع موجز مخصص', category: 'الأخبار والإعلام' },
      { icon: '🔧', prompt: 'إنشاء مدير قصاصات الكود مع تمييز الصيغة', category: 'أدوات المطورين' },
      { icon: '🌐', prompt: 'بناء موقع متعدد اللغات مع الترجمة التلقائية', category: 'التدويل' },
      { icon: '📦', prompt: 'تصميم نظام إدارة المخزون مع مسح الباركود', category: 'الأعمال' },
      { icon: '🎤', prompt: 'إنشاء منصة بودكاست مع ميزات النسخ', category: 'الصوتيات' },
      { icon: '🖼️', prompt: 'بناء مولد صور AI مع إعدادات الأنماط', category: 'الذكاء الاصطناعي الإبداعي' },
    ]
  }

  // Get 10 daily prompts based on the day of year
  const [dailyPrompts, setDailyPrompts] = useState<typeof allPromptIdeas.en>([])
  
  useEffect(() => {
    const today = new Date()
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    const prompts = allPromptIdeas[language]
    const startIndex = (dayOfYear * 10) % prompts.length
    const selected: typeof prompts = []
    for (let i = 0; i < 10; i++) {
      selected.push(prompts[(startIndex + i) % prompts.length])
    }
    setDailyPrompts(selected)
  }, [language])

  const mainStats = [
    { icon: '🏗️', label: t.totalProjects, value: projects.length, color: 'from-blue-500 to-cyan-500', service: 'builder' as const },
    { icon: '🤖', label: t.totalAgents, value: agents.length, color: 'from-purple-500 to-pink-500', service: 'agents' as const },
    { icon: '🔧', label: t.totalTools, value: tools.length, color: 'from-orange-500 to-red-500', service: 'tools' as const },
    { icon: '⚡', label: t.totalWorkflows, value: workflows.length, color: 'from-green-500 to-emerald-500', service: 'workflows' as const },
  ]

  const secondaryStats = [
    { icon: '💬', label: language === 'ar' ? 'المحادثات' : 'Conversations', value: conversations.length },
    { icon: '📝', label: language === 'ar' ? 'الملاحظات' : 'Notes', value: notes.length },
    { icon: '⭐', label: language === 'ar' ? 'المفضلة' : 'Favorites', value: favorites.length },
  ]

  const quickActions = [
    { icon: '➕', label: t.newProject, service: 'builder' as const },
    { icon: '🤖', label: t.newAgent, service: 'agents' as const },
    { icon: '🔧', label: t.newTool, service: 'tools' as const },
    { icon: '⚡', label: t.newWorkflow, service: 'workflows' as const },
    { icon: '📚', label: language === 'ar' ? 'المكتبة' : 'Library', service: 'library' as const },
  ]

  // Get recent items
  const recentItems = [
    ...projects.map(p => ({ type: '🏗️', name: p.name, date: p.updatedAt })),
    ...conversations.map(c => ({ type: '💬', name: c.title, date: c.updatedAt })),
    ...agents.map(a => ({ type: '🤖', name: a.name, date: a.updatedAt })),
    ...tools.map(t => ({ type: '🔧', name: t.name, date: t.updatedAt })),
    ...workflows.map(w => ({ type: '⚡', name: w.name, date: w.updatedAt })),
    ...notes.map(n => ({ type: '📝', name: n.title, date: n.updatedAt })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  // Format auto-save time
  const formatAutoSave = () => {
    if (!lastAutoSave) return language === 'ar' ? 'لم يتم الحفظ بعد' : 'Not saved yet'
    const diff = Date.now() - lastAutoSave
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return language === 'ar' ? 'منذ ثوان' : 'Just now'
    if (mins < 60) return language === 'ar' ? `منذ ${mins} دقيقة` : `${mins} min ago`
    const hours = Math.floor(mins / 60)
    return language === 'ar' ? `منذ ${hours} ساعة` : `${hours} hours ago`
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome */}
      <div className="card bg-gradient-to-br from-sky-500/10 to-blue-600/10 border-sky-500/20">
        <h1 className="text-2xl font-bold mb-2">{t.welcomeBack} 👋</h1>
        <p className="text-[var(--muted)]">{t.tagline}</p>
      </div>

      {/* 📊 Main Stats Grid */}
      <div className="grid-dashboard">
        {mainStats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => setCurrentService(stat.service)}
            className="card group cursor-pointer hover:scale-[1.02] transition-transform"
          >
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} mb-4`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-[var(--muted)]">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* 📊 Secondary Stats */}
      <div className="flex flex-wrap gap-4">
        {secondaryStats.map((stat) => (
          <div
            key={stat.label}
            className="card flex-1 min-w-[140px] flex items-center gap-3"
          >
            <span className="text-2xl">{stat.icon}</span>
            <div>
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-sm text-[var(--muted)]">{stat.label}</div>
            </div>
          </div>
        ))}
        {/* Auto-save indicator */}
        <div className="card flex-1 min-w-[140px] flex items-center gap-3">
          <span className="text-2xl">💾</span>
          <div>
            <div className="text-sm font-medium">{language === 'ar' ? 'آخر حفظ' : 'Last Save'}</div>
            <div className="text-xs text-[var(--muted)]">{formatAutoSave()}</div>
          </div>
        </div>
      </div>

      {/* ⌨️ Keyboard Shortcuts */}
      <div className="card bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span>⌨️</span>
          <span>{language === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}</span>
        </h3>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="px-2 py-1 bg-[var(--bg)] rounded border border-[var(--border)]">
            <kbd>Ctrl</kbd>+<kbd>S</kbd> {language === 'ar' ? 'حفظ' : 'Save'}
          </span>
          <span className="px-2 py-1 bg-[var(--bg)] rounded border border-[var(--border)]">
            <kbd>Ctrl</kbd>+<kbd>E</kbd> {language === 'ar' ? 'تصدير' : 'Export'}
          </span>
          <span className="px-2 py-1 bg-[var(--bg)] rounded border border-[var(--border)]">
            <kbd>Ctrl</kbd>+<kbd>Z</kbd> {language === 'ar' ? 'تراجع' : 'Undo'}
          </span>
          <span className="px-2 py-1 bg-[var(--bg)] rounded border border-[var(--border)]">
            <kbd>Ctrl</kbd>+<kbd>Y</kbd> {language === 'ar' ? 'إعادة' : 'Redo'}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t.quickActions}</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => setCurrentService(action.service)}
              className="btn btn-secondary"
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 💡 Daily Prompt Ideas */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>💡</span>
          <span>{language === 'ar' ? 'أفكار يومية للبناء' : "Today's Build Ideas"}</span>
          <span className="text-xs px-2 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 rounded-full">
            {language === 'ar' ? 'متجددة يومياً' : 'Refreshes Daily'}
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dailyPrompts.map((idea, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentService('builder')
                // Store the prompt for the builder to pick up
                safeStorage.setItem('pendingPrompt', idea.prompt)
              }}
              className="card group text-left hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl group-hover:scale-110 transition-transform">{idea.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-relaxed line-clamp-2">{idea.prompt}</p>
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-[var(--bg)] rounded text-[var(--muted)]">
                    {idea.category}
                  </span>
                </div>
                <span className="text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
                  →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t.recentActivity}</h2>
        <div className="card">
          {recentItems.length === 0 ? (
            <p className="text-[var(--muted)] text-center py-8">{t.noActivity}</p>
          ) : (
            <div className="space-y-3">
              {recentItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.type}</span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm text-[var(--muted)]">
                    {new Date(item.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Provider Status */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t.fallbackSystem}</h2>
        <div className="card">
          <p className="text-[var(--muted)] mb-4">{t.fallbackDescription}</p>
          <div className="flex flex-wrap gap-2">
            <span className="provider-badge provider-groq">Groq</span>
            <span className="text-[var(--muted)]">→</span>
            <span className="provider-badge provider-gemini">Gemini</span>
            <span className="text-[var(--muted)]">→</span>
            <span className="provider-badge provider-claude">Claude</span>
            <span className="text-[var(--muted)]">→</span>
            <span className="provider-badge provider-openai">OpenAI</span>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="provider-badge provider-tavily">Tavily (Search)</span>
            <span className="provider-badge provider-openai">DALL-E (Images)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
