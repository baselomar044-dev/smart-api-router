'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import {
  GitBranch,
  Clock,
  User,
  MessageSquare,
  RotateCcw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Copy,
  Check
} from 'lucide-react'

// ============================================
// TYPES
// ============================================
interface Commit {
  id: string
  message: string
  author: string
  timestamp: Date
  hash: string
  changes: {
    added: number
    modified: number
    deleted: number
  }
}

interface VersionHistoryState {
  commits: Commit[]
  currentVersion: string
  canRollback: boolean
  error?: string
}

// ============================================
// VERSION HISTORY COMPONENT
// ============================================
export default function VersionHistory() {
  const { language } = useAppStore()
  const isRTL = language === 'ar'

  // State
  const [history, setHistory] = useState<VersionHistoryState>({
    commits: [],
    currentVersion: '1.0.0',
    canRollback: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Translations
  const t = {
    title: isRTL ? 'سجل الإصدارات' : 'Version History',
    currentVersion: isRTL ? 'الإصدار الحالي' : 'Current Version',
    commits: isRTL ? 'التزامات' : 'Commits',
    rollback: isRTL ? 'العودة للإصدار' : 'Rollback to this version',
    rolling: isRTL ? 'جاري الرجوع...' : 'Rolling back...',
    rollbackSuccess: isRTL ? 'تم الرجوع بنجاح' : 'Rolled back successfully',
    rollbackError: isRTL ? 'خطأ في الرجوع' : 'Rollback failed',
    author: isRTL ? 'المؤلف' : 'Author',
    timestamp: isRTL ? 'الوقت' : 'Time',
    changes: isRTL ? 'التغييرات' : 'Changes',
    added: isRTL ? 'مضاف' : 'Added',
    modified: isRTL ? 'معدل' : 'Modified',
    deleted: isRTL ? 'محذوف' : 'Deleted',
    message: isRTL ? 'الرسالة' : 'Message',
    hash: isRTL ? 'الهاش' : 'Hash',
    copy: isRTL ? 'نسخ' : 'Copy',
    copied: isRTL ? 'تم النسخ' : 'Copied!',
    view: isRTL ? 'عرض التفاصيل' : 'View Details',
    noCommits: isRTL ? 'لا توجد التزامات بعد' : 'No commits yet',
    loadingError: isRTL ? 'خطأ في تحميل السجل' : 'Failed to load history'
  }

  // ============================================
  // LOAD HISTORY
  // ============================================
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/version-control', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          setHistory({
            commits: data.commits || [],
            currentVersion: data.currentVersion || '1.0.0',
            canRollback: data.canRollback !== false
          })
        } else {
          setError(data.error || t.loadingError)
        }
      } catch (err: any) {
        console.error('Load history error:', err)
        setError(err.message || t.loadingError)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [t.loadingError])

  // ============================================
  // ROLLBACK
  // ============================================
  const handleRollback = async (commitHash: string) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من الرجوع لهذا الإصدار؟' : 'Are you sure you want to rollback to this version?')) {
      return
    }

    setIsRollingBack(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/version-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rollback',
          commitHash
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setSuccessMessage(t.rollbackSuccess)
        setSelectedCommit(null)
        // Reload history
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setError(data.error || t.rollbackError)
      }
    } catch (err: any) {
      console.error('Rollback error:', err)
      setError(err.message || t.rollbackError)
    } finally {
      setIsRollingBack(false)
    }
  }

  // ============================================
  // COPY HASH
  // ============================================
  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={`w-full max-w-4xl mx-auto p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-5 h-5 text-purple-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.title}
          </h2>
        </div>

        {/* Current Version */}
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-purple-900 dark:text-purple-300">
              {t.currentVersion}
            </span>
            <code className="text-lg font-semibold text-purple-600 dark:text-purple-400">
              v{history.currentVersion}
            </code>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : history.commits.length > 0 ? (
        /* Commits Timeline */
        <div className="space-y-3">
          {history.commits.map((commit, index) => (
            <div
              key={commit.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition"
            >
              {/* Commit Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  index === 0 ? 'bg-purple-100 dark:bg-purple-900' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <GitBranch className={`w-4 h-4 ${
                    index === 0 ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {commit.message}
                    </h3>
                    {index === 0 && (
                      <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                        {isRTL ? 'الأحدث' : 'Latest'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      <span>{commit.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{commit.timestamp.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Hash */}
                  <div className="flex items-center gap-2 mb-3">
                    <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                      {commit.hash.substring(0, 8)}
                    </code>
                    <button
                      onClick={() => copyHash(commit.hash)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-500" />
                      )}
                    </button>
                  </div>

                  {/* Changes */}
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-600 dark:text-green-400">
                      +{commit.changes.added}
                    </span>
                    <span className="text-orange-600 dark:text-orange-400">
                      ~{commit.changes.modified}
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      -{commit.changes.deleted}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expand Details */}
              {selectedCommit === commit.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>{t.hash}:</strong>
                    </p>
                    <code className="text-xs text-gray-700 dark:text-gray-300 break-all">
                      {commit.hash}
                    </code>
                  </div>

                  {history.canRollback && index > 0 && (
                    <button
                      onClick={() => handleRollback(commit.hash)}
                      disabled={isRollingBack}
                      className="w-full px-3 py-2 bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 disabled:bg-gray-200 dark:disabled:bg-gray-700 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2"
                    >
                      {isRollingBack ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {t.rolling}
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3 h-3" />
                          {t.rollback}
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* View Button */}
              <button
                onClick={() => setSelectedCommit(selectedCommit === commit.id ? null : commit.id)}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline mt-2"
              >
                {selectedCommit === commit.id ? (
                  isRTL ? 'إخفاء التفاصيل' : 'Hide details'
                ) : (
                  `${t.view} >`
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* No Commits */
        <div className="text-center py-12">
          <GitBranch className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{t.noCommits}</p>
        </div>
      )}
    </div>
  )
}
