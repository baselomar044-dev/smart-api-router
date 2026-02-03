'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import {
  Image as ImageIcon,
  Video,
  Loader2,
  Download,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Settings2,
  Eye,
  Clock,
  Wand2,
  RefreshCw,
  History,
  X,
  ChevronDown,
  Info,
  FileAudio,
  Volume2,
  Upload,
  Play,
  Pause
} from 'lucide-react'

// ============================================
// TYPES
// ============================================
interface MediaGenerationResult {
  id: string
  url: string
  provider: string
  timestamp: Date
  prompt: string
  type: 'image' | 'video'
  settings: Record<string, any>
}

interface ProviderConfig {
  id: string
  name: string
  apiKeyField: 'openai' | 'gemini' | 'groq' | 'anthropic' | 'deepseek' | 'stability' | 'replicate' | 'runway' | 'pika' | 'none'
  models?: string[]
  description: string
  available: boolean
}

// ============================================
// PROVIDER CONFIGURATIONS
// ============================================
// Pollinations is FREE - no API key needed!
const IMAGE_PROVIDERS: ProviderConfig[] = [
  { 
    id: 'pollinations', 
    name: '🆓 Pollinations (FREE)', 
    apiKeyField: 'none',
    models: ['flux', 'flux-realism', 'flux-anime', 'flux-3d', 'turbo'],
    description: 'FREE! No API key required',
    available: true
  },
  { 
    id: 'dalle', 
    name: 'DALL-E 3', 
    apiKeyField: 'openai',
    models: ['dall-e-3', 'dall-e-2'],
    description: 'Uses your OpenAI API key',
    available: true
  },
  { 
    id: 'gemini', 
    name: 'Gemini (Imagen 3)', 
    apiKeyField: 'gemini',
    models: ['imagen-3.0-generate-002'],
    description: 'Uses your Gemini API key',
    available: true
  }
]

// Video generation - uses existing API keys when possible
const VIDEO_PROVIDERS: ProviderConfig[] = [
  { 
    id: 'gemini', 
    name: 'Gemini Veo', 
    apiKeyField: 'gemini',
    description: 'Uses your Gemini API key (when available)',
    available: true
  },
  { 
    id: 'openai', 
    name: 'OpenAI Sora', 
    apiKeyField: 'openai',
    description: 'Uses your OpenAI API key (when available)',
    available: true
  }
]

const IMAGE_SIZES = [
  { value: '256x256', label: '256×256', aspect: 'Square (Small)' },
  { value: '512x512', label: '512×512', aspect: 'Square (Medium)' },
  { value: '1024x1024', label: '1024×1024', aspect: 'Square (Large)' },
  { value: '1792x1024', label: '1792×1024', aspect: 'Landscape (16:9)' },
  { value: '1024x1792', label: '1024×1792', aspect: 'Portrait (9:16)' }
]

const STYLE_PRESETS = [
  { id: 'none', name: 'None', prompt: '' },
  { id: 'photorealistic', name: 'Photorealistic', prompt: ', photorealistic, high detail, 8k, professional photography' },
  { id: 'anime', name: 'Anime', prompt: ', anime style, vibrant colors, detailed illustration' },
  { id: 'digital-art', name: 'Digital Art', prompt: ', digital art, detailed illustration, trending on artstation' },
  { id: 'oil-painting', name: 'Oil Painting', prompt: ', oil painting style, textured brush strokes, classical art' },
  { id: '3d-render', name: '3D Render', prompt: ', 3D render, octane render, high detail, photorealistic lighting' },
  { id: 'watercolor', name: 'Watercolor', prompt: ', watercolor painting, soft colors, artistic, traditional media' },
  { id: 'pixel-art', name: 'Pixel Art', prompt: ', pixel art, retro game style, 16-bit, detailed sprites' }
]

// ============================================
// MEDIA GENERATOR COMPONENT
// ============================================
export default function MediaGeneratorFixed() {
  const { language, apiKeys } = useAppStore()
  const isRTL = language === 'ar'

  // State
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'voice'>('image')
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MediaGenerationResult | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [history, setHistory] = useState<MediaGenerationResult[]>([])
  const [showHistory, setShowHistory] = useState(false)
  
  // Image settings
  const [imageSize, setImageSize] = useState('1024x1024')
  const [imageProvider, setImageProvider] = useState('pollinations')
  const [stylePreset, setStylePreset] = useState('none')
  const [imageQuality, setImageQuality] = useState(85)
  
  // Video settings
  const [videoDuration, setVideoDuration] = useState(5)
  const [videoProvider, setVideoProvider] = useState('gemini')
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9')
  const [sourceImage, setSourceImage] = useState('')
  
  // Voice/MP3 settings - Using Web Speech API with recording
  const [voiceText, setVoiceText] = useState('')
  const [voiceLanguage, setVoiceLanguage] = useState<'english' | 'arabic'>('english')
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [voiceSpeed, setVoiceSpeed] = useState(1)
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || []
      setAvailableVoices(voices)
    }
    
    loadVoices()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])
  
  // Filter voices by language
  const filteredVoices = availableVoices.filter(v => 
    voiceLanguage === 'english' 
      ? v.lang.startsWith('en') 
      : v.lang.startsWith('ar')
  )
  
  // Handle PDF/TXT file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsLoading(true)
    try {
      let text = ""
      if (file.type === "application/pdf") {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js"
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map((item: any) => item.str).join(" ")
          text += pageText + "\n"
        }
      } else {
        text = await file.text()
      }
      setVoiceText(text.slice(0, 5000))
      if (text.length > 5000) {
        setError(isRTL ? 'تم اقتصاص النص إلى 5000 حرف' : 'Text trimmed to 5000 characters')
      }
    } catch (err) {
      setError(isRTL ? 'فشل في قراءة الملف' : 'Failed to read file')
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }
  
  // Preview with Web Speech API
  const previewVoice = () => {
    if (!voiceText.trim() || typeof window === 'undefined') return
    
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(voiceText.slice(0, 500))
    utterance.rate = voiceSpeed
    utterance.lang = voiceLanguage === 'arabic' ? 'ar-SA' : 'en-US'
    
    if (filteredVoices[selectedVoiceIndex]) {
      utterance.voice = filteredVoices[selectedVoiceIndex]
    }
    
    utterance.onend = () => setIsPlaying(false)
    setIsPlaying(true)
    window.speechSynthesis.speak(utterance)
  }
  
  // Stop preview
  const stopPreview = () => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
  }
  
  // Convert using our API route (bypasses CORS)
  const convertToMp3 = async () => {
    if (!voiceText.trim()) {
      setError(isRTL ? 'الرجاء إدخال نص' : 'Please enter some text')
      return
    }

    setIsConverting(true)
    setError(null)
    
    // Revoke old URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setAudioBlob(null)

    try {
      const lang = voiceLanguage === 'arabic' ? 'ar' : 'en'
      
      // Use our API route to bypass CORS
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: voiceText.slice(0, 500), // Limit text
          lang 
        })
      })
      
      if (!response.ok) {
        throw new Error('TTS API Error')
      }
      
      const blob = await response.blob()
      
      if (blob.size < 100) {
        throw new Error('Empty audio')
      }
      
      setAudioBlob(blob)
      const objectUrl = URL.createObjectURL(blob)
      setAudioUrl(objectUrl)
      
    } catch (err) {
      console.error('TTS Error:', err)
      setError(isRTL 
        ? 'فشل التحويل. جرب نص أقصر أو استخدم المعاينة.' 
        : 'Conversion failed. Try shorter text or use Preview.')
    } finally {
      setIsConverting(false)
    }
  }
  
  // Toggle play/pause for converted audio
  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) {
      // If no converted audio, use preview
      if (isPlaying) {
        stopPreview()
      } else {
        previewVoice()
      }
      return
    }
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  // Download MP3
  const downloadMp3 = () => {
    if (!audioBlob) return
    
    const url = URL.createObjectURL(audioBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audio_${Date.now()}.mp3`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handle language change
  const handleVoiceLanguageChange = (lang: 'english' | 'arabic') => {
    setVoiceLanguage(lang)
    setSelectedVoiceIndex(0)
  }

  // Translations
  const t = {
    title: isRTL ? 'مولّد الوسائط الذكي' : 'AI Media Generator',
    subtitle: isRTL ? 'أنشئ صور وفيديوهات مذهلة بالذكاء الاصطناعي' : 'Create stunning images & videos with AI',
    imageTab: isRTL ? 'توليد صور' : 'Image Generation',
    videoTab: isRTL ? 'توليد فيديو' : 'Video Generation',
    voiceTab: isRTL ? 'نص إلى MP3' : 'Text to MP3',
    voiceSubtitle: isRTL ? 'حول النص أو PDF إلى ملف صوتي MP3 قابل للتحميل' : 'Convert text or PDF to downloadable MP3 audio file',
    uploadPdf: isRTL ? 'رفع PDF أو نص' : 'Upload PDF or Text',
    voiceSelect: isRTL ? 'اختر الصوت' : 'Select Voice',
    convertToMp3: isRTL ? 'حوّل إلى MP3' : 'Convert to MP3',
    converting: isRTL ? 'جاري التحويل...' : 'Converting...',
    downloadMp3: isRTL ? 'تحميل MP3' : 'Download MP3',
    readyToDownload: isRTL ? 'جاهز للتحميل!' : 'Ready to Download!',
    clickDownload: isRTL ? 'اضغط تحميل للحصول على ملف MP3' : 'Click download to get your MP3 file',
    enterText: isRTL ? 'اكتب النص هنا أو ارفع ملف PDF/TXT...' : 'Enter text here or upload PDF/TXT file...',
    prompt: isRTL ? 'اكتب وصف ما تريده...' : 'Describe what you want to create...',
    negativePrompt: isRTL ? 'ما لا تريده في الصورة' : 'What to avoid (negative prompt)',
    generate: isRTL ? 'توليد' : 'Generate',
    generating: isRTL ? 'جاري التوليد...' : 'Generating...',
    regenerate: isRTL ? 'إعادة التوليد' : 'Regenerate',
    noApiKey: isRTL ? 'لم يتم تكوين مفتاح API' : 'API key not configured',
    configureApiKey: isRTL ? 'أضف مفتاح API في الإعدادات' : 'Add API key in Settings',
    size: isRTL ? 'الحجم' : 'Size',
    quality: isRTL ? 'الجودة' : 'Quality',
    duration: isRTL ? 'المدة (ثواني)' : 'Duration (seconds)',
    provider: isRTL ? 'المزود' : 'Provider',
    style: isRTL ? 'النمط' : 'Style Preset',
    aspectRatio: isRTL ? 'نسبة العرض' : 'Aspect Ratio',
    sourceImage: isRTL ? 'صورة مصدر (اختياري)' : 'Source Image (optional)',
    download: isRTL ? 'تحميل' : 'Download',
    copy: isRTL ? 'نسخ الرابط' : 'Copy URL',
    copied: isRTL ? 'تم النسخ' : 'Copied!',
    error: isRTL ? 'خطأ في التوليد' : 'Generation Error',
    generatedAt: isRTL ? 'تم التوليد في' : 'Generated at',
    advanced: isRTL ? 'إعدادات متقدمة' : 'Advanced Settings',
    history: isRTL ? 'السجل' : 'History',
    clearHistory: isRTL ? 'مسح السجل' : 'Clear History',
    emptyPrompt: isRTL ? 'اكتب وصف وابدأ التوليد' : 'Write a prompt and start generating'
  }

  // Get API key for selected provider
  const getApiKey = (providerId: string): string | null => {
    const providers = activeTab === 'image' ? IMAGE_PROVIDERS : VIDEO_PROVIDERS
    const provider = providers.find(p => p.id === providerId)
    if (!provider) return null
    return apiKeys[provider.apiKeyField as keyof typeof apiKeys] || null
  }

  // Get current provider config
  const getCurrentProvider = () => {
    const providers = activeTab === 'image' ? IMAGE_PROVIDERS : VIDEO_PROVIDERS
    const providerId = activeTab === 'image' ? imageProvider : videoProvider
    return providers.find(p => p.id === providerId)
  }

  // ============================================
  // GENERATE IMAGE
  // ============================================
  const generateImage = async () => {
    if (!prompt.trim()) {
      setError(t.emptyPrompt)
      return
    }

    const apiKey = getApiKey(imageProvider)
    // Pollinations is FREE - no API key needed!
    if (!apiKey && imageProvider !== 'pollinations') {
      setError(`${t.noApiKey} (${getCurrentProvider()?.name}). ${t.configureApiKey}`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Apply style preset to prompt
      const stylePrompt = STYLE_PRESETS.find(s => s.id === stylePreset)?.prompt || ''
      const fullPrompt = prompt.trim() + stylePrompt

      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: imageProvider,
          apiKey: apiKey || 'free', // Pollinations doesn't need a key
          prompt: fullPrompt,
          negativePrompt: negativePrompt.trim() || undefined,
          size: imageSize,
          quality: imageQuality
        })
      })

      const data = await response.json()

      if (data.success && data.url) {
        const newResult: MediaGenerationResult = {
          id: crypto.randomUUID(),
          url: data.url,
          provider: imageProvider,
          timestamp: new Date(),
          prompt: prompt.trim(),
          type: 'image',
          settings: { size: imageSize, quality: imageQuality, style: stylePreset }
        }
        setResult(newResult)
        setHistory(prev => [newResult, ...prev].slice(0, 20)) // Keep last 20
      } else {
        setError(data.error || t.error)
      }
    } catch (err: any) {
      console.error('Image generation error:', err)
      setError(err.message || t.error)
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================
  // GENERATE VIDEO
  // ============================================
  const generateVideo = async () => {
    if (!prompt.trim() && !sourceImage) {
      setError(t.emptyPrompt)
      return
    }

    const apiKey = getApiKey(videoProvider)
    if (!apiKey) {
      setError(`${t.noApiKey} (${getCurrentProvider()?.name}). ${t.configureApiKey}`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: videoProvider,
          apiKey,
          prompt: prompt.trim(),
          imageUrl: sourceImage || undefined,
          duration: Math.min(videoDuration, 60),
          aspectRatio: videoAspectRatio
        })
      })

      const data = await response.json()

      if (data.success && data.url) {
        const newResult: MediaGenerationResult = {
          id: crypto.randomUUID(),
          url: data.url,
          provider: videoProvider,
          timestamp: new Date(),
          prompt: prompt.trim(),
          type: 'video',
          settings: { duration: videoDuration, aspectRatio: videoAspectRatio }
        }
        setResult(newResult)
        setHistory(prev => [newResult, ...prev].slice(0, 20))
      } else {
        setError(data.error || t.error)
      }
    } catch (err: any) {
      console.error('Video generation error:', err)
      setError(err.message || t.error)
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================
  // UTILITIES
  // ============================================
  const copyUrl = () => {
    if (result?.url) {
      navigator.clipboard.writeText(result.url)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    }
  }

  const downloadMedia = async () => {
    if (result?.url) {
      try {
        // Fetch the image/video as blob to handle cross-origin
        const response = await fetch(result.url)
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = `${result.type}-${Date.now()}.${result.type === 'image' ? 'png' : 'mp4'}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up
        URL.revokeObjectURL(blobUrl)
      } catch (error) {
        // Fallback: open in new tab
        console.error('Download failed:', error)
        window.open(result.url, '_blank')
      }
    }
  }

  const loadFromHistory = (item: MediaGenerationResult) => {
    setResult(item)
    setPrompt(item.prompt)
    setActiveTab(item.type)
    setShowHistory(false)
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={`w-full max-w-6xl mx-auto p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.subtitle}</p>
            </div>
          </div>
          
          {/* History Button */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <History className="w-4 h-4" />
            {t.history} ({history.length})
          </button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && history.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">{t.history}</h3>
            <button
              onClick={() => setHistory([])}
              className="text-sm text-red-500 hover:text-red-600"
            >
              {t.clearHistory}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {history.map(item => (
              <button
                key={item.id}
                onClick={() => loadFromHistory(item)}
                className="relative group aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700"
              >
                {item.type === 'image' ? (
                  <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
                ) : (
                  <video src={item.url} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div className="absolute top-1 right-1">
                  {item.type === 'image' ? (
                    <ImageIcon className="w-3 h-3 text-white drop-shadow" />
                  ) : (
                    <Video className="w-3 h-3 text-white drop-shadow" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'image'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          {t.imageTab}
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'video'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Video className="w-4 h-4" />
          {t.videoTab}
        </button>
        <button
          onClick={() => setActiveTab('voice')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'voice'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileAudio className="w-4 h-4" />
          {t.voiceTab}
        </button>
      </div>

      {/* Main Content */}
      {activeTab === 'voice' ? (
        /* ============================================ */
        /* TEXT TO SPEECH TAB - Using Web Speech API   */
        /* ============================================ */
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex gap-3">
            <Volume2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-300">{t.voiceSubtitle}</p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                ✨ {isRTL ? 'مجاني 100% - يستخدم أصوات المتصفح' : '100% Free - Uses Browser Voices'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Text Input */}
            <div className="space-y-4">
              {/* Language Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleVoiceLanguageChange('english')}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    voiceLanguage === 'english'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  🇺🇸 English
                </button>
                <button
                  onClick={() => handleVoiceLanguageChange('arabic')}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    voiceLanguage === 'arabic'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  🇸🇦 العربية
                </button>
              </div>

              {/* Upload PDF/TXT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'رفع ملف PDF أو نصي' : 'Upload PDF or Text File'}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 dark:hover:border-purple-400 transition flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <Upload className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    📄 {isRTL ? 'رفع ملف PDF/TXT' : 'Upload PDF/TXT File'}
                  </span>
                </button>
              </div>

              {/* Text Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'النص' : 'Text'}
                </label>
                <textarea
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value.slice(0, 5000))}
                  placeholder={t.enterText}
                  maxLength={5000}
                  dir={voiceLanguage === 'arabic' ? 'rtl' : 'ltr'}
                  className="w-full h-64 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{voiceText.length}/5000 {isRTL ? 'حرف' : 'characters'}</span>
                  <span>{voiceText.split(/\s+/).filter(Boolean).length} {isRTL ? 'كلمة' : 'words'}</span>
                </div>
              </div>
            </div>

            {/* Right Panel - Voice Controls & Output */}
            <div className="space-y-4">
              {/* Voice Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.voiceSelect} {filteredVoices.length === 0 && `(${isRTL ? 'جاري التحميل...' : 'Loading...'})`}
                </label>
                <select
                  value={selectedVoiceIndex}
                  onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={filteredVoices.length === 0}
                >
                  {filteredVoices.length > 0 ? (
                    filteredVoices.map((v, i) => (
                      <option key={i} value={i}>
                        {v.name}
                      </option>
                    ))
                  ) : (
                    <option value={0}>
                      {isRTL ? 'الصوت الافتراضي' : 'Default Voice'}
                    </option>
                  )}
                </select>
              </div>

              {/* Speed Control */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'السرعة' : 'Speed'}: {voiceSpeed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0.5x</span>
                  <span>1x</span>
                  <span>2x</span>
                </div>
              </div>

              {/* Error */}
              {error && activeTab === 'voice' && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">{error}</p>
                  <button onClick={() => setError(null)} className="ml-auto">
                    <X className="w-4 h-4 text-yellow-400" />
                  </button>
                </div>
              )}

              {/* Play/Stop Button */}
              <button
                onClick={isPlaying ? stopPreview : previewVoice}
                disabled={!voiceText.trim()}
                className={`w-full px-6 py-4 ${
                  isPlaying 
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                } disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium transition flex items-center justify-center gap-3 shadow-lg`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5" />
                    ⏹️ {isRTL ? 'إيقاف' : 'Stop'}
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    ▶️ {isRTL ? 'تشغيل' : 'Play'}
                  </>
                )}
              </button>

              {/* Convert to MP3 Button */}
              <button
                onClick={convertToMp3}
                disabled={isConverting || !voiceText.trim()}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium transition flex items-center justify-center gap-3 shadow-lg shadow-green-500/25"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.converting}
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    🔊 {isRTL ? 'تحويل وتحميل MP3' : 'Convert & Download MP3'}
                  </>
                )}
              </button>

              {/* Audio Player & Download - Shows when audio is ready */}
              {audioUrl && audioBlob && (
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30 p-5">
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    controls
                    className="w-full mb-4"
                  />
                  <button
                    onClick={downloadMp3}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold shadow-lg"
                  >
                    <Download size={20} />
                    ⬇️ {t.downloadMp3}
                  </button>
                </div>
              )}

              {/* Playing indicator */}
              {isPlaying && !audioUrl && (
                <div className="flex items-center justify-center gap-2 py-4 bg-purple-500/10 rounded-xl">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div
                        key={i}
                        className="w-1.5 bg-purple-500 rounded-full animate-bounce"
                        style={{
                          height: '20px',
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.6s'
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-purple-600 dark:text-purple-400 ml-3 font-medium">
                    {isRTL ? 'جاري التشغيل...' : 'Playing...'}
                  </span>
                </div>
              )}

              {/* Tip */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-600 dark:text-blue-400">
                💡 {isRTL 
                  ? 'نصيحة: استخدم زر "تشغيل" للمعاينة، وزر "تحويل وتحميل" للحصول على ملف MP3 (حتى 200 حرف)' 
                  : 'Tip: Use "Play" to preview, "Convert & Download" for MP3 file (up to 200 chars)'}
              </div>
            </div>
          </div>
        </div>
      ) : (
      /* ============================================ */
      /* IMAGE / VIDEO TABS                          */
      /* ============================================ */
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls Panel */}
        <div className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.provider}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(activeTab === 'image' ? IMAGE_PROVIDERS : VIDEO_PROVIDERS)
                .filter(p => p.available)
                .map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => activeTab === 'image' 
                      ? setImageProvider(provider.id) 
                      : setVideoProvider(provider.id)
                    }
                    className={`p-3 rounded-lg border-2 transition text-left ${
                      (activeTab === 'image' ? imageProvider : videoProvider) === provider.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{provider.name}</div>
                    <div className="text-xs text-gray-500 truncate">{provider.description}</div>
                    {!getApiKey(provider.id) && provider.id !== 'pollinations' && (
                      <div className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        API key needed
                      </div>
                    )}
                    {provider.id === 'pollinations' && (
                      <div className="text-xs text-green-500 mt-1 flex items-center gap-1">
                        ✓ No API key needed!
                      </div>
                    )}
                  </button>
                ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.prompt}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={activeTab === 'image' 
                ? "A majestic dragon flying over a medieval castle at sunset, highly detailed, fantasy art..."
                : "A serene ocean wave rolling onto a sandy beach, cinematic, slow motion..."
              }
              className="w-full h-32 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Image-specific Settings */}
          {activeTab === 'image' && (
            <>
              {/* Style Preset */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.style}
                </label>
                <select
                  value={stylePreset}
                  onChange={(e) => setStylePreset(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {STYLE_PRESETS.map(style => (
                    <option key={style.id} value={style.id}>{style.name}</option>
                  ))}
                </select>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.size}
                </label>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {IMAGE_SIZES.map(size => (
                    <option key={size.value} value={size.value}>
                      {size.label} - {size.aspect}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Video-specific Settings */}
          {activeTab === 'video' && (
            <>
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.duration}: {videoDuration}s
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1s</span>
                  <span>30s (max)</span>
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.aspectRatio}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['16:9', '9:16', '1:1'] as const).map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setVideoAspectRatio(ratio)}
                      className={`p-2 rounded-lg border-2 transition ${
                        videoAspectRatio === ratio
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Image for I2V */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.sourceImage}
                </label>
                <input
                  type="text"
                  value={sourceImage}
                  onChange={(e) => setSourceImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  For image-to-video generation
                </p>
              </div>
            </>
          )}

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <Settings2 className="w-4 h-4" />
            {t.advanced}
            <ChevronDown className={`w-4 h-4 transition ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              {/* Negative Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.negativePrompt}
                </label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="blurry, low quality, distorted, watermark..."
                  className="w-full h-20 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                />
              </div>

              {/* Quality Slider */}
              {activeTab === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.quality}: {imageQuality}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={imageQuality}
                    onChange={(e) => setImageQuality(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">{t.error}</p>
                <p className="text-sm text-red-500 dark:text-red-300 mt-1">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={() => activeTab === 'image' ? generateImage() : generateVideo()}
            disabled={isLoading || (!prompt.trim() && !sourceImage)}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium transition flex items-center justify-center gap-3 shadow-lg shadow-purple-500/25"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t.generating}
              </>
            ) : result ? (
              <>
                <RefreshCw className="w-5 h-5" />
                {t.regenerate}
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                {t.generate}
              </>
            )}
          </button>
        </div>

        {/* Preview Panel */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[500px]">
          {result ? (
            <div className="w-full space-y-4">
              {/* Preview Media */}
              <div className="bg-gray-900 rounded-xl overflow-hidden aspect-square flex items-center justify-center shadow-xl">
                {result.type === 'image' ? (
                  <img
                    src={result.url}
                    alt={result.prompt}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={result.url}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>
                    {t.generatedAt} {result.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs">
                    {result.provider}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 line-clamp-2 italic">
                  "{result.prompt}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={copyUrl}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl transition font-medium"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      {t.copied}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {t.copy}
                    </>
                  )}
                </button>
                <button
                  onClick={downloadMedia}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition font-medium"
                >
                  <Download className="w-4 h-4" />
                  {t.download}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-6 bg-gray-200 dark:bg-gray-700 rounded-full inline-block">
                {activeTab === 'image' ? (
                  <ImageIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                ) : (
                  <Video className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <div>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                  {t.emptyPrompt}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {activeTab === 'image' 
                    ? 'Your generated image will appear here'
                    : 'Your generated video will appear here'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
