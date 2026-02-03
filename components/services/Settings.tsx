'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { ThemeSelector } from '@/components/ThemeSelector'
import { Settings, Key, Globe, Palette, Database, Download, Upload, Trash2, Lock, Eye, EyeOff, Shield, Check, X, RefreshCw, Wifi, WifiOff, Zap, Smartphone, QrCode } from 'lucide-react'
import CostQualityMatrix from '@/components/CostQualityMatrix'
import { safeStorage } from '@/lib/safeStorage';
// ThemeSelector removed - using system theme only

const API_SETTINGS_PASSWORD = '1235'

// Real API validation endpoints
const API_VALIDATORS: Record<string, { url: string; method: string; getHeaders: (key: string) => Record<string, string>; validateResponse: (res: any) => boolean; body?: any }> = {
  openai: {
    url: 'https://api.openai.com/v1/models',
    method: 'GET',
    getHeaders: (key) => ({ 'Authorization': `Bearer ${key}` }),
    validateResponse: (res) => res.ok,
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    method: 'POST',
    getHeaders: (key) => ({ 
      'x-api-key': key, 
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    }),
    validateResponse: (res) => res.status !== 401 && res.status !== 403,
    body: JSON.stringify({ model: 'claude-3-5-haiku-20241022', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models?key=',
    method: 'GET',
    getHeaders: () => ({}),
    validateResponse: (res) => res.ok,
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/models',
    method: 'GET',
    getHeaders: (key) => ({ 'Authorization': `Bearer ${key}` }),
    validateResponse: (res) => res.ok,
  },
  deepseek: {
    url: 'https://api.deepseek.com/v1/models',
    method: 'GET',
    getHeaders: (key) => ({ 'Authorization': `Bearer ${key}` }),
    validateResponse: (res) => res.ok,
  },
  tavily: {
    url: 'https://api.tavily.com/search',
    method: 'POST',
    getHeaders: () => ({ 'Content-Type': 'application/json' }),
    validateResponse: (res) => res.status !== 401,
    body: JSON.stringify({ api_key: '', query: 'test', max_results: 1 }),
  },
}

type KeyStatus = 'idle' | 'checking' | 'valid' | 'invalid'

export default function SettingsPage() {
  const { language, setLanguage, apiKeys, setApiKeys, theme, setTheme } = useStore()
  const [isApiUnlocked, setIsApiUnlocked] = useState(false)
  const [apiPassword, setApiPassword] = useState('')
  const [apiPasswordError, setApiPasswordError] = useState('')
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [localKeys, setLocalKeys] = useState({
    openai: '',
    anthropic: '',
    gemini: '',
    groq: '',
    deepseek: '',
    tavily: '',
    stability: '',
    replicate: '',
    runway: ''
  })
  const [keyStatus, setKeyStatus] = useState<Record<string, KeyStatus>>({
    openai: 'idle',
    anthropic: 'idle',
    gemini: 'idle',
    groq: 'idle',
    deepseek: 'idle',
    tavily: 'idle',
    stability: 'idle',
    replicate: 'idle',
    runway: 'idle',
  })
  const [showMatrix, setShowMatrix] = useState(false)
  const [keyErrors, setKeyErrors] = useState<Record<string, string>>({})
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showTestAll, setShowTestAll] = useState(false)
  const [testAllStatus, setTestAllStatus] = useState<'idle' | 'testing' | 'done'>('idle')
  const [testResults, setTestResults] = useState<Record<string, { status: 'pending' | 'testing' | 'success' | 'error'; message: string; latency?: number }>>({})
  

  const t = {
    ar: {
      title: 'الإعدادات',
      apiKeys: 'مفاتيح API',
      apiKeysDesc: 'أدخل مفاتيح API الخاصة بك للاتصال بخدمات الذكاء الاصطناعي. سيتم التحقق من صحة كل مفتاح.',
      enterPassword: 'أدخل كلمة المرور للوصول',
      password: 'كلمة المرور',
      unlock: 'فتح',
      wrongPassword: 'كلمة المرور غير صحيحة!',
      locked: 'محمي بكلمة مرور',
      openai: 'OpenAI (GPT-4, DALL-E)',
      anthropic: 'Anthropic (Claude)',
      gemini: 'Google Gemini (مجاني)',
      groq: 'Groq (مجاني + سريع جداً)',
      deepseek: 'DeepSeek (أرخص للكود)',
      tavily: 'Tavily (للبحث)',
      viewMatrix: 'عرض مصفوفة التكلفة/الجودة',
      hideMatrix: 'إخفاء المصفوفة',
      save: 'حفظ المفاتيح',
      saving: 'جاري الحفظ...',
      saved: 'تم الحفظ ✓',
      validate: 'تحقق',
      validating: 'جاري التحقق...',
      valid: 'مفتاح صالح ✓',
      invalid: 'مفتاح غير صالح',
      appearance: 'المظهر',
      theme: 'السمة',
      dark: 'داكن',
      light: 'فاتح',
      system: 'تلقائي',
      language: 'اللغة',
      arabic: 'العربية',
      english: 'English',
      data: 'البيانات',
      export: 'تصدير كل البيانات',
      import: 'استيراد البيانات',
      reset: 'مسح كل البيانات',
      resetConfirm: 'هل أنت متأكد؟ سيتم حذف كل البيانات نهائياً!',
      dbStatus: 'حالة الاتصال',
      dbConnected: 'متصل',
      dbReady: 'جاهز للعمل',
      noKeysWarning: 'لم يتم إضافة أي مفاتيح API بعد. أضف مفتاح واحد على الأقل لاستخدام خدمات الذكاء الاصطناعي.',
      connectedProviders: 'المزودين المتصلين',
      getKey: 'احصل على مفتاح',
      testAll: 'اختبار جميع المفاتيح',
      testAllDesc: 'اختبار شامل لجميع مفاتيح API المضافة',
      testing: 'جاري الاختبار...',
      testComplete: 'اكتمل الاختبار',
      hideTests: 'إخفاء النتائج',
      testPassed: 'نجح',
      testFailed: 'فشل',
      noKeysToTest: 'لا توجد مفاتيح للاختبار',
      latency: 'وقت الاستجابة',
    },
    en: {
      title: 'Settings',
      apiKeys: 'API Keys',
      apiKeysDesc: 'Enter your API keys to connect to AI services. Each key will be validated when saved.',
      enterPassword: 'Enter password to access',
      password: 'Password',
      unlock: 'Unlock',
      wrongPassword: 'Wrong password!',
      locked: 'Password Protected',
      openai: 'OpenAI (GPT-4, DALL-E)',
      anthropic: 'Anthropic (Claude)',
      gemini: 'Google Gemini (FREE tier)',
      groq: 'Groq (FREE + Ultra Fast)',
      deepseek: 'DeepSeek (Cheapest for Code)',
      tavily: 'Tavily (Search)',
      viewMatrix: 'View Cost/Quality Matrix',
      hideMatrix: 'Hide Matrix',
      save: 'Save Keys',
      saving: 'Saving...',
      saved: 'Saved ✓',
      validate: 'Test',
      validating: 'Testing...',
      valid: 'Valid ✓',
      invalid: 'Invalid key',
      appearance: 'Appearance',
      theme: 'Theme',
      dark: 'Dark',
      light: 'Light',
      system: 'System',
      language: 'Language',
      arabic: 'العربية',
      english: 'English',
      data: 'Data',
      export: 'Export All Data',
      import: 'Import Data',
      reset: 'Reset All Data',
      resetConfirm: 'Are you sure? All data will be permanently deleted!',
      dbStatus: 'Connection Status',
      dbConnected: 'Connected',
      dbReady: 'Ready to use',
      noKeysWarning: 'No API keys added yet. Add at least one key to use AI services.',
      connectedProviders: 'Connected Providers',
      getKey: 'Get API Key',
      testAll: 'Test All API Keys',
      testAllDesc: 'Comprehensive test of all configured API keys',
      testing: 'Testing...',
      testComplete: 'Test Complete',
      hideTests: 'Hide Results',
      testPassed: 'Passed',
      testFailed: 'Failed',
      noKeysToTest: 'No keys to test',
      latency: 'Latency',
    }
  }

  const txt = t[language] || t.en

  useEffect(() => {
    if (apiKeys) {
      setLocalKeys({
        openai: apiKeys.openai || '',
        anthropic: apiKeys.anthropic || '',
        gemini: apiKeys.gemini || apiKeys.google || '',
        groq: apiKeys.groq || '',
        deepseek: apiKeys.deepseek || '',
        tavily: apiKeys.tavily || '',
        stability: apiKeys.stability || '',
        replicate: apiKeys.replicate || '',
        runway: apiKeys.runway || ''
      })
      
      // Set status for existing keys
      const newStatus: Record<string, KeyStatus> = {}
      Object.entries(apiKeys).forEach(([key, value]) => {
        newStatus[key] = value ? 'valid' : 'idle'
      })
      setKeyStatus(newStatus)
    }
  }, [apiKeys])

  const handleUnlockApi = () => {
    if (apiPassword === API_SETTINGS_PASSWORD) {
      setIsApiUnlocked(true)
      setApiPasswordError('')
    } else {
      setApiPasswordError(txt.wrongPassword)
      setApiPassword('')
    }
  }

  // Real API key validation
  const validateApiKey = async (provider: string, key: string): Promise<boolean> => {
    if (!key || key.trim() === '') return false
    
    const validator = API_VALIDATORS[provider]
    if (!validator) return true // No validator, assume valid
    
    try {
      let url = validator.url
      let options: RequestInit = {
        method: validator.method,
        headers: validator.getHeaders(key),
      }
      
      // Special handling for different APIs
      if (provider === 'gemini') {
        url = `${validator.url}${key}`
      } else if (provider === 'tavily') {
        options.body = JSON.stringify({ api_key: key, query: 'test', max_results: 1 })
      } else if (provider === 'anthropic') {
        // For Anthropic, send a minimal test request
        options.body = validator.body
      }
      
      const response = await fetch(url, options)
      return validator.validateResponse(response)
    } catch (error) {
      console.error(`Validation error for ${provider}:`, error)
      return false
    }
  }

  const handleValidateKey = async (provider: string) => {
    const key = localKeys[provider as keyof typeof localKeys]
    if (!key) return
    
    setKeyStatus(prev => ({ ...prev, [provider]: 'checking' }))
    setKeyErrors(prev => ({ ...prev, [provider]: '' }))
    
    const isValid = await validateApiKey(provider, key)
    
    setKeyStatus(prev => ({ ...prev, [provider]: isValid ? 'valid' : 'invalid' }))
    if (!isValid) {
      setKeyErrors(prev => ({ ...prev, [provider]: txt.invalid }))
    }
  }

  const handleSaveKeys = async () => {
    setSaveStatus('saving')
    
    // Validate all non-empty keys before saving
    const keysToValidate = Object.entries(localKeys).filter(([_, value]) => value.trim() !== '')
    
    for (const [provider, key] of keysToValidate) {
      if (keyStatus[provider] !== 'valid') {
        setKeyStatus(prev => ({ ...prev, [provider]: 'checking' }))
        const isValid = await validateApiKey(provider, key)
        setKeyStatus(prev => ({ ...prev, [provider]: isValid ? 'valid' : 'invalid' }))
        if (!isValid) {
          setKeyErrors(prev => ({ ...prev, [provider]: txt.invalid }))
        }
      }
    }
    
    // Save to store (this persists to localStorage via zustand)
    setApiKeys(localKeys)
    
    await new Promise(r => setTimeout(r, 500))
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Test all API keys with detailed results
  const handleTestAllApis = async () => {
    const keysToTest = Object.entries(localKeys).filter(([_, value]) => value.trim() !== '')
    if (keysToTest.length === 0) return
    
    setShowTestAll(true)
    setTestAllStatus('testing')
    
    // Initialize all as pending
    const initialResults: Record<string, { status: 'pending' | 'testing' | 'success' | 'error'; message: string; latency?: number }> = {}
    keysToTest.forEach(([key]) => {
      initialResults[key] = { status: 'pending', message: '' }
    })
    setTestResults(initialResults)
    
    // Test each key sequentially
    for (const [provider, key] of keysToTest) {
      setTestResults(prev => ({
        ...prev,
        [provider]: { status: 'testing', message: '' }
      }))
      
      const startTime = Date.now()
      try {
        const isValid = await validateApiKey(provider, key)
        const latency = Date.now() - startTime
        setTestResults(prev => ({
          ...prev,
          [provider]: {
            status: isValid ? 'success' : 'error',
            message: isValid ? txt.testPassed : txt.testFailed,
            latency
          }
        }))
      } catch (error) {
        const latency = Date.now() - startTime
        setTestResults(prev => ({
          ...prev,
          [provider]: {
            status: 'error',
            message: txt.testFailed,
            latency
          }
        }))
      }
    }
    
    setTestAllStatus('done')
  }

  const handleExport = async () => {
    const data = {
      apiKeys: localKeys,
      theme,
      language,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `solveit-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const text = await file.text()
        try {
          const data = JSON.parse(text)
          if (data.apiKeys) setApiKeys(data.apiKeys)
          if (data.theme) setTheme(data.theme)
          if (data.language) setLanguage(data.language)
          alert('✅ Data imported successfully!')
        } catch {
          alert('❌ Invalid file format!')
        }
      }
    }
    input.click()
  }

  const handleReset = () => {
    if (confirm(txt.resetConfirm)) {
      safeStorage.clear()
      window.location.reload()
    }
  }

  const apiKeyFields = [
    { key: 'groq', label: txt.groq, placeholder: 'gsk_...', url: 'https://console.groq.com/keys', free: true, tier: 'FREE' },
    { key: 'gemini', label: txt.gemini, placeholder: 'AIza...', url: 'https://aistudio.google.com/app/apikey', free: true, tier: 'FREE' },
    { key: 'deepseek', label: txt.deepseek, placeholder: 'sk-...', url: 'https://platform.deepseek.com/api_keys', free: false, tier: 'CHEAP' },
    { key: 'openai', label: txt.openai, placeholder: 'sk-...', url: 'https://platform.openai.com/api-keys', free: false, tier: 'PAID' },
    { key: 'anthropic', label: txt.anthropic, placeholder: 'sk-ant-...', url: 'https://console.anthropic.com/settings/keys', free: false, tier: 'PAID' },
    { key: 'tavily', label: txt.tavily, placeholder: 'tvly-...', url: 'https://app.tavily.com/home', free: false, tier: 'SEARCH' },
    { key: 'stability', label: 'Stability AI', placeholder: 'sk-...', url: 'https://platform.stability.ai/account/keys', free: false, tier: 'IMAGE' },
    { key: 'replicate', label: 'Replicate (Flux)', placeholder: 'r8_...', url: 'https://replicate.com/account/api-tokens', free: false, tier: 'IMAGE' },
    { key: 'runway', label: 'Runway ML', placeholder: 'rw_...', url: 'https://app.runwayml.com/settings', free: false, tier: 'VIDEO' }
  ]

  // Count connected providers
  const connectedCount = Object.values(localKeys).filter(k => k.trim() !== '').length
  const validCount = Object.entries(keyStatus).filter(([k, v]) => v === 'valid' && localKeys[k as keyof typeof localKeys]).length

  return (
    <div className="h-full overflow-auto p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{txt.title}</h1>
          </div>
        </div>

        {/* Connection Status Dashboard */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold">{txt.dbStatus}</h2>
          </div>
          
          {connectedCount === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <WifiOff className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="font-medium text-yellow-400">{txt.noKeysWarning}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <Wifi className="w-5 h-5 text-green-400" />
              <div className="flex-1">
                <p className="font-medium text-green-400">{txt.connectedProviders}: {validCount}/{connectedCount}</p>
                <p className="text-sm text-zinc-400">{txt.dbReady}</p>
              </div>
              <div className="flex gap-2">
                {apiKeyFields.map(field => {
                  const hasKey = localKeys[field.key as keyof typeof localKeys]
                  const status = keyStatus[field.key]
                  if (!hasKey) return null
                  return (
                    <div
                      key={field.key}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        status === 'valid' ? 'bg-green-500/20 text-green-400' :
                        status === 'invalid' ? 'bg-red-500/20 text-red-400' :
                        'bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      {field.key.charAt(0).toUpperCase() + field.key.slice(1)}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* API Keys Section - PASSWORD PROTECTED */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold">{txt.apiKeys}</h2>
            {!isApiUnlocked && (
              <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                <Lock className="w-3 h-3" />
                {txt.locked}
              </span>
            )}
            {isApiUnlocked && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                <Shield className="w-3 h-3" />
                Unlocked
              </span>
            )}
          </div>

          {!isApiUnlocked ? (
            /* Password Entry */
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm">{txt.enterPassword}</p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="password"
                    value={apiPassword}
                    onChange={(e) => setApiPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlockApi()}
                    placeholder={txt.password}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleUnlockApi}
                  className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-medium flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {txt.unlock}
                </button>
              </div>
              {apiPasswordError && (
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <X className="w-4 h-4" />
                  {apiPasswordError}
                </p>
              )}
            </div>
          ) : (
            /* API Keys Form */
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm mb-4">{txt.apiKeysDesc}</p>
              {apiKeyFields.map(({ key, label, placeholder, url }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-300">{label}</label>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {txt.getKey} →
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showKeys[key] ? 'text' : 'password'}
                        value={localKeys[key as keyof typeof localKeys]}
                        onChange={(e) => {
                          setLocalKeys(prev => ({ ...prev, [key]: e.target.value }))
                          setKeyStatus(prev => ({ ...prev, [key]: 'idle' }))
                          setKeyErrors(prev => ({ ...prev, [key]: '' }))
                        }}
                        placeholder={placeholder}
                        className={`w-full px-4 py-3 bg-zinc-800 border rounded-lg focus:outline-none pr-12 ${
                          keyStatus[key] === 'valid' ? 'border-green-500' :
                          keyStatus[key] === 'invalid' ? 'border-red-500' :
                          'border-zinc-700 focus:border-blue-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey(key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showKeys[key] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <button
                      onClick={() => handleValidateKey(key)}
                      disabled={!localKeys[key as keyof typeof localKeys] || keyStatus[key] === 'checking'}
                      className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 min-w-[100px] justify-center ${
                        keyStatus[key] === 'valid' ? 'bg-green-600 text-white' :
                        keyStatus[key] === 'invalid' ? 'bg-red-600 text-white' :
                        keyStatus[key] === 'checking' ? 'bg-zinc-700 text-zinc-300' :
                        'bg-zinc-700 hover:bg-zinc-600 text-white'
                      }`}
                    >
                      {keyStatus[key] === 'checking' && <RefreshCw className="w-4 h-4 animate-spin" />}
                      {keyStatus[key] === 'valid' && <Check className="w-4 h-4" />}
                      {keyStatus[key] === 'invalid' && <X className="w-4 h-4" />}
                      {keyStatus[key] === 'checking' ? '...' :
                       keyStatus[key] === 'valid' ? txt.valid :
                       keyStatus[key] === 'invalid' ? txt.invalid :
                       txt.validate}
                    </button>
                  </div>
                  {keyErrors[key] && (
                    <p className="text-red-400 text-xs">{keyErrors[key]}</p>
                  )}
                </div>
              ))}
              <button
                onClick={handleSaveKeys}
                disabled={saveStatus === 'saving'}
                className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  saveStatus === 'saved'
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {saveStatus === 'saving' && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saveStatus === 'saved' && <Check className="w-5 h-5" />}
                {saveStatus === 'idle' ? txt.save : saveStatus === 'saving' ? txt.saving : txt.saved}
              </button>

              {/* Test All APIs Button */}
              <button
                onClick={handleTestAllApis}
                disabled={testAllStatus === 'testing' || connectedCount === 0}
                className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                  testAllStatus === 'done'
                    ? 'bg-green-600 text-white'
                    : testAllStatus === 'testing'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                }`}
              >
                {testAllStatus === 'testing' ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : testAllStatus === 'done' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Wifi className="w-5 h-5" />
                )}
                {testAllStatus === 'idle' ? txt.testAll : 
                 testAllStatus === 'testing' ? txt.testing : 
                 txt.testComplete}
              </button>

              {/* Test Results Panel */}
              {showTestAll && (
                <div className="mt-4 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      {txt.testAllDesc}
                    </h3>
                    <button
                      onClick={() => setShowTestAll(false)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(testResults).map(([provider, result]) => {
                      const field = apiKeyFields.find(f => f.key === provider)
                      return (
                        <div
                          key={provider}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            result.status === 'success' ? 'bg-green-500/10 border border-green-500/30' :
                            result.status === 'error' ? 'bg-red-500/10 border border-red-500/30' :
                            result.status === 'testing' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                            'bg-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {result.status === 'testing' && <RefreshCw className="w-4 h-4 animate-spin text-yellow-400" />}
                            {result.status === 'success' && <Check className="w-4 h-4 text-green-400" />}
                            {result.status === 'error' && <X className="w-4 h-4 text-red-400" />}
                            {result.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-zinc-500" />}
                            <span className="font-medium">{field?.label || provider}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            {result.latency && (
                              <span className="text-zinc-400">
                                {result.latency}ms
                              </span>
                            )}
                            <span className={
                              result.status === 'success' ? 'text-green-400' :
                              result.status === 'error' ? 'text-red-400' :
                              result.status === 'testing' ? 'text-yellow-400' :
                              'text-zinc-400'
                            }>
                              {result.message || (result.status === 'pending' ? '...' : result.status === 'testing' ? txt.testing : '')}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {testAllStatus === 'done' && (
                    <div className="mt-4 pt-4 border-t border-zinc-700 text-center">
                      <div className="text-lg font-medium">
                        {Object.values(testResults).filter(r => r.status === 'success').length}/{Object.keys(testResults).length} {txt.testPassed}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Matrix Toggle Button */}
              <button
                onClick={() => setShowMatrix(!showMatrix)}
                className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all"
              >
                <Zap className="w-5 h-5" />
                {showMatrix ? txt.hideMatrix : txt.viewMatrix}
              </button>

              {/* Cost/Quality Matrix */}
              {showMatrix && (
                <div className="mt-4 pt-4 border-t border-zinc-700">
                  <CostQualityMatrix apiKeys={localKeys} language={language} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Appearance */}
        <div className="bg-zinc-900 dark:bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold">{txt.appearance}</h2>
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">{txt.language}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-purple-500 focus:outline-none"
            >
              <option value="ar">{txt.arabic}</option>
              <option value="en">{txt.english}</option>
            </select>
          </div>

          {/* Theme Selection - 4 Themes */}
          <div className="mt-6">
            <label className="text-sm font-medium text-zinc-300 block mb-3">
              {language === 'ar' ? 'المظهر' : 'Theme'}
            </label>
            <ThemeSelector />
          </div>
        </div>

        {/* Deployment Tokens */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">{language === 'ar' ? 'توكنات النشر' : 'Deployment Tokens'}</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            {language === 'ar' 
              ? 'أضف توكنات Vercel و GitHub للنشر المباشر من Pro Builder'
              : 'Add your Vercel and GitHub tokens for one-click deployment from Pro Builder'}
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <span>▲</span> Vercel Token
              </label>
              <input
                type="password"
                placeholder="Enter Vercel token..."
                defaultValue={typeof window !== 'undefined' ? safeStorage.getItem('solveit_vercel_token') || '' : ''}
                onChange={(e) => safeStorage.setItem('solveit_vercel_token', e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <a 
                href="https://vercel.com/account/tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline"
              >
                {language === 'ar' ? 'احصل على التوكن من هنا' : 'Get your token here'} →
              </a>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <span>🐙</span> GitHub Token
              </label>
              <input
                type="password"
                placeholder="Enter GitHub token..."
                defaultValue={typeof window !== 'undefined' ? safeStorage.getItem('solveit_github_token') || '' : ''}
                onChange={(e) => safeStorage.setItem('solveit_github_token', e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-purple-500 focus:outline-none"
              />
              <a 
                href="https://github.com/settings/tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:underline"
              >
                {language === 'ar' ? 'احصل على التوكن من هنا (يحتاج repo scope)' : 'Get your token here (needs repo scope)'} →
              </a>
            </div>
          </div>
        </div>

                {/* Mobile QR Code */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg"><Smartphone className="w-5 h-5 text-purple-400" /></div>
            <h2 className="text-lg font-semibold">{language === "ar" ? "Mobile QR" : "Mobile Access"}</h2>
          </div>
          <div className="flex flex-col items-center gap-4">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`} alt="QR" className="w-48 h-48 rounded-lg bg-white p-2" />
          </div>
        </div>

{/* Data Management */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold">{txt.data}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5 text-green-400" />
              {txt.export}
            </button>
            <button
              onClick={handleImport}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
            >
              <Upload className="w-5 h-5 text-blue-400" />
              {txt.import}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              {txt.reset}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
