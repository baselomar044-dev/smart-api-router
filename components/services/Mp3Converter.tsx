'use client'

import { useState, useRef } from 'react'
import { Music, Upload, FileText, Play, Pause, Download, Volume2, Loader2, X } from 'lucide-react'

interface Mp3ConverterProps {
  language: 'ar' | 'en'
  apiKeys: {
    groq: string
    gemini: string
    claude: string
    openai: string
  }
}

export default function Mp3Converter({ language }: Mp3ConverterProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'text'>('pdf')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [inputText, setInputText] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [speed, setSpeed] = useState(1)
  const [pitch, setPitch] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const t = {
    ar: {
      title: 'محول MP3',
      subtitle: 'تحويل النصوص والملفات إلى ملفات صوتية MP3',
      pdfTab: 'PDF إلى MP3',
      textTab: 'نص إلى MP3',
      uploadPdf: 'رفع ملف PDF',
      dragDrop: 'اسحب وأفلت ملف PDF هنا أو انقر للاختيار',
      supportedFormat: 'الصيغة المدعومة: PDF',
      maxSize: 'الحد الأقصى: 10 ميجابايت',
      extracting: 'جاري استخراج النص...',
      extractedText: 'النص المستخرج',
      enterText: 'أدخل النص هنا...',
      textPlaceholder: 'اكتب أو الصق النص الذي تريد تحويله إلى صوت...',
      selectVoice: 'اختر الصوت',
      speed: 'السرعة',
      pitch: 'طبقة الصوت',
      convert: 'تحويل إلى MP3',
      converting: 'جاري التحويل...',
      play: 'تشغيل',
      pause: 'إيقاف مؤقت',
      download: 'تحميل MP3',
      noText: 'لا يوجد نص للتحويل',
      fileSelected: 'تم اختيار الملف',
      removeFile: 'إزالة الملف',
      howItWorks: 'كيف يعمل؟',
      step1: 'ارفع ملف PDF أو اكتب النص',
      step2: 'اختر الصوت والإعدادات',
      step3: 'انقر تحويل للحصول على MP3',
      step4: 'استمع أو حمّل الملف الصوتي'
    },
    en: {
      title: 'MP3 Converter',
      subtitle: 'Convert text and files to MP3 audio files',
      pdfTab: 'PDF to MP3',
      textTab: 'Text to MP3',
      uploadPdf: 'Upload PDF File',
      dragDrop: 'Drag and drop PDF here or click to select',
      supportedFormat: 'Supported format: PDF',
      maxSize: 'Max size: 10MB',
      extracting: 'Extracting text...',
      extractedText: 'Extracted Text',
      enterText: 'Enter text here...',
      textPlaceholder: 'Type or paste the text you want to convert to audio...',
      selectVoice: 'Select Voice',
      speed: 'Speed',
      pitch: 'Pitch',
      convert: 'Convert to MP3',
      converting: 'Converting...',
      play: 'Play',
      pause: 'Pause',
      download: 'Download MP3',
      noText: 'No text to convert',
      fileSelected: 'File selected',
      removeFile: 'Remove file',
      howItWorks: 'How it works?',
      step1: 'Upload PDF or type text',
      step2: 'Choose voice and settings',
      step3: 'Click convert to get MP3',
      step4: 'Listen or download the audio'
    }
  }

  const text = t[language]
  const isRTL = language === 'ar'

  // Load available voices
  useState(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices()
      setVoices(availableVoices)
      if (availableVoices.length > 0 && !selectedVoice) {
        // Try to find Arabic voice for Arabic, English for English
        const preferredVoice = availableVoices.find(v => 
          language === 'ar' ? v.lang.includes('ar') : v.lang.includes('en')
        ) || availableVoices[0]
        setSelectedVoice(preferredVoice)
      }
    }
    loadVoices()
    speechSynthesis.onvoiceschanged = loadVoices
  })

  const handleFileUpload = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a PDF file')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Max 10MB')
      return
    }

    setPdfFile(file)
    setIsExtracting(true)
    setExtractedText('')

    try {
      // Use PDF.js to extract text
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
      
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
        fullText += pageText + '\n\n'
      }
      
      setExtractedText(fullText.trim())
    } catch (error) {
      console.error('Error extracting PDF text:', error)
      alert('Error extracting text from PDF')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const removeFile = () => {
    setPdfFile(null)
    setExtractedText('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const getCurrentText = () => {
    return activeTab === 'pdf' ? extractedText : inputText
  }

  const convertToSpeech = () => {
    const textToConvert = getCurrentText()
    if (!textToConvert.trim()) {
      alert(text.noText)
      return
    }

    setIsConverting(true)
    
    // Stop any existing speech
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(textToConvert)
    utterance.voice = selectedVoice
    utterance.rate = speed
    utterance.pitch = pitch
    
    utterance.onend = () => {
      setIsPlaying(false)
      setIsConverting(false)
    }
    
    utterance.onerror = () => {
      setIsPlaying(false)
      setIsConverting(false)
    }

    utteranceRef.current = utterance
    speechSynthesis.speak(utterance)
    setIsPlaying(true)
    setIsConverting(false)
    setAudioUrl('ready') // Mark as ready for "download"
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      speechSynthesis.pause()
      setIsPlaying(false)
    } else {
      speechSynthesis.resume()
      setIsPlaying(true)
    }
  }

  const downloadAudio = () => {
    // Note: Browser TTS doesn't support direct MP3 export
    // This creates a text file with the content for now
    const textToConvert = getCurrentText()
    const blob = new Blob([textToConvert], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audio-text.txt'
    a.click()
    URL.revokeObjectURL(url)
    alert(language === 'ar' 
      ? 'ملاحظة: تم تحميل النص. استخدم خدمة تحويل النص إلى صوت خارجية للحصول على MP3'
      : 'Note: Text downloaded. Use external TTS service for MP3 file')
  }

  return (
    <div className={`p-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{text.title}</h1>
            <p className="text-gray-500 dark:text-gray-400">{text.subtitle}</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
        <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-3">{text.howItWorks}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[text.step1, text.step2, text.step3, text.step4].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-sm flex items-center justify-center font-bold">
                {i + 1}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pdf')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'pdf'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Upload className="w-4 h-4" />
          {text.pdfTab}
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'text'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          {text.textTab}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          {activeTab === 'pdf' ? (
            <>
              {/* PDF Upload */}
              {!pdfFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">{text.dragDrop}</p>
                  <p className="text-sm text-gray-500">{text.supportedFormat}</p>
                  <p className="text-sm text-gray-500">{text.maxSize}</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{pdfFile.name}</p>
                        <p className="text-sm text-gray-500">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {isExtracting && (
                    <div className="flex items-center gap-2 text-purple-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{text.extracting}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Extracted Text Preview */}
              {extractedText && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {text.extractedText}
                  </label>
                  <textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    className="w-full h-48 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white resize-none"
                  />
                </div>
              )}
            </>
          ) : (
            /* Text Input */
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {text.enterText}
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={text.textPlaceholder}
                className="w-full h-64 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white resize-none"
              />
            </div>
          )}
        </div>

        {/* Settings & Output Section */}
        <div className="space-y-4">
          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {text.selectVoice}
            </label>
            <select
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const voice = voices.find(v => v.name === e.target.value)
                setSelectedVoice(voice || null)
              }}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Speed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {text.speed}: {speed.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Pitch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {text.pitch}: {pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Convert Button */}
          <button
            onClick={convertToSpeech}
            disabled={isConverting || !getCurrentText().trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isConverting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {text.converting}
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                {text.convert}
              </>
            )}
          </button>

          {/* Playback Controls */}
          {audioUrl && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={togglePlayPause}
                  className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 flex items-center justify-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5" />
                      {text.pause}
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      {text.play}
                    </>
                  )}
                </button>
                <button
                  onClick={downloadAudio}
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  {text.download}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
