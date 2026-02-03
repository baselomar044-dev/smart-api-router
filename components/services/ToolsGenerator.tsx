'use client'

import { useState } from 'react'
import { Wrench, Plus, Play, Settings, Trash2, Copy, Zap, Code, Globe, Database, FileText, Search, Mail, MessageSquare, Calendar, Calculator, Image, Music, Video, Lock, Key, Clock, CheckCircle, Info, ChevronDown, ChevronUp, Sparkles, Terminal, Webhook, Upload, Download, RefreshCw, Filter, ArrowRight } from 'lucide-react'

interface Tool {
  id: string
  name: string
  description: string
  category: string
  inputs: { name: string; type: string; required: boolean }[]
  output: string
  usageCount: number
  lastUsed?: string
}

interface ToolsGeneratorProps {
  language: 'en' | 'ar'
}

export default function ToolsGenerator({ language }: ToolsGeneratorProps) {
  const [tools, setTools] = useState<Tool[]>([
    {
      id: '1',
      name: 'Web Scraper',
      description: 'Extracts data from any webpage',
      category: 'data',
      inputs: [
        { name: 'url', type: 'string', required: true },
        { name: 'selector', type: 'string', required: false }
      ],
      output: 'JSON data',
      usageCount: 156,
      lastUsed: '2 hours ago'
    },
    {
      id: '2',
      name: 'Text Summarizer',
      description: 'Summarizes long text into key points',
      category: 'ai',
      inputs: [
        { name: 'text', type: 'string', required: true },
        { name: 'maxLength', type: 'number', required: false }
      ],
      output: 'Summary text',
      usageCount: 89,
      lastUsed: '1 day ago'
    }
  ])
  const [showInfo, setShowInfo] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')

  const t = {
    en: {
      title: 'AI Tools',
      subtitle: 'Create and manage custom tools for your workflows',
      createTool: 'Create Tool',
      search: 'Search tools...',
      all: 'All Tools',
      data: 'Data',
      ai: 'AI/ML',
      communication: 'Communication',
      automation: 'Automation',
      utility: 'Utility',
      inputs: 'Inputs',
      output: 'Output',
      usage: 'Usage',
      lastUsed: 'Last Used',
      run: 'Run',
      edit: 'Edit',
      delete: 'Delete',
      duplicate: 'Duplicate',
      whatAreTools: 'What are AI Tools?',
      toolsExplanation: 'AI Tools are reusable functions that perform specific tasks. They can be used standalone or combined in workflows. Tools help you:',
      toolsFeatures: [
        'Encapsulate complex logic into simple, reusable components',
        'Connect to external APIs and services securely',
        'Process and transform data automatically',
        'Leverage AI capabilities for intelligent processing',
        'Build building blocks for more complex automations'
      ],
      anatomy: {
        title: 'Anatomy of a Tool',
        parts: [
          { name: 'Name & Description', desc: 'Clear identifier and what the tool does' },
          { name: 'Inputs (Parameters)', desc: 'Data the tool needs to work with' },
          { name: 'Logic/Processing', desc: 'The code or AI that processes the inputs' },
          { name: 'Output', desc: 'The result returned after processing' }
        ]
      },
      categories: {
        title: 'Tool Categories',
        list: {
          data: {
            name: 'Data Tools',
            desc: 'Fetch, parse, transform, and store data',
            examples: ['Web Scraper', 'JSON Parser', 'CSV Converter', 'Database Query']
          },
          ai: {
            name: 'AI/ML Tools',
            desc: 'Leverage artificial intelligence capabilities',
            examples: ['Text Summarizer', 'Image Analyzer', 'Sentiment Analysis', 'Translation']
          },
          communication: {
            name: 'Communication Tools',
            desc: 'Send messages and notifications',
            examples: ['Email Sender', 'Slack Message', 'SMS Alert', 'Push Notification']
          },
          automation: {
            name: 'Automation Tools',
            desc: 'Control flow and trigger actions',
            examples: ['Scheduler', 'Webhook Handler', 'File Watcher', 'Event Trigger']
          },
          utility: {
            name: 'Utility Tools',
            desc: 'Helper functions for common tasks',
            examples: ['Date Formatter', 'Calculator', 'Text Formatter', 'ID Generator']
          }
        }
      },
      howToCreate: {
        title: 'How to Create a Tool',
        steps: [
          'Define what the tool should do clearly',
          'Identify required and optional inputs',
          'Write the processing logic (code or AI prompt)',
          'Specify the output format',
          'Test with sample data',
          'Document usage and examples'
        ]
      },
      templates: 'Tool Templates',
      useTemplate: 'Use',
      noTools: 'No custom tools created yet. Start with a template or create from scratch!'
    },
    ar: {
      title: 'أدوات الذكاء الاصطناعي',
      subtitle: 'إنشاء وإدارة أدوات مخصصة لسير عملك',
      createTool: 'إنشاء أداة',
      search: 'البحث عن أدوات...',
      all: 'جميع الأدوات',
      data: 'البيانات',
      ai: 'الذكاء الاصطناعي',
      communication: 'الاتصالات',
      automation: 'الأتمتة',
      utility: 'الأدوات المساعدة',
      inputs: 'المدخلات',
      output: 'المخرجات',
      usage: 'الاستخدام',
      lastUsed: 'آخر استخدام',
      run: 'تشغيل',
      edit: 'تعديل',
      delete: 'حذف',
      duplicate: 'نسخ',
      whatAreTools: 'ما هي أدوات الذكاء الاصطناعي؟',
      toolsExplanation: 'أدوات الذكاء الاصطناعي هي وظائف قابلة لإعادة الاستخدام تؤدي مهام محددة. يمكن استخدامها بشكل مستقل أو دمجها في سير العمل. تساعدك الأدوات على:',
      toolsFeatures: [
        'تغليف المنطق المعقد في مكونات بسيطة قابلة لإعادة الاستخدام',
        'الاتصال بواجهات برمجة التطبيقات والخدمات الخارجية بأمان',
        'معالجة البيانات وتحويلها تلقائياً',
        'الاستفادة من قدرات الذكاء الاصطناعي للمعالجة الذكية',
        'بناء لبنات أساسية لأتمتة أكثر تعقيداً'
      ],
      anatomy: {
        title: 'تشريح الأداة',
        parts: [
          { name: 'الاسم والوصف', desc: 'معرف واضح وما تفعله الأداة' },
          { name: 'المدخلات (المعاملات)', desc: 'البيانات التي تحتاجها الأداة للعمل' },
          { name: 'المنطق/المعالجة', desc: 'الكود أو الذكاء الاصطناعي الذي يعالج المدخلات' },
          { name: 'المخرجات', desc: 'النتيجة المرجعة بعد المعالجة' }
        ]
      },
      categories: {
        title: 'فئات الأدوات',
        list: {
          data: {
            name: 'أدوات البيانات',
            desc: 'جلب وتحليل وتحويل وتخزين البيانات',
            examples: ['مستخرج الويب', 'محلل JSON', 'محول CSV', 'استعلام قاعدة البيانات']
          },
          ai: {
            name: 'أدوات الذكاء الاصطناعي',
            desc: 'الاستفادة من قدرات الذكاء الاصطناعي',
            examples: ['ملخص النص', 'محلل الصور', 'تحليل المشاعر', 'الترجمة']
          },
          communication: {
            name: 'أدوات الاتصال',
            desc: 'إرسال الرسائل والإشعارات',
            examples: ['مرسل البريد', 'رسالة Slack', 'تنبيه SMS', 'إشعار فوري']
          },
          automation: {
            name: 'أدوات الأتمتة',
            desc: 'التحكم في التدفق وتفعيل الإجراءات',
            examples: ['المجدول', 'معالج Webhook', 'مراقب الملفات', 'مشغل الأحداث']
          },
          utility: {
            name: 'أدوات المساعدة',
            desc: 'وظائف مساعدة للمهام الشائعة',
            examples: ['منسق التاريخ', 'الحاسبة', 'منسق النص', 'مولد المعرفات']
          }
        }
      },
      howToCreate: {
        title: 'كيفية إنشاء أداة',
        steps: [
          'حدد ما يجب أن تفعله الأداة بوضوح',
          'حدد المدخلات المطلوبة والاختيارية',
          'اكتب منطق المعالجة (كود أو prompt AI)',
          'حدد تنسيق المخرجات',
          'اختبر ببيانات نموذجية',
          'وثق الاستخدام والأمثلة'
        ]
      },
      templates: 'قوالب الأدوات',
      useTemplate: 'استخدام',
      noTools: 'لم يتم إنشاء أدوات مخصصة بعد. ابدأ بقالب أو أنشئ من الصفر!'
    }
  }[language]

  const toolTemplates = [
    {
      id: 'web-scraper',
      name: language === 'ar' ? 'مستخرج الويب' : 'Web Scraper',
      description: language === 'ar' ? 'استخراج البيانات من صفحات الويب' : 'Extract data from web pages',
      icon: Globe,
      category: 'data',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'text-ai',
      name: language === 'ar' ? 'معالج النص AI' : 'AI Text Processor',
      description: language === 'ar' ? 'تلخيص وترجمة وتحليل النص' : 'Summarize, translate, analyze text',
      icon: MessageSquare,
      category: 'ai',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'email-sender',
      name: language === 'ar' ? 'مرسل البريد' : 'Email Sender',
      description: language === 'ar' ? 'إرسال رسائل بريد إلكتروني' : 'Send formatted emails',
      icon: Mail,
      category: 'communication',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'scheduler',
      name: language === 'ar' ? 'المجدول' : 'Scheduler',
      description: language === 'ar' ? 'جدولة المهام والتذكيرات' : 'Schedule tasks and reminders',
      icon: Calendar,
      category: 'automation',
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'calculator',
      name: language === 'ar' ? 'الحاسبة' : 'Calculator',
      description: language === 'ar' ? 'إجراء العمليات الحسابية' : 'Perform calculations',
      icon: Calculator,
      category: 'utility',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'api-caller',
      name: language === 'ar' ? 'مستدعي API' : 'API Caller',
      description: language === 'ar' ? 'استدعاء واجهات برمجة خارجية' : 'Call external APIs',
      icon: Webhook,
      category: 'data',
      color: 'from-indigo-500 to-violet-500'
    }
  ]

  const categoryIcons: Record<string, any> = {
    all: Wrench,
    data: Database,
    ai: Sparkles,
    communication: Mail,
    automation: RefreshCw,
    utility: Calculator
  }

  const filteredTools = activeCategory === 'all' 
    ? tools 
    : tools.filter(t => t.category === activeCategory)

  return (
    <div className="min-h-full p-4 md:p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t.title}</h1>
            <p className="text-gray-400 text-sm">{t.subtitle}</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          {t.createTool}
        </button>
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20 overflow-hidden">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="w-full p-4 flex items-center justify-between hover:bg-amber-500/5 transition"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-amber-400" />
            <span className="font-semibold">{t.whatAreTools}</span>
          </div>
          {showInfo ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        
        {showInfo && (
          <div className="px-4 pb-4 space-y-6">
            <p className="text-gray-300">{t.toolsExplanation}</p>
            
            <ul className="space-y-2">
              {t.toolsFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Anatomy */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-amber-400" />
                {t.anatomy.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {t.anatomy.parts.map((part, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                      <p className="font-medium text-sm">{part.name}</p>
                      <p className="text-xs text-gray-400">{part.desc}</p>
                    </div>
                    {i < t.anatomy.parts.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-amber-400" />
                {t.categories.title}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(t.categories.list).map(([key, value]) => {
                  const Icon = categoryIcons[key] || Wrench
                  return (
                    <div key={key} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5 text-amber-400" />
                        <span className="font-medium">{value.name}</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{value.desc}</p>
                      <div className="flex flex-wrap gap-1">
                        {value.examples.slice(0, 2).map((ex, i) => (
                          <span key={i} className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* How to Create */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                {t.howToCreate.title}
              </h3>
              <ol className="space-y-2">
                {t.howToCreate.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                    <span className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Templates */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          {t.templates}
        </h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
          {toolTemplates.map(template => {
            const Icon = template.icon
            return (
              <div
                key={template.id}
                className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 hover:border-amber-500/50 transition cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-medium text-sm mb-1">{template.name}</h3>
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{template.description}</p>
                <button className="w-full py-2 text-xs bg-amber-500/20 text-amber-400 rounded-lg opacity-0 group-hover:opacity-100 transition">
                  {t.useTemplate}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'data', 'ai', 'communication', 'automation', 'utility'].map(cat => {
          const Icon = categoryIcons[cat]
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                activeCategory === cat
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t[cat as keyof typeof t] as string}
            </button>
          )
        })}
      </div>

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-8 text-center">
          <Wrench className="w-12 h-12 mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400">{t.noTools}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map(tool => (
            <div
              key={tool.id}
              className="bg-gray-800/50 rounded-2xl border border-gray-700 p-4 hover:border-amber-500/50 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{tool.name}</h3>
                  <p className="text-sm text-gray-400">{tool.description}</p>
                </div>
                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded">
                  {tool.category}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t.inputs}</p>
                  <div className="flex flex-wrap gap-1">
                    {tool.inputs.map((input, i) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded ${input.required ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                        {input.name}: {input.type}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t.output}</p>
                  <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">{tool.output}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                <span>{t.usage}: {tool.usageCount}</span>
                <span>{t.lastUsed}: {tool.lastUsed}</span>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition">
                  <Play className="w-4 h-4" />
                  {t.run}
                </button>
                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                  <Settings className="w-4 h-4" />
                </button>
                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                  <Copy className="w-4 h-4" />
                </button>
                <button className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
