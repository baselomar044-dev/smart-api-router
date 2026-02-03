'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { 
  Search, 
  Loader2, 
  ExternalLink, 
  Copy, 
  Check,
  AlertCircle,
  Globe,
  Sparkles
} from 'lucide-react'

// ============================================
// TYPES
// ============================================
interface SearchResult {
  title: string
  url: string
  description: string
  source: string
  date?: string
}

interface SearchResponse {
  success: boolean
  results: SearchResult[]
  error?: string
}

// ============================================
// SEARCH AGENT COMPONENT
// ============================================
export default function SearchAgent() {
  const { language, apiKeys } = useAppStore()
  const isRTL = language === 'ar'

  // State
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [aiAnswer, setAiAnswer] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [searchMode, setSearchMode] = useState<'ai' | 'tavily'>('ai')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [noResults, setNoResults] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  // Translations
  const t = {
    title: isRTL ? 'بحث الويب الذكي' : 'AI Web Search',
    placeholder: isRTL ? 'اسأل أي شيء...' : 'Ask anything...',
    search: isRTL ? 'بحث' : 'Search',
    searching: isRTL ? 'جاري البحث...' : 'Searching...',
    noApiKey: isRTL ? 'يرجى إضافة مفتاح AI في الإعدادات' : 'Please add an AI key in settings',
    aiMode: isRTL ? 'بحث AI (مجاني)' : 'AI Search (Free)',
    tavilyMode: isRTL ? 'Tavily (متقدم)' : 'Tavily (Advanced)',
    noResults: isRTL ? 'لم يتم العثور على نتائج' : 'No results found',
    error: isRTL ? 'حدث خطأ في البحث' : 'Search error',
    openInBrowser: isRTL ? 'فتح في المتصفح' : 'Open in browser',
    copied: isRTL ? 'تم النسخ' : 'Copied!',
    copy: isRTL ? 'نسخ الرابط' : 'Copy link',
    aiAnswer: isRTL ? 'إجابة AI' : 'AI Answer',
  }

  // Get available AI key
  const getAvailableAIKey = () => {
    if (apiKeys.gemini) return { provider: 'gemini', key: apiKeys.gemini }
    if (apiKeys.groq) return { provider: 'groq', key: apiKeys.groq }
    if (apiKeys.openai) return { provider: 'openai', key: apiKeys.openai }
    if (apiKeys.claude) return { provider: 'claude', key: apiKeys.claude }
    return null
  }

  // ============================================
  // PERFORM AI SEARCH (FREE - uses existing AI keys)
  // ============================================
  const handleAISearch = async () => {
    const aiKey = getAvailableAIKey()
    if (!aiKey) {
      setError(t.noApiKey)
      return
    }

    setIsLoading(true)
    setError(null)
    setResults([])
    setAiAnswer('')
    setNoResults(false)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a helpful search assistant. Answer questions concisely and accurately. 
              Format your response as JSON with this structure:
              {
                "answer": "Your detailed answer here",
                "sources": [
                  {"title": "Source title", "url": "https://...", "description": "Brief description"}
                ]
              }
              If you don't know, say so. Always try to provide helpful information.`
            },
            {
              role: 'user', 
              content: query
            }
          ],
          apiKeys: {
            groq: apiKeys.groq || '',
            gemini: apiKeys.gemini || '',
            openai: apiKeys.openai || '',
            claude: apiKeys.claude || '',
          },
          taskType: 'complex'
        })
      })

      if (!response.ok) throw new Error('Search failed')
      
      const data = await response.json()
      const content = data.content || data.message || ''
      
      // Try to parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          setAiAnswer(parsed.answer || content)
          if (parsed.sources && Array.isArray(parsed.sources)) {
            setResults(parsed.sources.map((s: any) => ({
              title: s.title || 'Source',
              url: s.url || '#',
              description: s.description || '',
              source: new URL(s.url || 'https://example.com').hostname
            })))
          }
        } else {
          setAiAnswer(content)
        }
      } catch {
        setAiAnswer(content)
      }
      
      if (!aiAnswer && results.length === 0) {
        setAiAnswer(content)
      }
    } catch (err: any) {
      setError(err.message || t.error)
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================
  // PERFORM TAVILY SEARCH (Requires API key)
  // ============================================
  const handleTavilySearch = async () => {
    if (!apiKeys.tavily) {
      setError(isRTL ? 'يرجى إضافة مفتاح Tavily في الإعدادات' : 'Please add Tavily API key in settings')
      return
    }

    setIsLoading(true)
    setError(null)
    setResults([])
    setAiAnswer('')
    setNoResults(false)

    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          apiKey: apiKeys.tavily,
          options: {
            maxResults: 8,
            searchDepth: 'advanced'
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: SearchResponse = await response.json()

      if (data.success && data.results.length > 0) {
        setResults(data.results)
      } else if (data.results.length === 0) {
        setNoResults(true)
      } else if (data.error) {
        setError(data.error)
      }
    } catch (err: any) {
      console.error('Search error:', err)
      setError(err.message || t.error)
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================
  // COPY LINK
  // ============================================
  const copyLink = (url: string, index: number) => {
    navigator.clipboard.writeText(url)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Handle search based on mode
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    if (searchMode === 'ai') {
      handleAISearch()
    } else {
      handleTavilySearch()
    }
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={`w-full max-w-4xl mx-auto p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-5 h-5 text-blue-500" />
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {t.title}
          </h2>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2 mb-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1 px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-400 text-white rounded-lg font-medium transition flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.searching}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                {t.search}
              </>
            )}
          </button>
        </div>

        {/* Search Mode Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSearchMode('ai')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              searchMode === 'ai'
                ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-2 border-purple-500'
                : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {t.aiMode}
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('tavily')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              searchMode === 'tavily'
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-2 border-blue-500'
                : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <Globe className="w-4 h-4" />
            {t.tavilyMode}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
              {t.error}
            </h3>
            <p className="text-red-800 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* AI Answer */}
      {aiAnswer && (
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-purple-900 dark:text-purple-300">
              {t.aiAnswer}
            </h3>
          </div>
          <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
            {aiAnswer}
          </p>
        </div>
      )}

      {/* No Results */}
      {noResults && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">{t.noResults}</p>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:shadow-md transition bg-white dark:bg-zinc-800/50"
            >
              {/* Title and Source */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
                    {result.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                    <Globe className="w-3 h-3" />
                    <span>{result.source}</span>
                  </div>
                </div>
                <button
                  onClick={() => copyLink(result.url, index)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition"
                  title={t.copy}
                >
                  {copiedIndex === index ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-zinc-500" />
                  )}
                </button>
              </div>

              {/* Description */}
              <p className="text-zinc-700 dark:text-zinc-300 text-sm mb-3 leading-relaxed">
                {result.description}
              </p>

              {/* URL and Open Button */}
              {result.url && result.url !== '#' && (
                <div className="flex items-center justify-between">
                  <code className="text-xs text-zinc-500 dark:text-zinc-400 break-all bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded max-w-[80%] truncate">
                    {result.url}
                  </code>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition"
                    title={t.openInBrowser}
                  >
                    <ExternalLink className="w-4 h-4 text-blue-500" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && results.length === 0 && !aiAnswer && !error && !noResults && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">
            {isRTL ? 'ابدأ البحث لرؤية النتائج' : 'Start searching to see results'}
          </p>
        </div>
      )}
    </div>
  )
}
