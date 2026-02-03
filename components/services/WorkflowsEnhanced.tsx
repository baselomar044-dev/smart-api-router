'use client'

import { useState } from 'react'
import { GitBranch, Plus, Play, Pause, Settings, Trash2, Copy, Zap, Clock, CheckCircle, AlertTriangle, ArrowRight, Info, ChevronDown, ChevronUp, Mail, MessageSquare, Database, Globe, FileText, Code, Webhook, Calendar, Filter, Bell, Send, Upload, Download, Repeat, GitMerge, Sparkles } from 'lucide-react'

interface Workflow {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'error'
  runs: number
  lastRun?: string
  trigger: { type: string; config: string }
  steps: { name: string; type: string }[]
}

interface WorkflowsEnhancedProps {
  language: 'en' | 'ar'
}

export default function WorkflowsEnhanced({ language }: WorkflowsEnhancedProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Email to Slack Notification',
      description: 'Forwards important emails to Slack channel',
      status: 'active',
      runs: 234,
      lastRun: '5 mins ago',
      trigger: { type: 'email', config: 'When new email arrives' },
      steps: [
        { name: 'Filter emails', type: 'filter' },
        { name: 'Extract content', type: 'transform' },
        { name: 'Send to Slack', type: 'action' }
      ]
    },
    {
      id: '2',
      name: 'Daily Report Generator',
      description: 'Generates and sends daily analytics report',
      status: 'active',
      runs: 45,
      lastRun: '1 day ago',
      trigger: { type: 'schedule', config: 'Every day at 9:00 AM' },
      steps: [
        { name: 'Fetch data', type: 'data' },
        { name: 'Generate report', type: 'ai' },
        { name: 'Send email', type: 'action' }
      ]
    }
  ])
  const [showInfo, setShowInfo] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const t = {
    en: {
      title: 'Automation Flows',
      subtitle: 'Create powerful workflows that run automatically',
      createWorkflow: 'Create Workflow',
      active: 'Active',
      paused: 'Paused',
      error: 'Error',
      runs: 'Total Runs',
      lastRun: 'Last Run',
      trigger: 'Trigger',
      steps: 'Steps',
      start: 'Start',
      pause: 'Pause',
      delete: 'Delete',
      duplicate: 'Duplicate',
      settings: 'Settings',
      whatAreWorkflows: 'What are Automation Flows?',
      workflowExplanation: 'Automation Flows (also called Workflows) are sequences of automated actions that run when triggered. They help you:',
      workflowFeatures: [
        'Automate repetitive tasks without coding',
        'Connect different apps and services together',
        'Process data automatically when events occur',
        'Save hours of manual work every week',
        'Reduce errors from manual processes'
      ],
      components: {
        title: 'Workflow Components',
        triggers: {
          name: 'Triggers',
          desc: 'Events that start your workflow',
          examples: ['New email', 'Schedule/Time', 'Webhook', 'File upload', 'Form submission']
        },
        actions: {
          name: 'Actions',
          desc: 'Tasks your workflow performs',
          examples: ['Send email', 'Create document', 'Update database', 'Call API', 'Send notification']
        },
        conditions: {
          name: 'Conditions',
          desc: 'Logic that controls flow',
          examples: ['If/Then', 'Filter', 'Switch', 'Loop', 'Delay']
        },
        transforms: {
          name: 'Transforms',
          desc: 'Data processing steps',
          examples: ['Format text', 'Parse JSON', 'Calculate', 'Merge data', 'AI processing']
        }
      },
      examples: {
        title: 'Example Use Cases',
        cases: [
          {
            title: 'Lead Management',
            desc: 'When form submitted → Add to CRM → Send welcome email → Notify sales team'
          },
          {
            title: 'Content Publishing',
            desc: 'When blog post ready → Format for social → Post to Twitter/LinkedIn → Track engagement'
          },
          {
            title: 'Invoice Processing',
            desc: 'When invoice received → Extract data with AI → Update accounting → Send confirmation'
          },
          {
            title: 'Customer Support',
            desc: 'When ticket created → Categorize with AI → Route to team → Send acknowledgment'
          }
        ]
      },
      templates: 'Workflow Templates',
      useTemplate: 'Use',
      noWorkflows: 'No workflows created yet. Start with a template or create from scratch!'
    },
    ar: {
      title: 'تدفقات الأتمتة',
      subtitle: 'إنشاء سير عمل قوي يعمل تلقائياً',
      createWorkflow: 'إنشاء سير عمل',
      active: 'نشط',
      paused: 'متوقف مؤقتاً',
      error: 'خطأ',
      runs: 'إجمالي التشغيلات',
      lastRun: 'آخر تشغيل',
      trigger: 'المشغل',
      steps: 'الخطوات',
      start: 'تشغيل',
      pause: 'إيقاف',
      delete: 'حذف',
      duplicate: 'نسخ',
      settings: 'إعدادات',
      whatAreWorkflows: 'ما هي تدفقات الأتمتة؟',
      workflowExplanation: 'تدفقات الأتمتة (تسمى أيضاً سير العمل) هي تسلسلات من الإجراءات التلقائية التي تعمل عند تشغيلها. تساعدك على:',
      workflowFeatures: [
        'أتمتة المهام المتكررة بدون برمجة',
        'ربط التطبيقات والخدمات المختلفة معاً',
        'معالجة البيانات تلقائياً عند حدوث أحداث',
        'توفير ساعات من العمل اليدوي كل أسبوع',
        'تقليل الأخطاء من العمليات اليدوية'
      ],
      components: {
        title: 'مكونات سير العمل',
        triggers: {
          name: 'المشغلات',
          desc: 'الأحداث التي تبدأ سير عملك',
          examples: ['بريد جديد', 'جدول/وقت', 'Webhook', 'رفع ملف', 'تقديم نموذج']
        },
        actions: {
          name: 'الإجراءات',
          desc: 'المهام التي يؤديها سير عملك',
          examples: ['إرسال بريد', 'إنشاء مستند', 'تحديث قاعدة بيانات', 'استدعاء API', 'إرسال إشعار']
        },
        conditions: {
          name: 'الشروط',
          desc: 'المنطق الذي يتحكم في التدفق',
          examples: ['إذا/ثم', 'تصفية', 'تبديل', 'حلقة', 'تأخير']
        },
        transforms: {
          name: 'التحويلات',
          desc: 'خطوات معالجة البيانات',
          examples: ['تنسيق النص', 'تحليل JSON', 'حساب', 'دمج البيانات', 'معالجة AI']
        }
      },
      examples: {
        title: 'أمثلة على الاستخدام',
        cases: [
          {
            title: 'إدارة العملاء المحتملين',
            desc: 'عند تقديم النموذج ← إضافة إلى CRM ← إرسال بريد ترحيبي ← إبلاغ فريق المبيعات'
          },
          {
            title: 'نشر المحتوى',
            desc: 'عندما تكون المقالة جاهزة ← تنسيق للسوشيال ← نشر على تويتر/لينكدإن ← تتبع التفاعل'
          },
          {
            title: 'معالجة الفواتير',
            desc: 'عند استلام الفاتورة ← استخراج البيانات بالذكاء الاصطناعي ← تحديث المحاسبة ← إرسال تأكيد'
          },
          {
            title: 'دعم العملاء',
            desc: 'عند إنشاء تذكرة ← تصنيف بالذكاء الاصطناعي ← توجيه للفريق ← إرسال إقرار'
          }
        ]
      },
      templates: 'قوالب سير العمل',
      useTemplate: 'استخدام',
      noWorkflows: 'لم يتم إنشاء سير عمل بعد. ابدأ بقالب أو أنشئ من الصفر!'
    }
  }[language]

  const workflowTemplates = [
    {
      id: 'email-notify',
      name: language === 'ar' ? 'إشعارات البريد' : 'Email Notifications',
      description: language === 'ar' ? 'إرسال إشعارات عند وصول بريد مهم' : 'Send alerts for important emails',
      icon: Mail,
      color: 'from-blue-500 to-cyan-500',
      steps: 3
    },
    {
      id: 'scheduled-report',
      name: language === 'ar' ? 'تقارير مجدولة' : 'Scheduled Reports',
      description: language === 'ar' ? 'إنشاء وإرسال تقارير يومية/أسبوعية' : 'Generate daily/weekly reports',
      icon: Calendar,
      color: 'from-green-500 to-emerald-500',
      steps: 4
    },
    {
      id: 'webhook-process',
      name: language === 'ar' ? 'معالجة Webhook' : 'Webhook Processor',
      description: language === 'ar' ? 'معالجة البيانات من خدمات خارجية' : 'Process data from external services',
      icon: Webhook,
      color: 'from-purple-500 to-pink-500',
      steps: 3
    },
    {
      id: 'data-sync',
      name: language === 'ar' ? 'مزامنة البيانات' : 'Data Sync',
      description: language === 'ar' ? 'مزامنة البيانات بين الأنظمة' : 'Sync data between systems',
      icon: Repeat,
      color: 'from-orange-500 to-red-500',
      steps: 5
    },
    {
      id: 'content-publish',
      name: language === 'ar' ? 'نشر المحتوى' : 'Content Publisher',
      description: language === 'ar' ? 'نشر المحتوى تلقائياً عبر المنصات' : 'Auto-publish content across platforms',
      icon: Send,
      color: 'from-indigo-500 to-violet-500',
      steps: 4
    }
  ]

  const getTriggerIcon = (type: string) => {
    const icons: Record<string, any> = {
      email: Mail,
      schedule: Calendar,
      webhook: Webhook,
      file: Upload,
      form: FileText
    }
    return icons[type] || Zap
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-500',
      paused: 'bg-yellow-500',
      error: 'bg-red-500'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-500'
  }

  const toggleWorkflowStatus = (id: string) => {
    setWorkflows(workflows.map(w => {
      if (w.id === id) {
        return { ...w, status: w.status === 'active' ? 'paused' : 'active' }
      }
      return w
    }))
  }

  return (
    <div className="min-h-full p-4 md:p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl">
            <GitBranch className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t.title}</h1>
            <p className="text-gray-400 text-sm">{t.subtitle}</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          {t.createWorkflow}
        </button>
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-500/20 overflow-hidden">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="w-full p-4 flex items-center justify-between hover:bg-emerald-500/5 transition"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold">{t.whatAreWorkflows}</span>
          </div>
          {showInfo ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        
        {showInfo && (
          <div className="px-4 pb-4 space-y-6">
            <p className="text-gray-300">{t.workflowExplanation}</p>
            
            <ul className="space-y-2">
              {t.workflowFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Components */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-emerald-400" />
                {t.components.title}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(t.components).filter(([key]) => key !== 'title').map(([key, value]) => {
                  const icons: Record<string, any> = {
                    triggers: Zap,
                    actions: Play,
                    conditions: Filter,
                    transforms: Code
                  }
                  const Icon = icons[key] || Zap
                  return (
                    <div key={key} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5 text-emerald-400" />
                        <span className="font-medium">{(value as any).name}</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{(value as any).desc}</p>
                      <div className="flex flex-wrap gap-1">
                        {(value as any).examples.slice(0, 3).map((ex: string, i: number) => (
                          <span key={i} className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Use Cases */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                {t.examples.title}
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {t.examples.cases.map((useCase, i) => (
                  <div key={i} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <h4 className="font-medium mb-2">{useCase.title}</h4>
                    <p className="text-sm text-gray-400">{useCase.desc}</p>
                  </div>
                ))}
              </div>
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
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
          {workflowTemplates.map(template => {
            const Icon = template.icon
            return (
              <div
                key={template.id}
                className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 hover:border-emerald-500/50 transition cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-medium text-sm mb-1">{template.name}</h3>
                <p className="text-xs text-gray-400 mb-2">{template.description}</p>
                <p className="text-xs text-emerald-400 mb-3">{template.steps} {language === 'ar' ? 'خطوات' : 'steps'}</p>
                <button className="w-full py-2 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg opacity-0 group-hover:opacity-100 transition">
                  {t.useTemplate}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Workflows */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{language === 'ar' ? 'سير العمل الخاص بك' : 'Your Workflows'}</h2>
        
        {workflows.length === 0 ? (
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-8 text-center">
            <GitBranch className="w-12 h-12 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">{t.noWorkflows}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workflows.map(workflow => {
              const TriggerIcon = getTriggerIcon(workflow.trigger.type)
              return (
                <div
                  key={workflow.id}
                  className="bg-gray-800/50 rounded-2xl border border-gray-700 p-4 hover:border-emerald-500/50 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/20 rounded-xl">
                        <TriggerIcon className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(workflow.status)}`} />
                        </div>
                        <p className="text-sm text-gray-400">{workflow.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-400">{workflow.runs}</p>
                        <p className="text-xs text-gray-400">{t.runs}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm">{workflow.lastRun}</p>
                        <p className="text-xs text-gray-400">{t.lastRun}</p>
                      </div>
                    </div>
                  </div>

                  {/* Steps visualization */}
                  <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
                    <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap">
                      <TriggerIcon className="w-4 h-4" />
                      {workflow.trigger.config}
                    </div>
                    {workflow.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                        <div className="bg-gray-700 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap">
                          {step.name}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => toggleWorkflowStatus(workflow.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                        workflow.status === 'active'
                          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {workflow.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {workflow.status === 'active' ? t.pause : t.start}
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
