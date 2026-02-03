'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import {
  Package,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Search,
  Loader2,
  Star,
  User,
  Calendar,
  ExternalLink,
  Code,
  Settings
} from 'lucide-react'

// ============================================
// TYPES
// ============================================
interface Plugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  rating: number
  downloads: number
  lastUpdated: string
  installed: boolean
  category: string
  icon?: string
  repository?: string
}

// ============================================
// PLUGIN MANAGER COMPONENT
// ============================================
export default function PluginManager() {
  const { language } = useAppStore()
  const isRTL = language === 'ar'

  // State
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [installedPlugins, setInstalledPlugins] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [error, setError] = useState<string | null>(null)
  const [installing, setInstalling] = useState<string | null>(null)

  // Translations
  const t = {
    title: isRTL ? 'مدير المكونات الإضافية' : 'Plugin Manager',
    search: isRTL ? 'ابحث عن المكونات...' : 'Search plugins...',
    category: isRTL ? 'الفئة' : 'Category',
    all: isRTL ? 'الكل' : 'All',
    installed: isRTL ? 'مثبت' : 'Installed',
    install: isRTL ? 'تثبيت' : 'Install',
    uninstall: isRTL ? 'إزالة' : 'Uninstall',
    version: isRTL ? 'الإصدار' : 'Version',
    author: isRTL ? 'المؤلف' : 'Author',
    downloads: isRTL ? 'التنزيلات' : 'Downloads',
    rating: isRTL ? 'التقييم' : 'Rating',
    lastUpdated: isRTL ? 'آخر تحديث' : 'Last Updated',
    noPlugins: isRTL ? 'لم يتم العثور على مكونات' : 'No plugins found',
    error: isRTL ? 'خطأ في تحميل المكونات' : 'Error loading plugins',
    installing: isRTL ? 'جاري التثبيت...' : 'Installing...'
  }

  const categories = [
    { id: 'all', name: t.all },
    { id: 'tools', name: isRTL ? 'أدوات' : 'Tools' },
    { id: 'integrations', name: isRTL ? 'تكاملات' : 'Integrations' },
    { id: 'themes', name: isRTL ? 'المظاهر' : 'Themes' },
    { id: 'analytics', name: isRTL ? 'التحليلات' : 'Analytics' }
  ]

  // ============================================
  // LOAD PLUGINS
  // ============================================
  useEffect(() => {
    const loadPlugins = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/plugins', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        if (data.success && data.plugins) {
          setPlugins(data.plugins)
          setInstalledPlugins(data.installed || [])
        } else {
          setError(data.error || t.error)
        }
      } catch (err: any) {
        console.error('Load plugins error:', err)
        setError(err.message || t.error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPlugins()
  }, [t.error])

  // ============================================
  // INSTALL PLUGIN
  // ============================================
  const installPlugin = async (pluginId: string) => {
    setInstalling(pluginId)
    setError(null)

    try {
      const response = await fetch('/api/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'install',
          pluginId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setInstalledPlugins([...installedPlugins, pluginId])
      } else {
        setError(data.error)
      }
    } catch (err: any) {
      console.error('Install plugin error:', err)
      setError(err.message)
    } finally {
      setInstalling(null)
    }
  }

  // ============================================
  // UNINSTALL PLUGIN
  // ============================================
  const uninstallPlugin = async (pluginId: string) => {
    setInstalling(pluginId)
    setError(null)

    try {
      const response = await fetch('/api/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'uninstall',
          pluginId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setInstalledPlugins(installedPlugins.filter((id) => id !== pluginId))
      } else {
        setError(data.error)
      }
    } catch (err: any) {
      console.error('Uninstall plugin error:', err)
      setError(err.message)
    } finally {
      setInstalling(null)
    }
  }

  // ============================================
  // FILTER PLUGINS
  // ============================================
  const filteredPlugins = plugins.filter((plugin) => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={`w-full max-w-6xl mx-auto p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-green-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.title}
          </h2>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : filteredPlugins.length > 0 ? (
        /* Plugin Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlugins.map((plugin) => {
            const isInstalled = installedPlugins.includes(plugin.id)
            const isInstallingThis = installing === plugin.id

            return (
              <div
                key={plugin.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {plugin.name}
                    </h3>
                    <p className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded w-fit">
                      {plugin.category}
                    </p>
                  </div>
                  {isInstalled && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {plugin.description}
                </p>

                {/* Metadata */}
                <div className="space-y-2 mb-4 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    <span>{plugin.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-3 h-3" />
                    <span>{plugin.rating} / 5</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="w-3 h-3" />
                    <span>{plugin.downloads.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(plugin.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Version */}
                <div className="mb-4">
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    v{plugin.version}
                  </code>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {isInstalled ? (
                    <>
                      <button
                        onClick={() => uninstallPlugin(plugin.id)}
                        disabled={isInstallingThis}
                        className="flex-1 px-3 py-2 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 disabled:bg-gray-200 dark:disabled:bg-gray-700 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                      >
                        {isInstallingThis ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        {t.uninstall}
                      </button>
                      {plugin.repository && (
                        <a
                          href={plugin.repository}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
                        >
                          <Code className="w-4 h-4" />
                        </a>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => installPlugin(plugin.id)}
                      disabled={isInstallingThis}
                      className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                    >
                      {isInstallingThis ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {t.installing}
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3" />
                          {t.install}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* No Results */
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{t.noPlugins}</p>
        </div>
      )}
    </div>
  )
}
