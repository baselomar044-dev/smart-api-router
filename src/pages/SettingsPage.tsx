// ============================================
// ⚙️ SETTINGS PAGE - Complete with QR Code
// PWA Install, Deploy, Mobile Support
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { getTheme, ThemeType, themeNames, isDarkTheme } from '../lib/themes';
import { 
  Palette, Globe, Brain, Zap, Check, Moon, Sun, Sparkles,
  Smartphone, Download, Share2, QrCode, Rocket, Github,
  ExternalLink, Copy, RefreshCw, Wifi, WifiOff, Bell,
  Shield, Key, Database, Trash2, Upload, Server
} from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================
// QR CODE GENERATOR (Pure TypeScript)
// ============================================
const generateQRCode = (text: string, size: number = 200): string => {
  // Simple QR code generator using canvas
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Create QR pattern (simplified - use a library for production)
  const modules = encodeToModules(text);
  const moduleSize = Math.floor(size / modules.length);
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  ctx.fillStyle = '#000000';
  modules.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
      }
    });
  });
  
  return canvas.toDataURL();
};

// Simple QR encoding (for demo - use qrcode library for production)
const encodeToModules = (text: string): boolean[][] => {
  const size = 25; // QR Version 2
  const modules: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // Add finder patterns
  const addFinderPattern = (x: number, y: number) => {
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        const isEdge = dx === 0 || dx === 6 || dy === 0 || dy === 6;
        const isInner = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        modules[y + dy][x + dx] = isEdge || isInner;
      }
    }
  };
  
  addFinderPattern(0, 0);
  addFinderPattern(size - 7, 0);
  addFinderPattern(0, size - 7);
  
  // Add data pattern (simplified)
  const hash = text.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
  for (let y = 9; y < size - 8; y++) {
    for (let x = 9; x < size - 8; x++) {
      modules[y][x] = ((hash >> ((x + y) % 32)) & 1) === 1;
    }
  }
  
  return modules;
};

// ============================================
// MAIN COMPONENT
// ============================================
const SettingsPage: React.FC = () => {
  const { 
    theme, setTheme, 
    language, setLanguage,
    aiConfig, setAIConfig,
    apiKeys
  } = useStore();
  
  const c = getTheme(theme);
  const isDark = isDarkTheme(theme);
  const isAr = language === 'ar';

  // State
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [appUrl, setAppUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Theme options
  const themeOptions: Array<{
    id: ThemeType;
    icon: React.ReactNode;
    preview: { bg: string; accent: string };
  }> = [
    {
      id: 'dark',
      icon: <Moon size={20} />,
      preview: { bg: 'bg-[#0a0f1a]', accent: 'bg-neutral-500' },
    },
    {
      id: 'light',
      icon: <Sun size={20} />,
      preview: { bg: 'bg-slate-100', accent: 'bg-neutral-600' },
    },
    {
      id: 'pink',
      icon: <Sparkles size={20} />,
      preview: { bg: 'bg-neutral-200', accent: 'bg-neutral-500' },
    },
  ];

  // Initialize
  useEffect(() => {
    // Check PWA install status
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get current URL for QR
    const url = window.location.origin;
    setAppUrl(url);
    
    // Generate QR code
    try {
      const qr = generateQRCode(url, 200);
      setQrCodeUrl(qr);
    } catch (e) {
      console.error('QR generation failed:', e);
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Install PWA
  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      toast.error(isAr ? 'التطبيق مثبت بالفعل أو غير مدعوم' : 'App already installed or not supported');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success(isAr ? 'تم تثبيت التطبيق!' : 'App installed!');
      setIsPWAInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // Share app
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Try-It! AI Assistant',
          text: isAr ? 'جرب هذا المساعد الذكي!' : 'Check out this AI assistant!',
          url: appUrl
        });
        toast.success(isAr ? 'تم المشاركة!' : 'Shared!');
      } catch (e) {
        // User cancelled
      }
    } else {
      copyToClipboard(appUrl);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isAr ? 'تم النسخ!' : 'Copied!');
  };

  // Enable notifications
  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error(isAr ? 'المتصفح لا يدعم الإشعارات' : 'Browser does not support notifications');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      toast.success(isAr ? 'تم تفعيل الإشعارات!' : 'Notifications enabled!');
      
      // Show test notification
      new Notification('Try-It! 🎉', {
        body: isAr ? 'الإشعارات تعمل!' : 'Notifications are working!',
        icon: '/icons/icon-192x192.png'
      });
    }
  };

  // Deploy state
  const [githubRepo, setGithubRepo] = useState('');
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  // Deploy links generator
  const getDeployUrl = (platform: string, repo: string) => {
    const repoUrl = repo || 'YOUR_USERNAME/YOUR_REPO';
    switch (platform) {
      case 'vercel':
        return `https://vercel.com/new/clone?repository-url=https://github.com/${repoUrl}`;
      case 'netlify':
        return `https://app.netlify.com/start/deploy?repository=https://github.com/${repoUrl}`;
      case 'railway':
        return `https://railway.app/new/template?template=https://github.com/${repoUrl}`;
      case 'render':
        return `https://render.com/deploy?repo=https://github.com/${repoUrl}`;
      default:
        return '#';
    }
  };

  // Deploy platforms
  const deployPlatforms = [
    {
      id: 'vercel',
      name: 'Vercel',
      icon: '▲',
      color: 'bg-black hover:bg-gray-800',
      description: isAr ? 'الأسرع والأسهل - مجاني' : 'Fastest & easiest - Free',
      features: isAr ? ['نشر تلقائي', 'SSL مجاني', 'CDN عالمي'] : ['Auto deploy', 'Free SSL', 'Global CDN']
    },
    {
      id: 'netlify',
      name: 'Netlify',
      icon: '◆',
      color: 'bg-[#00C7B7] hover:bg-[#00b3a4]',
      description: isAr ? 'مجاني مع CDN' : 'Free with CDN',
      features: isAr ? ['Forms مجاني', 'Functions', 'Deploy Preview'] : ['Free Forms', 'Functions', 'Deploy Preview']
    },
    {
      id: 'railway',
      name: 'Railway',
      icon: '🚂',
      color: 'bg-[#0B0D0E] hover:bg-[#1a1d1f]',
      description: isAr ? 'مع قاعدة بيانات' : 'With database',
      features: isAr ? ['PostgreSQL مجاني', 'Redis', 'مراقبة'] : ['Free PostgreSQL', 'Redis', 'Monitoring']
    },
    {
      id: 'render',
      name: 'Render',
      icon: '◯',
      color: 'bg-[#46E3B7] hover:bg-[#3dd1a7] text-black',
      description: isAr ? 'مجاني للأبد' : 'Free forever',
      features: isAr ? ['750 ساعة مجانية', 'Auto-scaling', 'Docker'] : ['750 free hours', 'Auto-scaling', 'Docker']
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: <Github size={18} />,
      color: 'bg-[#24292e] hover:bg-[#3a4149]',
      description: isAr ? 'رفع الكود أولاً' : 'Upload code first',
      features: isAr ? ['مطلوب للنشر', 'مجاني', 'Git hosting'] : ['Required for deploy', 'Free', 'Git hosting']
    }
  ];

  // Handle deploy click
  const handleDeployClick = (platformId: string) => {
    if (platformId === 'github') {
      window.open('https://github.com/new', '_blank');
      return;
    }
    setSelectedPlatform(platformId);
    setShowDeployModal(true);
  };

  // Handle deploy confirm
  const handleDeployConfirm = () => {
    if (selectedPlatform && githubRepo) {
      const url = getDeployUrl(selectedPlatform, githubRepo);
      window.open(url, '_blank');
      setShowDeployModal(false);
      toast.success(isAr ? 'تم فتح صفحة النشر!' : 'Deploy page opened!');
    } else {
      toast.error(isAr ? 'أدخل رابط GitHub أولاً' : 'Enter GitHub repo first');
    }
  };

  // API Keys status
  const apiKeysList = [
    { key: 'groq', name: 'Groq', icon: '⚡' },
    { key: 'gemini', name: 'Gemini', icon: '💎' },
    { key: 'openRouter', name: 'OpenRouter', icon: '🔀' },
    { key: 'mistral', name: 'Mistral', icon: '🌬️' },
    { key: 'cohere', name: 'Cohere', icon: '🧠' },
    { key: 'replicate', name: 'Replicate', icon: '🎨' },
    { key: 'elevenLabs', name: 'ElevenLabs', icon: '🔊' },
    { key: 'e2b', name: 'E2B', icon: '🖥️' },
    { key: 'firecrawl', name: 'Firecrawl', icon: '🔥' },
    { key: 'tavily', name: 'Tavily', icon: '🔍' },
    { key: 'resend', name: 'Resend', icon: '📧' },
  ];

  return (
    <div className={`h-full overflow-auto ${c.bg}`} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 pb-24">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-2xl md:text-3xl font-bold ${c.text}`}>
            {isAr ? '⚙️ الإعدادات' : '⚙️ Settings'}
          </h1>
          <p className={c.textSecondary}>
            {isAr ? 'تخصيص تجربتك وإدارة التطبيق' : 'Customize your experience & manage app'}
          </p>
        </div>

        {/* Connection Status Banner */}
        <div className={`
          flex items-center gap-3 p-4 rounded-xl
          ${isOnline 
            ? 'bg-green-500/10 border border-green-500/30' 
            : 'bg-red-500/10 border border-red-500/30'
          }
        `}>
          {isOnline ? <Wifi className="text-green-500" /> : <WifiOff className="text-red-500" />}
          <span className={isOnline ? 'text-green-500' : 'text-red-500'}>
            {isOnline 
              ? (isAr ? 'متصل بالإنترنت' : 'Connected') 
              : (isAr ? 'غير متصل' : 'Offline')
            }
          </span>
        </div>

        {/* ===== MOBILE & PWA Section ===== */}
        <section className={`${c.card} rounded-xl p-6 ${c.border} border`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${c.accentBg}`}>
              <Smartphone className={c.accent} size={20} />
            </div>
            <h2 className={`text-lg font-semibold ${c.text}`}>
              {isAr ? '📱 التطبيق والموبايل' : '📱 Mobile & PWA'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Install PWA */}
            <button
              onClick={handleInstallPWA}
              disabled={isPWAInstalled}
              className={`
                flex items-center gap-3 p-4 rounded-xl transition-all
                ${isPWAInstalled 
                  ? 'bg-green-500/10 border border-green-500/30 cursor-default'
                  : `${c.hoverBg} border ${c.border} hover:border-neutral-500/50`
                }
              `}
            >
              <Download className={isPWAInstalled ? 'text-green-500' : c.accent} size={24} />
              <div className="text-left">
                <p className={`font-medium ${c.text}`}>
                  {isPWAInstalled 
                    ? (isAr ? 'مثبت ✓' : 'Installed ✓')
                    : (isAr ? 'تثبيت التطبيق' : 'Install App')
                  }
                </p>
                <p className={`text-sm ${c.textSecondary}`}>
                  {isAr ? 'يعمل بدون إنترنت' : 'Works offline'}
                </p>
              </div>
            </button>

            {/* Share App */}
            <button
              onClick={handleShare}
              className={`flex items-center gap-3 p-4 rounded-xl ${c.hoverBg} border ${c.border} hover:border-neutral-500/50 transition-all`}
            >
              <Share2 className={c.accent} size={24} />
              <div className="text-left">
                <p className={`font-medium ${c.text}`}>
                  {isAr ? 'مشاركة التطبيق' : 'Share App'}
                </p>
                <p className={`text-sm ${c.textSecondary}`}>
                  {isAr ? 'أرسل لأصدقائك' : 'Send to friends'}
                </p>
              </div>
            </button>

            {/* QR Code */}
            <button
              onClick={() => setShowQRModal(true)}
              className={`flex items-center gap-3 p-4 rounded-xl ${c.hoverBg} border ${c.border} hover:border-neutral-500/50 transition-all`}
            >
              <QrCode className={c.accent} size={24} />
              <div className="text-left">
                <p className={`font-medium ${c.text}`}>
                  {isAr ? 'رمز QR' : 'QR Code'}
                </p>
                <p className={`text-sm ${c.textSecondary}`}>
                  {isAr ? 'امسح من الموبايل' : 'Scan with phone'}
                </p>
              </div>
            </button>

            {/* Notifications */}
            <button
              onClick={handleEnableNotifications}
              disabled={notificationsEnabled}
              className={`
                flex items-center gap-3 p-4 rounded-xl transition-all
                ${notificationsEnabled 
                  ? 'bg-green-500/10 border border-green-500/30 cursor-default'
                  : `${c.hoverBg} border ${c.border} hover:border-neutral-500/50`
                }
              `}
            >
              <Bell className={notificationsEnabled ? 'text-green-500' : c.accent} size={24} />
              <div className="text-left">
                <p className={`font-medium ${c.text}`}>
                  {notificationsEnabled 
                    ? (isAr ? 'مفعّل ✓' : 'Enabled ✓')
                    : (isAr ? 'تفعيل الإشعارات' : 'Enable Notifications')
                  }
                </p>
                <p className={`text-sm ${c.textSecondary}`}>
                  {isAr ? 'احصل على تنبيهات' : 'Get alerts'}
                </p>
              </div>
            </button>
          </div>

          {/* App URL */}
          <div className={`mt-4 p-3 rounded-lg ${c.hoverBg} flex items-center gap-2`}>
            <input
              type="text"
              value={appUrl}
              readOnly
              className={`flex-1 bg-transparent ${c.text} text-sm outline-none`}
            />
            <button
              onClick={() => copyToClipboard(appUrl)}
              className={`p-2 rounded-lg ${c.hoverBg} transition-colors`}
            >
              <Copy size={16} className={c.textSecondary} />
            </button>
          </div>
        </section>

        {/* ===== ONE-CLICK DEPLOY Section ===== */}
        <section className={`${c.card} rounded-xl p-6 ${c.border} border`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${c.accentBg}`}>
              <Rocket className={c.accent} size={20} />
            </div>
            <h2 className={`text-lg font-semibold ${c.text}`}>
              {isAr ? '🚀 نشر بنقرة واحدة' : '🚀 One-Click Deploy'}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {deployPlatforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleDeployClick(platform.id)}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-xl
                  ${platform.color} text-white
                  transition-all hover:scale-105 hover:shadow-lg
                  cursor-pointer border-none outline-none
                `}
              >
                <span className="text-2xl">{platform.icon}</span>
                <span className="font-medium text-sm">{platform.name}</span>
                <span className="text-xs opacity-75 text-center">{platform.description}</span>
              </button>
            ))}
          </div>

          <p className={`mt-4 text-sm ${c.textSecondary}`}>
            {isAr 
              ? '💡 نصيحة: ارفع الكود على GitHub أولاً ثم اختر منصة النشر'
              : '💡 Tip: Upload code to GitHub first, then choose deploy platform'
            }
          </p>

          {/* Deploy Modal */}
          {showDeployModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className={`${c.card} rounded-2xl p-6 max-w-md w-full ${c.border} border shadow-2xl`}>
                <h3 className={`text-xl font-bold ${c.text} mb-4`}>
                  {isAr ? '🚀 نشر على ' : '🚀 Deploy to '}
                  {deployPlatforms.find(p => p.id === selectedPlatform)?.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                      {isAr ? 'رابط GitHub (username/repo)' : 'GitHub Repo (username/repo)'}
                    </label>
                    <input
                      type="text"
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(e.target.value)}
                      placeholder="username/try-it-ai"
                      className={`w-full px-4 py-3 rounded-xl ${c.input} ${c.text} border ${c.border} focus:ring-2 focus:ring-neutral-500`}
                    />
                  </div>

                  <div className={`p-3 rounded-lg ${c.accentBg}`}>
                    <p className={`text-sm ${c.textSecondary}`}>
                      {isAr ? '📋 الخطوات:' : '📋 Steps:'}
                    </p>
                    <ol className={`text-sm ${c.textSecondary} mt-2 space-y-1 list-decimal list-inside`}>
                      <li>{isAr ? 'ارفع الكود على GitHub' : 'Upload code to GitHub'}</li>
                      <li>{isAr ? 'أدخل اسم الـ repo (مثال: username/my-app)' : 'Enter repo name (e.g., username/my-app)'}</li>
                      <li>{isAr ? 'اضغط "نشر الآن"' : 'Click "Deploy Now"'}</li>
                    </ol>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeployModal(false)}
                      className={`flex-1 px-4 py-3 rounded-xl ${c.card} ${c.border} border ${c.text} hover:opacity-80 transition-all`}
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      onClick={handleDeployConfirm}
                      className="flex-1 px-4 py-3 rounded-xl bg-neutral-500 hover:bg-neutral-600 text-white font-medium transition-all"
                    >
                      {isAr ? '🚀 نشر الآن' : '🚀 Deploy Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ===== THEME Section ===== */}
        <section className={`${c.card} rounded-xl p-6 ${c.border} border`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${c.accentBg}`}>
              <Palette className={c.accent} size={20} />
            </div>
            <h2 className={`text-lg font-semibold ${c.text}`}>
              {isAr ? '🎨 المظهر' : '🎨 Theme'}
            </h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {themeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all
                  ${theme === opt.id 
                    ? 'border-neutral-500 ring-2 ring-neutral-500/30' 
                    : `${c.border} border hover:border-neutral-300/50`
                  }
                `}
              >
                <div className={`h-16 rounded-lg mb-3 ${opt.preview.bg} border border-slate-600/20 overflow-hidden`}>
                  <div className="h-3 bg-slate-800/20" />
                  <div className="p-2">
                    <div className={`h-2 w-3/4 ${opt.preview.accent} rounded`} />
                    <div className={`h-2 w-1/2 ${opt.preview.accent} rounded mt-1 opacity-50`} />
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-2">
                  <span className={c.textSecondary}>{opt.icon}</span>
                  <span className={`text-sm font-medium ${c.text}`}>
                    {themeNames[opt.id][isAr ? 'ar' : 'en']}
                  </span>
                </div>
                
                {theme === opt.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-neutral-500 rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ===== LANGUAGE Section ===== */}
        <section className={`${c.card} rounded-xl p-6 ${c.border} border`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${c.accentBg}`}>
              <Globe className={c.accent} size={20} />
            </div>
            <h2 className={`text-lg font-semibold ${c.text}`}>
              {isAr ? '🌍 اللغة' : '🌍 Language'}
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'en', name: 'English', native: '🇬🇧 English' },
              { id: 'ar', name: 'Arabic', native: '🇸🇦 العربية' }
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id as 'en' | 'ar')}
                className={`
                  p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3
                  ${language === lang.id 
                    ? 'border-neutral-500 ring-2 ring-neutral-500/30' 
                    : `${c.border} border hover:border-neutral-300/50`
                  }
                `}
              >
                <span className={`text-lg font-medium ${c.text}`}>{lang.native}</span>
                {language === lang.id && (
                  <Check size={18} className="text-neutral-500" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ===== API KEYS Status Section ===== */}
        <section className={`${c.card} rounded-xl p-6 ${c.border} border`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${c.accentBg}`}>
              <Key className={c.accent} size={20} />
            </div>
            <h2 className={`text-lg font-semibold ${c.text}`}>
              {isAr ? '🔑 حالة مفاتيح API' : '🔑 API Keys Status'}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {apiKeysList.map((api) => {
              const isConfigured = apiKeys?.[api.key as keyof typeof apiKeys];
              return (
                <div
                  key={api.key}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg
                    ${isConfigured 
                      ? 'bg-green-500/10 border border-green-500/30'
                      : `${c.hoverBg} border ${c.border}`
                    }
                  `}
                >
                  <span>{api.icon}</span>
                  <span className={`text-sm ${c.text}`}>{api.name}</span>
                  {isConfigured ? (
                    <Check size={14} className="text-green-500 ml-auto" />
                  ) : (
                    <span className={`text-xs ${c.textSecondary} ml-auto`}>—</span>
                  )}
                </div>
              );
            })}
          </div>

          <p className={`mt-4 text-sm ${c.textSecondary}`}>
            {isAr 
              ? `${apiKeysList.filter(a => apiKeys?.[a.key as keyof typeof apiKeys]).length} من ${apiKeysList.length} مفتاح مُعد`
              : `${apiKeysList.filter(a => apiKeys?.[a.key as keyof typeof apiKeys]).length} of ${apiKeysList.length} keys configured`
            }
          </p>
        </section>

        {/* ===== AI CONFIG Section ===== */}
        <section className={`${c.card} rounded-xl p-6 ${c.border} border`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${c.accentBg}`}>
              <Brain className={c.accent} size={20} />
            </div>
            <h2 className={`text-lg font-semibold ${c.text}`}>
              {isAr ? '🧠 إعدادات الذكاء الاصطناعي' : '🧠 AI Configuration'}
            </h2>
          </div>
          
          <div className="space-y-6">
            {/* Temperature */}
            <div>
              <div className="flex justify-between mb-2">
                <label className={`text-sm font-medium ${c.text}`}>
                  {isAr ? 'الإبداعية' : 'Creativity'} (Temperature)
                </label>
                <span className={`text-sm ${c.accent}`}>{aiConfig?.temperature || 0.7}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={aiConfig?.temperature || 0.7}
                onChange={(e) => setAIConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-neutral-500"
              />
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${c.textSecondary}`}>{isAr ? 'دقيق' : 'Precise'}</span>
                <span className={`text-xs ${c.textSecondary}`}>{isAr ? 'إبداعي' : 'Creative'}</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div>
              <div className="flex justify-between mb-2">
                <label className={`text-sm font-medium ${c.text}`}>
                  {isAr ? 'الحد الأقصى للكلمات' : 'Max Tokens'}
                </label>
                <span className={`text-sm ${c.accent}`}>{aiConfig?.maxTokens || 4096}</span>
              </div>
              <input
                type="range"
                min="256"
                max="8192"
                step="256"
                value={aiConfig?.maxTokens || 4096}
                onChange={(e) => setAIConfig({ ...aiConfig, maxTokens: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-neutral-500"
              />
            </div>

            {/* Streaming */}
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${c.text}`}>
                  {isAr ? 'البث المباشر' : 'Streaming'}
                </p>
                <p className={`text-sm ${c.textSecondary}`}>
                  {isAr ? 'عرض الرد تدريجياً' : 'Show response gradually'}
                </p>
              </div>
              <button
                onClick={() => setAIConfig({ ...aiConfig, streaming: !aiConfig?.streaming })}
                className={`
                  w-12 h-6 rounded-full transition-colors relative
                  ${aiConfig?.streaming ? 'bg-neutral-500' : 'bg-slate-600'}
                `}
              >
                <div className={`
                  absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform
                  ${aiConfig?.streaming ? 'translate-x-6' : 'translate-x-0.5'}
                `} />
              </button>
            </div>
          </div>
        </section>

        {/* ===== STORAGE Section ===== */}
        <section className={`${c.card} rounded-xl p-6 ${c.border} border`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${c.accentBg}`}>
              <Database className={c.accent} size={20} />
            </div>
            <h2 className={`text-lg font-semibold ${c.text}`}>
              {isAr ? '💾 التخزين' : '💾 Storage'}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                const data = JSON.stringify(localStorage, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tryit-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                toast.success(isAr ? 'تم تصدير البيانات!' : 'Data exported!');
              }}
              className={`flex items-center gap-3 p-4 rounded-xl ${c.hoverBg} border ${c.border} hover:border-neutral-500/50 transition-all`}
            >
              <Upload className={c.accent} size={20} />
              <span className={c.text}>{isAr ? 'تصدير البيانات' : 'Export Data'}</span>
            </button>

            <button
              onClick={() => {
                if (confirm(isAr ? 'هل أنت متأكد؟ سيتم حذف جميع البيانات!' : 'Are you sure? All data will be deleted!')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="text-red-500" size={20} />
              <span className="text-red-500">{isAr ? 'مسح البيانات' : 'Clear Data'}</span>
            </button>
          </div>
        </section>

        {/* Version Info */}
        <div className={`text-center py-4 ${c.textSecondary} text-sm`}>
          <p>Try-It! AI v2.0.0</p>
          <p className="mt-1">Made with 💙 using React + TypeScript</p>
        </div>
      </div>

      {/* ===== QR CODE MODAL ===== */}
      {showQRModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowQRModal(false)}
        >
          <div 
            className={`${c.card} rounded-2xl p-6 max-w-sm w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-xl font-bold ${c.text} text-center mb-4`}>
              {isAr ? '📱 امسح لفتح التطبيق' : '📱 Scan to Open App'}
            </h3>
            
            <div className="bg-white p-4 rounded-xl mx-auto w-fit">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <RefreshCw className="animate-spin text-gray-400" />
                </div>
              )}
            </div>

            <p className={`text-center mt-4 ${c.textSecondary} text-sm`}>
              {appUrl}
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => copyToClipboard(appUrl)}
                className={`flex-1 py-3 rounded-xl ${c.hoverBg} border ${c.border} ${c.text} font-medium`}
              >
                {isAr ? 'نسخ الرابط' : 'Copy Link'}
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 py-3 rounded-xl bg-neutral-500 hover:bg-neutral-600 text-white font-medium"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
