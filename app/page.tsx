'use client'

import { useState, useEffect } from 'react'

import { useAppStore } from '@/lib/store'
import { translations } from '@/lib/i18n'
import { ServiceType } from '@/lib/types'

// Service components
import Dashboard from '@/components/services/Dashboard'
// Builder removed - using Pro Builder instead
import ProBuilder from '@/components/services/ProBuilder'
// LiveEditor merged into ProBuilder
// ENHANCED: Agents with full customization
import Agents from '@/components/services/AgentsEnhanced'
// NEW: Tools Generator
import ToolsGenerator from '@/components/services/ToolsGenerator'
// ENHANCED: Workflows with 30+ nodes
import Workflows from '@/components/services/WorkflowsEnhanced'
import Settings from '@/components/services/Settings'
import Library from '@/components/services/Library'
import AIAssistant from '@/components/services/AIAssistant'
// VoiceGenerator removed - Text to MP3 now in Media Generator
// PromptGeneratorService removed
// ChatAssistant removed - using AI Assistant service instead

// New Feature Components
import SearchAgent from '@/components/SearchAgent'
import MediaGenerator from '@/components/MediaGenerator'
import DeploymentPanel from '@/components/DeploymentPanel'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import { 
  LayoutDashboard, 
  Brain, 
  Rocket, 
  Code2, 
  Bot, 
  Workflow, 
  Wrench, 
  Search, 
  Image, 
  Cloud, 
  Library as LibraryIcon, 
  Settings as SettingsIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Puzzle
} from 'lucide-react'


const APP_PASSWORD = '1606'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  
  const { 
    isAuthenticated, 
    login, logout, 
    currentService, 
    setCurrentService,
    language,
    setLanguage,
    sidebarOpen,
    setSidebarOpen,
    apiKeys,
  } = useAppStore()
  
  const t = translations[language]
  const isRTL = language === 'ar'

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const success = login(password)
    if (success) {
      setError('')
    } else {
      setError(t.wrongPassword)
    }
  }

  const handleLogout = () => {
    logout()
    setCurrentService('dashboard')
  }

  // Update HTML direction based on language
  useEffect(() => {
    if (mounted) {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
      document.documentElement.lang = language
    }
  }, [language, isRTL, mounted])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="spinner" />
      </div>
    )
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="card w-full max-w-md mx-4 animate-fadeIn">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Puzzle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              {t.appName}
            </h1>
            <p className="text-slate-400 mt-2">{t.tagline}</p>
          </div>
          
          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.enterPassword}
                className="input text-center text-lg"
                autoFocus
              />
            </div>
            
            {error && (
              <p className="text-[var(--error)] text-center text-sm">{error}</p>
            )}
            
            <button type="submit" className="btn btn-primary w-full">
              {t.login}
            </button>
          </form>
          
          {/* Language Toggle */}
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setLanguage('ar')}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                language === 'ar' 
                  ? 'bg-[var(--primary)] text-white' 
                  : 'bg-[var(--card-hover)] text-[var(--muted)]'
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                language === 'en' 
                  ? 'bg-[var(--primary)] text-white' 
                  : 'bg-[var(--card-hover)] text-[var(--muted)]'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main App - Grouped services for better organization
  const serviceGroups = [
    {
      category: language === 'ar' ? 'الرئيسية' : 'Main',
      services: [
        { id: 'dashboard' as ServiceType, icon: <LayoutDashboard className="w-5 h-5" />, label: t.dashboard, description: language === 'ar' ? 'نظرة عامة على مشاريعك وإحصائياتك' : 'Overview of your projects and stats' },
        { id: 'assistant' as ServiceType, icon: <Brain className="w-5 h-5" />, label: language === 'ar' ? 'المساعد الذكي' : 'AI Assistant', description: language === 'ar' ? 'اسأل أي سؤال واحصل على إجابة فورية' : 'Ask any question and get instant answers' },
      ]
    },
    {
      category: language === 'ar' ? 'البناء والتطوير' : 'Build',
      services: [
        { id: 'probuilder' as ServiceType, icon: <Rocket className="w-5 h-5" />, label: language === 'ar' ? 'باني المشاريع' : 'Pro Builder', description: language === 'ar' ? 'محرر كود + قوالب مجانية + أدوات CSS' : 'Code editor + free templates + CSS tools' },
      ]
    },
    {
      category: language === 'ar' ? 'الأتمتة' : 'Automation',
      services: [
        { id: 'agents' as ServiceType, icon: <Bot className="w-5 h-5" />, label: t.agents, description: language === 'ar' ? 'أنشئ مساعدين ذكيين لمهام محددة' : 'Create smart assistants for specific tasks' },
        { id: 'workflows' as ServiceType, icon: <Workflow className="w-5 h-5" />, label: language === 'ar' ? 'سير العمل' : 'Workflows', description: language === 'ar' ? 'أتمتة سلسلة من المهام تلقائياً' : 'Automate a chain of tasks automatically' },
        { id: 'tools' as ServiceType, icon: <Wrench className="w-5 h-5" />, label: language === 'ar' ? 'الأدوات' : 'Tools', description: language === 'ar' ? 'أنشئ أدوات مخصصة للوكلاء' : 'Create custom tools for agents' },
      ]
    },
    {
      category: language === 'ar' ? 'الأدوات' : 'Utilities',
      services: [
        { id: 'search' as ServiceType, icon: <Search className="w-5 h-5" />, label: language === 'ar' ? 'البحث الذكي' : 'Smart Search', description: language === 'ar' ? 'ابحث في الويب واحصل على ملخص ذكي' : 'Search the web and get smart summaries' },
        { id: 'media' as ServiceType, icon: <Image className="w-5 h-5" />, label: language === 'ar' ? 'مولد الوسائط' : 'Media Generator', description: language === 'ar' ? 'أنشئ صور وفيديوهات وصوت MP3' : 'Create images, videos and MP3 audio' },
        { id: 'deploy' as ServiceType, icon: <Cloud className="w-5 h-5" />, label: language === 'ar' ? 'النشر' : 'Deploy', description: language === 'ar' ? 'انشر مشروعك على الإنترنت بنقرة واحدة' : 'Publish your project online with one click' },
      ]
    },
    {
      category: language === 'ar' ? 'النظام' : 'System',
      services: [
        { id: 'library' as ServiceType, icon: <LibraryIcon className="w-5 h-5" />, label: t.library, description: language === 'ar' ? 'قوالب ومكونات جاهزة للاستخدام' : 'Ready-to-use templates and components' },
        { id: 'settings' as ServiceType, icon: <SettingsIcon className="w-5 h-5" />, label: t.settings, description: language === 'ar' ? 'تخصيص المظهر والإعدادات' : 'Customize appearance and settings' },
      ]
    },
  ]
  
  // Flat list for lookups
  const services = serviceGroups.flatMap(g => g.services)

  const renderService = () => {
    switch (currentService) {
      case 'dashboard': return <Dashboard />
      case 'assistant': return <AIAssistant />
      case 'probuilder': return <ProBuilder language={language} apiKeys={apiKeys} />
      case 'agents': return <Agents language={language} apiKeys={apiKeys} />
      case 'workflows': return <Workflows language={language} />
      case 'tools': return <ToolsGenerator language={language} />
      case 'library': return <Library />
      case 'search': return <SearchAgent />
      case 'media': return <MediaGenerator />
      case 'deploy': return <DeploymentPanel />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Sidebar */}
      <aside className={`sidebar ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        {/* Logo */}
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Puzzle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{t.appName}</h1>
              <p className="text-xs text-[var(--muted)]">{t.tagline}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation - Grouped by Category */}
        <nav className="p-3 overflow-y-auto max-h-[calc(100vh-280px)]">
          {serviceGroups.map((group, groupIndex) => (
            <div key={group.category} className={groupIndex > 0 ? 'mt-4' : ''}>
              {/* Category Header */}
              <div className="px-3 py-2">
                <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  {group.category}
                </span>
              </div>
              {/* Category Services */}
              <div className="space-y-1">
                {group.services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setCurrentService(service.id)}
                    title={service.description}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      currentService === service.id
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-[var(--card-hover)] text-[var(--foreground)]'
                    }`}
                  >
                    <span className={currentService === service.id ? 'text-white' : 'text-[var(--muted)]'}>{service.icon}</span>
                    <span className="text-sm font-medium">{service.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        
        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--border)]">
          {/* Language Toggle */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[var(--muted)]">{t.language}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setLanguage('ar')}
                className={`px-2 py-1 rounded-md text-sm ${language === 'ar' ? 'bg-[var(--primary)] text-white' : 'hover:bg-[var(--card-hover)]'}`}
              >
                عربي
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-md text-sm ${language === 'en' ? 'bg-[var(--primary)] text-white' : 'hover:bg-[var(--card-hover)]'}`}
              >
                EN
              </button>
            </div>
          </div>
          
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--card-hover)] hover:bg-red-500/10 hover:text-red-500 transition-all text-sm font-medium"
            title={language === 'ar' ? 'تسجيل الخروج من حسابك' : 'Sign out of your account'}
          >
            <LogOut className="w-4 h-4" />
            {t.logout}
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className={`main-content flex flex-col ${!sidebarOpen ? 'main-content-expanded' : ''}`}>
        {/* Top Bar - Only show for non-fullscreen services */}
        {currentService !== 'probuilder' && (
          <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)] flex-shrink-0">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors"
                  title={sidebarOpen ? (language === 'ar' ? 'إخفاء القائمة' : 'Hide sidebar') : (language === 'ar' ? 'إظهار القائمة' : 'Show sidebar')}
                >
                  {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-[var(--muted)]">{services.find(s => s.id === currentService)?.icon}</span>
                  <div>
                    <h2 className="text-lg font-semibold leading-tight">{services.find(s => s.id === currentService)?.label}</h2>
                    <p className="text-sm text-[var(--muted)]">{services.find(s => s.id === currentService)?.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>
        )}
        
        {/* Service Content - Full height for editor, padded for others */}
        {currentService === 'probuilder' ? (
          <div className="flex-1 h-[100vh]">
            {renderService()}
          </div>
        ) : (
          <div className="p-6 flex-1 overflow-auto">
            {renderService()}
          </div>
        )}
      </main>
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}
