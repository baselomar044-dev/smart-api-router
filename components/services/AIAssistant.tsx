'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { translations } from '@/lib/i18n'
import VoiceInput from '@/components/VoiceInput'
import { safeStorage } from '@/lib/safeStorage';

// ============================================
// ADVANCED AI ASSISTANT - With Attachments
// ============================================

interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  preview?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  thinking?: string
  showThinking?: boolean
  model?: string
  tokens?: number
  attachments?: Attachment[]
}

interface ConversationThread {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

// Advanced system prompts for different modes
const SYSTEM_PROMPTS = {
  general: {
    en: `You are Solver, an advanced AI assistant. You are:
- Completely honest - never fabricate information
- Humanized and friendly - talk like an expert friend
- Logical and organized - think step by step
- Humble - acknowledge when you don't know something

Always be helpful while being truthful. If uncertain, say so clearly.`,
    ar: `أنت سولفر، مساعد ذكاء اصطناعي متقدم. أنت:
- صادق تماماً - لا تختلق معلومات
- إنساني وودود - تحدث كصديق خبير
- منطقي ومنظم - فكر خطوة بخطوة
- متواضع - اعترف عندما لا تعرف شيئاً

كن مفيداً دائماً مع كونك صادقاً. إذا كنت غير متأكد، قل ذلك بوضوح.`
  },
  coding: {
    en: `You are Solver, an expert coding assistant. You:
- Write clean, efficient, well-documented code
- Explain your code thoroughly
- Follow best practices and modern patterns
- Suggest improvements and optimizations
- Are honest about trade-offs and limitations
- Use TypeScript/JavaScript, React, Next.js, and modern web tech`,
    ar: `أنت سولفر، مساعد برمجة خبير. أنت:
- تكتب كود نظيف وفعال وموثق جيداً
- تشرح الكود بشكل شامل
- تتبع أفضل الممارسات والأنماط الحديثة
- تقترح التحسينات والتحسينات
- صادق بشأن المقايضات والقيود
- تستخدم TypeScript/JavaScript وReact وNext.js وتقنيات الويب الحديثة`
  },
  creative: {
    en: `You are Solver, a creative thinking partner. You:
- Generate innovative and unique ideas
- Think outside the box
- Combine concepts in unexpected ways
- Are encouraging and build on ideas
- Offer multiple perspectives
- Help brainstorm without judgment`,
    ar: `أنت سولفر، شريك تفكير إبداعي. أنت:
- تولد أفكاراً مبتكرة وفريدة
- تفكر خارج الصندوق
- تجمع المفاهيم بطرق غير متوقعة
- مشجع وتبني على الأفكار
- تقدم وجهات نظر متعددة
- تساعد في العصف الذهني دون حكم`
  },
  analyst: {
    en: `You are Solver, a precise analytical assistant. You:
- Analyze data and situations systematically
- Break down complex problems
- Identify patterns and insights
- Provide evidence-based conclusions
- Clearly state assumptions and limitations
- Use structured reasoning`,
    ar: `أنت سولفر، مساعد تحليلي دقيق. أنت:
- تحلل البيانات والمواقف بشكل منهجي
- تقسم المشاكل المعقدة
- تحدد الأنماط والرؤى
- تقدم استنتاجات مبنية على الأدلة
- توضح الافتراضات والقيود بوضوح
- تستخدم التفكير المنظم`
  },
  teacher: {
    en: `You are Solver, a patient and effective teacher. You:
- Explain concepts from fundamentals
- Use analogies and real-world examples
- Adapt to the learner's level
- Ask guiding questions
- Celebrate progress
- Never make the learner feel stupid`,
    ar: `أنت سولفر، معلم صبور وفعال. أنت:
- تشرح المفاهيم من الأساسيات
- تستخدم التشبيهات وأمثلة من الحياة الواقعية
- تتكيف مع مستوى المتعلم
- تطرح أسئلة موجهة
- تحتفل بالتقدم
- لا تجعل المتعلم يشعر بالغباء أبداً`
  }
}

const ASSISTANT_MODES = [
  { id: 'general', icon: '🤖', labelEn: 'General', labelAr: 'عام' },
  { id: 'coding', icon: '💻', labelEn: 'Coding', labelAr: 'برمجة' },
  { id: 'creative', icon: '🎨', labelEn: 'Creative', labelAr: 'إبداعي' },
  { id: 'analyst', icon: '📊', labelEn: 'Analyst', labelAr: 'تحليلي' },
  { id: 'teacher', icon: '📚', labelEn: 'Teacher', labelAr: 'معلم' },
]

export default function AIAssistant() {
  const { language, apiKeys } = useAppStore()
  const t = translations[language]
  const isRTL = language === 'ar'
  
  // State
  const [threads, setThreads] = useState<ConversationThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMode, setSelectedMode] = useState<keyof typeof SYSTEM_PROMPTS>('general')
  const [selectedModel, setSelectedModel] = useState<'groq' | 'gemini' | 'claude' | 'openai'>('groq')
  const [showThinking, setShowThinking] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Attachment state
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load threads from localStorage
  useEffect(() => {
    const saved = safeStorage.getItem('ai-assistant-threads')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setThreads(parsed)
        if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id)
        }
      } catch (e) {
        console.error('Failed to parse threads:', e)
      }
    }
  }, [])

  // Save threads to localStorage
  useEffect(() => {
    if (threads.length > 0) {
      safeStorage.setItem('ai-assistant-threads', JSON.stringify(threads))
    }
  }, [threads])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threads, activeThreadId])

  // Get active thread
  const activeThread = threads.find(t => t.id === activeThreadId)
  const messages = activeThread?.messages || []

  // Create new thread
  const createNewThread = () => {
    const newThread: ConversationThread = {
      id: Date.now().toString(),
      title: language === 'ar' ? 'محادثة جديدة' : 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setThreads(prev => [newThread, ...prev])
    setActiveThreadId(newThread.id)
  }

  // Delete thread
  const deleteThread = (id: string) => {
    setThreads(prev => prev.filter(t => t.id !== id))
    if (activeThreadId === id) {
      const remaining = threads.filter(t => t.id !== id)
      setActiveThreadId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  // Get API key
  const getActiveKey = () => {
    if (selectedModel === 'groq' && apiKeys.groq) return apiKeys.groq
    if (selectedModel === 'gemini' && apiKeys.gemini) return apiKeys.gemini
    if (selectedModel === 'claude' && apiKeys.anthropic) return apiKeys.anthropic
    if (selectedModel === 'openai' && apiKeys.openai) return apiKeys.openai
    return apiKeys.groq || apiKeys.gemini || apiKeys.anthropic || apiKeys.openai
  }

  // File handling
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newAttachment: Attachment = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          url: e.target?.result as string,
          preview: file.type.startsWith('image/') ? e.target?.result as string : undefined
        }
        setAttachments(prev => [...prev, newAttachment])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Get file icon
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎥'
    if (type.startsWith('audio/')) return '🎵'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('sheet') || type.includes('excel')) return '📊'
    if (type.includes('json') || type.includes('javascript') || type.includes('typescript')) return '💻'
    return '📎'
  }

  // Send message
  const sendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return
    
    const apiKey = getActiveKey()
    if (!apiKey) {
      alert(language === 'ar' ? 'لم يتم إعداد مفتاح API. اذهب للإعدادات.' : 'No API key configured. Go to Settings.')
      return
    }

    // Create thread if needed
    let threadId = activeThreadId
    if (!threadId) {
      const newThread: ConversationThread = {
        id: Date.now().toString(),
        title: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setThreads(prev => [newThread, ...prev])
      threadId = newThread.id
      setActiveThreadId(threadId)
    }

    // Build message content with attachments
    let messageContent = input.trim()
    if (attachments.length > 0) {
      const attachmentDescriptions = attachments.map(a => {
        if (a.type.startsWith('image/')) {
          return `[Image: ${a.name}]`
        }
        return `[File: ${a.name} (${formatFileSize(a.size)})]`
      }).join('\n')
      
      if (messageContent) {
        messageContent = `${messageContent}\n\n${attachmentDescriptions}`
      } else {
        messageContent = attachmentDescriptions
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    }

    // Update thread with user message
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          messages: [...t.messages, userMessage],
          updatedAt: new Date(),
          title: t.messages.length === 0 ? (input.slice(0, 30) || 'Attachment') + (input.length > 30 ? '...' : '') : t.title
        }
      }
      return t
    }))

    setInput('')
    setAttachments([])
    setIsLoading(true)

    try {
      const systemPrompt = SYSTEM_PROMPTS[selectedMode][language]
      const threadMessages = threads.find(t => t.id === threadId)?.messages || []
      
      // Build messages with image support for vision models
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...threadMessages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: messageContent }
      ]
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          taskType: selectedMode === 'coding' ? 'complex_code' : 'general',
          apiKeys: apiKeys
        })
      })

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content || data.error || 'Error occurred',
        timestamp: new Date(),
        model: data.provider || selectedModel
      }

      setThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            messages: [...t.messages, assistantMessage],
            updatedAt: new Date()
          }
        }
        return t
      }))
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: language === 'ar' ? '❌ حدث خطأ. حاول مرة أخرى.' : '❌ An error occurred. Please try again.',
        timestamp: new Date()
      }

      setThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          return { ...t, messages: [...t.messages, errorMessage] }
        }
        return t
      }))
    } finally {
      setIsLoading(false)
    }
  }

  // Copy message
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  // Export chat
  const exportChat = () => {
    if (!activeThread) return
    
    const exportData = {
      title: activeThread.title,
      exportedAt: new Date().toISOString(),
      messages: activeThread.messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${activeThread.title.replace(/\s+/g, '-')}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Available models
  const models = [
    { id: 'groq', name: 'Groq', icon: '⚡', available: !!apiKeys.groq },
    { id: 'gemini', name: 'Gemini', icon: '💎', available: !!apiKeys.gemini },
    { id: 'claude', name: 'Claude', icon: '🧠', available: !!apiKeys.anthropic },
    { id: 'openai', name: 'OpenAI', icon: '🤖', available: !!apiKeys.openai },
  ]

  return (
    <div 
      className="flex h-[calc(100vh-140px)] rounded-xl overflow-hidden border border-[var(--border)]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[var(--primary)]/20 backdrop-blur-sm z-50 flex items-center justify-center border-2 border-dashed border-[var(--primary)] rounded-xl">
          <div className="text-center">
            <span className="text-6xl">📎</span>
            <p className="text-xl font-semibold mt-4">
              {language === 'ar' ? 'أفلت الملفات هنا' : 'Drop files here'}
            </p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        accept="image/*,.pdf,.doc,.docx,.txt,.json,.js,.ts,.tsx,.jsx,.html,.css,.md"
      />

      {/* Sidebar - Conversation List */}
      <div className={`bg-[var(--card)] border-r border-[var(--border)] transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-0'}`}>
        {sidebarOpen && (
          <div className="flex flex-col h-full">
            {/* New Chat Button */}
            <div className="p-4 border-b border-[var(--border)]">
              <button
                onClick={createNewThread}
                className="w-full btn btn-primary flex items-center justify-center gap-2"
              >
                <span>➕</span>
                <span>{language === 'ar' ? 'محادثة جديدة' : 'New Chat'}</span>
              </button>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto p-2">
              {threads.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted)]">
                  <p className="text-4xl mb-2">💬</p>
                  <p className="text-sm">{language === 'ar' ? 'لا توجد محادثات' : 'No conversations yet'}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {threads.map(thread => (
                    <div
                      key={thread.id}
                      className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                        activeThreadId === thread.id
                          ? 'bg-[var(--primary)] text-white'
                          : 'hover:bg-[var(--card-hover)]'
                      }`}
                      onClick={() => setActiveThreadId(thread.id)}
                    >
                      <span>💬</span>
                      <span className="flex-1 truncate text-sm">{thread.title}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteThread(thread.id) }}
                        className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-opacity`}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mode Selection */}
            <div className="p-4 border-t border-[var(--border)]">
              <label className="text-xs text-[var(--muted)] mb-2 block">
                {language === 'ar' ? 'وضع المساعد' : 'Assistant Mode'}
              </label>
              <div className="grid grid-cols-5 gap-1">
                {ASSISTANT_MODES.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id as keyof typeof SYSTEM_PROMPTS)}
                    className={`p-2 rounded-lg text-center transition-all ${
                      selectedMode === mode.id
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--bg)] hover:bg-[var(--card-hover)]'
                    }`}
                    title={language === 'ar' ? mode.labelAr : mode.labelEn}
                  >
                    <span className="text-lg">{mode.icon}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[var(--bg)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-[var(--card-hover)] rounded-lg transition-colors lg:hidden"
              title={language === 'ar' ? 'القائمة' : 'Menu'}
            >
              ☰
            </button>
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <span className="text-2xl">🧠</span>
                <span>{language === 'ar' ? 'المساعد الذكي المتقدم' : 'Advanced AI Assistant'}</span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                {language === 'ar' ? 'سولفر - صادق، منطقي، إنساني' : 'Solver - Honest, Logical, Human'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Export Button */}
            {activeThread && activeThread.messages.length > 0 && (
              <button
                onClick={exportChat}
                className="p-2 hover:bg-[var(--card-hover)] rounded-lg transition-colors"
                title={language === 'ar' ? 'تصدير المحادثة' : 'Export Chat'}
              >
                📥
              </button>
            )}
            
            {/* Model Selection */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--muted)]">{language === 'ar' ? 'النموذج:' : 'Model:'}</span>
              <div className="flex gap-1">
                {models.map(model => (
                  <button
                    key={model.id}
                    onClick={() => model.available && setSelectedModel(model.id as any)}
                    disabled={!model.available}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1 ${
                      selectedModel === model.id
                        ? 'bg-[var(--primary)] text-white'
                        : model.available
                          ? 'bg-[var(--card)] hover:bg-[var(--card-hover)]'
                          : 'bg-[var(--bg)] text-[var(--muted)] cursor-not-allowed'
                    }`}
                  >
                    <span>{model.icon}</span>
                    <span>{model.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4">🧠</div>
              <h3 className="text-2xl font-bold mb-2">
                {language === 'ar' ? 'مرحباً! أنا سولفر' : 'Hello! I\'m Solver'}
              </h3>
              <p className="text-[var(--muted)] max-w-md mb-8">
                {language === 'ar' 
                  ? 'مساعدك الذكي المتقدم. أنا هنا لمساعدتك بصدق وشفافية. اسألني أي شيء!'
                  : 'Your advanced AI assistant. I\'m here to help you with honesty and transparency. Ask me anything!'}
              </p>
              
              {/* Suggestion Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                {[
                  { icon: '💻', title: language === 'ar' ? 'ساعدني في كتابة كود' : 'Help me write code', prompt: 'Help me write a function that ' },
                  { icon: '🎯', title: language === 'ar' ? 'اشرح لي مفهوم' : 'Explain a concept', prompt: 'Explain this concept in simple terms: ' },
                  { icon: '💡', title: language === 'ar' ? 'أعطني أفكار' : 'Give me ideas', prompt: 'Give me creative ideas for ' },
                  { icon: '📎', title: language === 'ar' ? 'حلل ملفاتي' : 'Analyze my files', prompt: '' },
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (suggestion.prompt) {
                        setInput(suggestion.prompt)
                      } else {
                        fileInputRef.current?.click()
                      }
                    }}
                    className="card text-left hover:border-[var(--accent)] transition-all group"
                  >
                    <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">{suggestion.icon}</span>
                    <span className="font-medium">{suggestion.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                    : 'bg-gradient-to-br from-violet-500 to-indigo-500'
                }`}>
                  <span className="text-white text-lg">
                    {message.role === 'user' ? '👤' : '🧠'}
                  </span>
                </div>

                {/* Message Content */}
                <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className={`flex flex-wrap gap-2 mb-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.attachments.map(att => (
                        <div key={att.id} className="rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--card)]">
                          {att.preview ? (
                            <img src={att.preview} alt={att.name} className="max-w-[200px] max-h-[150px] object-cover" />
                          ) : (
                            <div className="flex items-center gap-2 p-3">
                              <span className="text-2xl">{getFileIcon(att.type)}</span>
                              <div>
                                <p className="text-sm font-medium truncate max-w-[150px]">{att.name}</p>
                                <p className="text-xs text-[var(--muted)]">{formatFileSize(att.size)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className={`inline-block px-5 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-br-md'
                      : 'bg-[var(--card)] border border-[var(--border)] rounded-bl-md'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                  
                  {/* Actions */}
                  {message.role === 'assistant' && (
                    <div className="mt-2 flex items-center gap-3 text-xs text-[var(--muted)]">
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
                      >
                        📋 {language === 'ar' ? 'نسخ' : 'Copy'}
                      </button>
                      {message.model && (
                        <span className="px-2 py-0.5 bg-[var(--card)] rounded">
                          {message.model}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <span className="text-white text-lg">🧠</span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-[var(--muted)]">
                  {language === 'ar' ? 'أفكر...' : 'Thinking...'}
                </span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {attachments.map(att => (
                <div key={att.id} className="relative group flex-shrink-0">
                  {att.preview ? (
                    <img src={att.preview} alt={att.name} className="w-16 h-16 object-cover rounded-lg border border-[var(--border)]" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-[var(--border)] bg-[var(--bg)] flex flex-col items-center justify-center">
                      <span className="text-xl">{getFileIcon(att.type)}</span>
                      <span className="text-[10px] truncate max-w-[56px] text-[var(--muted)]">{att.name.split('.').pop()}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--card)]">
          <div className="max-w-4xl mx-auto flex items-end gap-3">
            {/* Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 hover:bg-[var(--card-hover)] rounded-xl transition-colors"
              title={language === 'ar' ? 'إرفاق ملف' : 'Attach file'}
            >
              📎
            </button>
            
            {/* Voice Input Button */}
            <VoiceInput
              onTranscript={(text) => setInput(prev => prev + (prev ? ' ' : '') + text)}
              onInterimTranscript={(text) => {}}
              language={language === 'ar' ? 'ar-SA' : 'en-US'}
            />
            
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={language === 'ar' ? 'اكتب رسالتك هنا أو أرفق ملفاً...' : 'Type your message or attach a file...'}
              rows={1}
              className="flex-1 input resize-none max-h-40"
              style={{ minHeight: '50px' }}
            />
            <button
              onClick={sendMessage}
              disabled={(!input.trim() && attachments.length === 0) || isLoading}
              className="btn btn-primary h-[50px] px-6"
            >
              {isLoading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <span>📨</span>
              )}
            </button>
          </div>
          <p className="text-xs text-center text-[var(--muted)] mt-2">
            {language === 'ar' 
              ? 'سولفر يسعى للصدق والدقة. تحقق دائماً من المعلومات المهمة.'
              : 'Solver strives for honesty and accuracy. Always verify important information.'}
          </p>
        </div>
      </div>
    </div>
  )
}
