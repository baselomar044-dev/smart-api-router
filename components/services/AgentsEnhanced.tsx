'use client'

import { useState } from 'react'
import { Bot, Plus, Play, Pause, Settings, Trash2, Copy, Zap, Brain, Target, Clock, CheckCircle, AlertCircle, Sparkles, MessageSquare, Code, FileText, Search, Globe, Database, Mail, ArrowRight, Info, ChevronDown, ChevronUp } from 'lucide-react'

interface Agent {
  id: string
  name: string
  description: string
  type: 'assistant' | 'researcher' | 'coder' | 'writer' | 'analyzer'
  status: 'active' | 'paused' | 'stopped'
  tasks: number
  successRate: number
  lastRun?: string
  triggers: string[]
  actions: string[]
  model: string
}

interface AgentsEnhancedProps {
  language: 'en' | 'ar'
  apiKeys: Record<string, string>
}

export default function AgentsEnhanced({ language, apiKeys }: AgentsEnhancedProps) {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Research Assistant',
      description: 'Automatically researches topics and compiles reports',
      type: 'researcher',
      status: 'active',
      tasks: 156,
      successRate: 94,
      lastRun: '2 hours ago',
      triggers: ['On schedule', 'Manual trigger'],
      actions: ['Web search', 'Summarize', 'Create report'],
      model: 'gpt-4'
    },
    {
      id: '2', 
      name: 'Code Reviewer',
      description: 'Reviews code and suggests improvements',
      type: 'coder',
      status: 'paused',
      tasks: 89,
      successRate: 97,
      lastRun: '1 day ago',
      triggers: ['GitHub webhook', 'Manual'],
      actions: ['Analyze code', 'Find bugs', 'Suggest fixes'],
      model: 'claude-3'
    }
  ])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showInfo, setShowInfo] = useState(true)

  const t = {
    en: {
      title: 'AI Agents',
      subtitle: 'Create autonomous agents that work for you 24/7',
      createAgent: 'Create New Agent',
      active: 'Active',
      paused: 'Paused', 
      stopped: 'Stopped',
      tasks: 'Tasks Completed',
      successRate: 'Success Rate',
      lastRun: 'Last Run',
      triggers: 'Triggers',
      actions: 'Actions',
      model: 'AI Model',
      start: 'Start',
      pause: 'Pause',
      delete: 'Delete',
      duplicate: 'Duplicate',
      settings: 'Settings',
      whatAreAgents: 'What are AI Agents?',
      agentExplanation: 'AI Agents are autonomous programs that can perform tasks on your behalf. Unlike simple chatbots, agents can:',
      agentFeatures: [
        'Work independently without constant supervision',
        'Make decisions based on goals you set',
        'Execute multi-step workflows automatically',
        'Learn from outcomes and improve over time',
        'Integrate with external services and APIs'
      ],
      agentTypes: {
        title: 'Types of Agents',
        assistant: {
          name: 'Assistant Agent',
          desc: 'General-purpose helper for answering questions, scheduling, and task management'
        },
        researcher: {
          name: 'Research Agent', 
          desc: 'Searches the web, analyzes data, and compiles comprehensive reports'
        },
        coder: {
          name: 'Coding Agent',
          desc: 'Writes, reviews, and debugs code. Can work with multiple programming languages'
        },
        writer: {
          name: 'Writing Agent',
          desc: 'Creates content, edits documents, and maintains consistent style and tone'
        },
        analyzer: {
          name: 'Analysis Agent',
          desc: 'Processes data, identifies patterns, and generates insights and visualizations'
        }
      },
      howItWorks: {
        title: 'How Agents Work',
        steps: [
          { title: 'Define Goals', desc: 'Set clear objectives for your agent to accomplish' },
          { title: 'Configure Triggers', desc: 'Choose when the agent should activate (schedule, webhook, manual)' },
          { title: 'Set Actions', desc: 'Define what tools and capabilities the agent can use' },
          { title: 'Monitor & Improve', desc: 'Track performance and refine agent behavior over time' }
        ]
      },
      templates: 'Agent Templates',
      useTemplate: 'Use Template',
      noAgents: 'No agents created yet. Create your first agent to get started!'
    },
    ar: {
      title: 'وكلاء الذكاء الاصطناعي',
      subtitle: 'إنشاء وكلاء مستقلين يعملون لأجلك على مدار الساعة',
      createAgent: 'إنشاء وكيل جديد',
      active: 'نشط',
      paused: 'متوقف مؤقتاً',
      stopped: 'متوقف',
      tasks: 'المهام المكتملة',
      successRate: 'معدل النجاح',
      lastRun: 'آخر تشغيل',
      triggers: 'المشغلات',
      actions: 'الإجراءات',
      model: 'نموذج الذكاء الاصطناعي',
      start: 'تشغيل',
      pause: 'إيقاف مؤقت',
      delete: 'حذف',
      duplicate: 'نسخ',
      settings: 'الإعدادات',
      whatAreAgents: 'ما هي وكلاء الذكاء الاصطناعي؟',
      agentExplanation: 'وكلاء الذكاء الاصطناعي هي برامج مستقلة يمكنها أداء المهام نيابة عنك. على عكس روبوتات الدردشة البسيطة، يمكن للوكلاء:',
      agentFeatures: [
        'العمل بشكل مستقل دون إشراف مستمر',
        'اتخاذ القرارات بناءً على الأهداف التي تحددها',
        'تنفيذ سير العمل متعدد الخطوات تلقائياً',
        'التعلم من النتائج والتحسن مع الوقت',
        'التكامل مع الخدمات الخارجية وواجهات البرمجة'
      ],
      agentTypes: {
        title: 'أنواع الوكلاء',
        assistant: {
          name: 'وكيل المساعد',
          desc: 'مساعد عام للإجابة على الأسئلة والجدولة وإدارة المهام'
        },
        researcher: {
          name: 'وكيل البحث',
          desc: 'يبحث في الويب ويحلل البيانات ويجمع تقارير شاملة'
        },
        coder: {
          name: 'وكيل البرمجة',
          desc: 'يكتب ويراجع ويصحح الكود. يعمل مع لغات برمجة متعددة'
        },
        writer: {
          name: 'وكيل الكتابة',
          desc: 'ينشئ المحتوى ويحرر المستندات ويحافظ على أسلوب متسق'
        },
        analyzer: {
          name: 'وكيل التحليل',
          desc: 'يعالج البيانات ويحدد الأنماط وينشئ الرؤى والتصورات'
        }
      },
      howItWorks: {
        title: 'كيف يعمل الوكلاء',
        steps: [
          { title: 'حدد الأهداف', desc: 'ضع أهدافاً واضحة لوكيلك لتحقيقها' },
          { title: 'إعداد المشغلات', desc: 'اختر متى يجب تنشيط الوكيل (جدول، webhook، يدوي)' },
          { title: 'تعيين الإجراءات', desc: 'حدد الأدوات والقدرات التي يمكن للوكيل استخدامها' },
          { title: 'المراقبة والتحسين', desc: 'تتبع الأداء وصقل سلوك الوكيل مع الوقت' }
        ]
      },
      templates: 'قوالب الوكلاء',
      useTemplate: 'استخدام القالب',
      noAgents: 'لم يتم إنشاء وكلاء بعد. أنشئ وكيلك الأول للبدء!'
    }
  }[language]

  const agentTemplates = [
    {
      id: 'email-assistant',
      name: language === 'ar' ? 'مساعد البريد الإلكتروني' : 'Email Assistant',
      description: language === 'ar' ? 'يقرأ ويصنف ويرد على رسائل البريد الإلكتروني' : 'Reads, categorizes, and responds to emails',
      icon: Mail,
      type: 'assistant' as const,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'web-monitor',
      name: language === 'ar' ? 'مراقب الويب' : 'Web Monitor',
      description: language === 'ar' ? 'يراقب المواقع ويرسل تنبيهات عند التغييرات' : 'Monitors websites and alerts on changes',
      icon: Globe,
      type: 'researcher' as const,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'code-assistant',
      name: language === 'ar' ? 'مساعد البرمجة' : 'Code Assistant',
      description: language === 'ar' ? 'يساعد في كتابة ومراجعة وتصحيح الكود' : 'Helps write, review, and debug code',
      icon: Code,
      type: 'coder' as const,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'content-writer',
      name: language === 'ar' ? 'كاتب المحتوى' : 'Content Writer',
      description: language === 'ar' ? 'ينشئ مقالات ومنشورات ومحتوى تسويقي' : 'Creates articles, posts, and marketing content',
      icon: FileText,
      type: 'writer' as const,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'data-analyzer',
      name: language === 'ar' ? 'محلل البيانات' : 'Data Analyzer',
      description: language === 'ar' ? 'يحلل البيانات ويستخرج رؤى قيمة' : 'Analyzes data and extracts valuable insights',
      icon: Database,
      type: 'analyzer' as const,
      color: 'from-yellow-500 to-orange-500'
    }
  ]

  const getTypeIcon = (type: string) => {
    const icons = {
      assistant: MessageSquare,
      researcher: Search,
      coder: Code,
      writer: FileText,
      analyzer: Database
    }
    return icons[type as keyof typeof icons] || Bot
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-500',
      paused: 'bg-yellow-500',
      stopped: 'bg-red-500'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-500'
  }

  const toggleAgentStatus = (id: string) => {
    setAgents(agents.map(a => {
      if (a.id === id) {
        return { ...a, status: a.status === 'active' ? 'paused' : 'active' }
      }
      return a
    }))
  }

  return (
    <div className="min-h-full p-4 md:p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t.title}</h1>
            <p className="text-gray-400 text-sm">{t.subtitle}</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          {t.createAgent}
        </button>
      </div>

      {/* Info Section - Collapsible */}
      <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-2xl border border-violet-500/20 overflow-hidden">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="w-full p-4 flex items-center justify-between hover:bg-violet-500/5 transition"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-violet-400" />
            <span className="font-semibold">{t.whatAreAgents}</span>
          </div>
          {showInfo ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        
        {showInfo && (
          <div className="px-4 pb-4 space-y-6">
            <p className="text-gray-300">{t.agentExplanation}</p>
            
            <ul className="space-y-2">
              {t.agentFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* How It Works */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                {t.howItWorks.title}
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                {t.howItWorks.steps.map((step, i) => (
                  <div key={i} className="relative">
                    <div className="bg-gray-800/50 rounded-xl p-4 h-full">
                      <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-white font-bold mb-3">
                        {i + 1}
                      </div>
                      <h4 className="font-medium mb-1">{step.title}</h4>
                      <p className="text-sm text-gray-400">{step.desc}</p>
                    </div>
                    {i < 3 && (
                      <ArrowRight className="hidden md:block absolute top-1/2 -right-2 w-4 h-4 text-violet-400 transform -translate-y-1/2 z-10" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Types */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                {t.agentTypes.title}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(t.agentTypes).filter(([key]) => key !== 'title').map(([key, value]) => {
                  const TypeIcon = getTypeIcon(key)
                  return (
                    <div key={key} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <TypeIcon className="w-5 h-5 text-violet-400" />
                        <span className="font-medium">{(value as any).name}</span>
                      </div>
                      <p className="text-sm text-gray-400">{(value as any).desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Agent Templates */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          {t.templates}
        </h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
          {agentTemplates.map(template => {
            const Icon = template.icon
            return (
              <div
                key={template.id}
                className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 hover:border-violet-500/50 transition cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-medium text-sm mb-1">{template.name}</h3>
                <p className="text-xs text-gray-400 mb-3">{template.description}</p>
                <button className="w-full py-2 text-xs bg-violet-500/20 text-violet-400 rounded-lg opacity-0 group-hover:opacity-100 transition">
                  {t.useTemplate}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Agents */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{language === 'ar' ? 'وكلائك' : 'Your Agents'}</h2>
        
        {agents.length === 0 ? (
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-8 text-center">
            <Bot className="w-12 h-12 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">{t.noAgents}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {agents.map(agent => {
              const TypeIcon = getTypeIcon(agent.type)
              return (
                <div
                  key={agent.id}
                  className="bg-gray-800/50 rounded-2xl border border-gray-700 p-4 hover:border-violet-500/50 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-500/20 rounded-xl">
                        <TypeIcon className="w-6 h-6 text-violet-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{agent.name}</h3>
                        <p className="text-sm text-gray-400">{agent.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                      <span className="text-xs text-gray-400">
                        {t[agent.status as keyof typeof t] as string}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                    <div className="bg-gray-900/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-violet-400">{agent.tasks}</p>
                      <p className="text-xs text-gray-400">{t.tasks}</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-green-400">{agent.successRate}%</p>
                      <p className="text-xs text-gray-400">{t.successRate}</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-2">
                      <p className="text-sm font-medium">{agent.lastRun}</p>
                      <p className="text-xs text-gray-400">{t.lastRun}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAgentStatus(agent.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                        agent.status === 'active'
                          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {agent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {agent.status === 'active' ? t.pause : t.start}
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
