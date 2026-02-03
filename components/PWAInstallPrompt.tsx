'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { safeStorage } from '@/lib/safeStorage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { language } = useAppStore();
  const isRTL = language === 'ar';

  const txt = {
    title: isRTL ? '📱 تثبيت التطبيق' : '📱 Install App',
    description: isRTL 
      ? 'ثبّت SolveIt على جهازك للوصول السريع والعمل بدون إنترنت!'
      : 'Install SolveIt on your device for quick access and offline use!',
    install: isRTL ? 'تثبيت الآن' : 'Install Now',
    later: isRTL ? 'لاحقاً' : 'Later',
    installed: isRTL ? '✅ تم التثبيت!' : '✅ Installed!',
  };

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (within 24 hours)
    const dismissedAt = safeStorage.getItem('pwa-prompt-dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        return; // Don't show for 24 hours after dismissal
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Wait 5 seconds before showing prompt
      setTimeout(() => setShowPrompt(true), 5000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setShowPrompt(false);
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Install error:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    safeStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
            S
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg">{txt.title}</h3>
            <p className="text-purple-200/80 text-sm mt-1">{txt.description}</p>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-purple-300 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium py-2.5 px-4 rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-purple-500/25"
          >
            {txt.install}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 text-purple-300 hover:text-white hover:bg-purple-800/50 rounded-xl transition-all"
          >
            {txt.later}
          </button>
        </div>

        {/* Features */}
        <div className="mt-3 pt-3 border-t border-purple-500/20 flex gap-4 text-xs text-purple-300">
          <span>⚡ سريع</span>
          <span>📴 يعمل بدون إنترنت</span>
          <span>🔔 إشعارات</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
