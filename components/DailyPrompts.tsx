'use client';

// ============================================
// SOLVE IT! - Daily Prompts
// أفكار برومبتات متجددة يومياً
// ============================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store';

interface DailyPrompt {
  id: number;
  icon: string;
  titleAr: string;
  titleEn: string;
  promptAr: string;
  promptEn: string;
  category: 'web' | 'app' | 'ai' | 'business' | 'creative' | 'tool';
}

// مجموعة كبيرة من الأفكار - 60+ فكرة
const ALL_PROMPTS: DailyPrompt[] = [
  // Web Development
  { id: 1, icon: '🌐', category: 'web', titleAr: 'صفحة هبوط SaaS', titleEn: 'SaaS Landing Page', promptAr: 'أنشئ صفحة هبوط احترافية لمنتج SaaS مع قسم hero، مميزات، أسعار، شهادات عملاء، وCTA قوي', promptEn: 'Create a professional SaaS landing page with hero section, features, pricing, testimonials, and strong CTA' },
  { id: 2, icon: '🛒', category: 'web', titleAr: 'متجر إلكتروني', titleEn: 'E-commerce Store', promptAr: 'صمم واجهة متجر إلكتروني مع صفحة المنتجات، سلة التسوق، وصفحة الدفع', promptEn: 'Design an e-commerce interface with products page, shopping cart, and checkout' },
  { id: 3, icon: '📰', category: 'web', titleAr: 'مدونة شخصية', titleEn: 'Personal Blog', promptAr: 'أنشئ مدونة شخصية أنيقة مع الصفحة الرئيسية، صفحة المقالات، وصفحة عن المؤلف', promptEn: 'Create an elegant personal blog with homepage, articles page, and about author page' },
  { id: 4, icon: '🎨', category: 'web', titleAr: 'بورتفوليو مصمم', titleEn: 'Designer Portfolio', promptAr: 'صمم بورتفوليو لمصمم جرافيك مع معرض أعمال، سيرة ذاتية، وطريقة تواصل', promptEn: 'Design a graphic designer portfolio with work gallery, bio, and contact section' },
  { id: 5, icon: '🏢', category: 'web', titleAr: 'موقع شركة', titleEn: 'Corporate Website', promptAr: 'أنشئ موقع شركة متعدد الصفحات: الرئيسية، الخدمات، عن الشركة، فريق العمل، اتصل بنا', promptEn: 'Create a multi-page corporate website: Home, Services, About, Team, Contact' },
  { id: 6, icon: '🍔', category: 'web', titleAr: 'موقع مطعم', titleEn: 'Restaurant Website', promptAr: 'صمم موقع مطعم مع قائمة الطعام، نظام حجز، معرض صور، وخريطة الموقع', promptEn: 'Design a restaurant website with menu, reservation system, photo gallery, and location map' },
  { id: 7, icon: '🏋️', category: 'web', titleAr: 'نادي رياضي', titleEn: 'Gym Website', promptAr: 'أنشئ موقع نادي رياضي مع جداول التمارين، الاشتراكات، المدربين، والجدول الأسبوعي', promptEn: 'Create a gym website with workout schedules, memberships, trainers, and weekly timetable' },
  { id: 8, icon: '🎓', category: 'web', titleAr: 'منصة تعليمية', titleEn: 'Learning Platform', promptAr: 'صمم منصة دورات تعليمية مع صفحات الكورسات، تقدم الطالب، والشهادات', promptEn: 'Design a learning platform with course pages, student progress, and certificates' },
  
  // Mobile Apps
  { id: 9, icon: '📱', category: 'app', titleAr: 'تطبيق مهام', titleEn: 'Todo App', promptAr: 'صمم تطبيق مهام بسيط مع إضافة مهام، تصنيفات، تواريخ استحقاق، وإشعارات', promptEn: 'Design a simple todo app with tasks, categories, due dates, and notifications' },
  { id: 10, icon: '💰', category: 'app', titleAr: 'تطبيق مصاريف', titleEn: 'Expense Tracker', promptAr: 'أنشئ تطبيق تتبع المصاريف مع رسوم بيانية، تصنيفات، وتقارير شهرية', promptEn: 'Create an expense tracker with charts, categories, and monthly reports' },
  { id: 11, icon: '🍎', category: 'app', titleAr: 'تطبيق صحي', titleEn: 'Health App', promptAr: 'صمم تطبيق صحي لتتبع الماء، الخطوات، النوم، والسعرات الحرارية', promptEn: 'Design a health app to track water, steps, sleep, and calories' },
  { id: 12, icon: '📚', category: 'app', titleAr: 'تطبيق قراءة', titleEn: 'Reading App', promptAr: 'أنشئ تطبيق قراءة كتب مع مكتبة، تقدم القراءة، ملاحظات، وإشارات مرجعية', promptEn: 'Create a book reading app with library, reading progress, notes, and bookmarks' },
  { id: 13, icon: '🎵', category: 'app', titleAr: 'مشغل موسيقى', titleEn: 'Music Player', promptAr: 'صمم مشغل موسيقى مع قوائم التشغيل، المفضلة، وواجهة أنيقة', promptEn: 'Design a music player with playlists, favorites, and elegant interface' },
  { id: 14, icon: '🗒️', category: 'app', titleAr: 'تطبيق ملاحظات', titleEn: 'Notes App', promptAr: 'أنشئ تطبيق ملاحظات مع مجلدات، بحث، تنسيق نصي، ومزامنة', promptEn: 'Create a notes app with folders, search, text formatting, and sync' },
  { id: 15, icon: '⏰', category: 'app', titleAr: 'تطبيق عادات', titleEn: 'Habit Tracker', promptAr: 'صمم تطبيق تتبع عادات مع إحصائيات، streaks، وتذكيرات يومية', promptEn: 'Design a habit tracker with stats, streaks, and daily reminders' },
  
  // AI & Automation
  { id: 16, icon: '🤖', category: 'ai', titleAr: 'وكيل دعم فني', titleEn: 'Support Agent', promptAr: 'أنشئ وكيل ذكاء اصطناعي للدعم الفني يجيب على أسئلة العملاء بشكل احترافي', promptEn: 'Create an AI support agent that answers customer questions professionally' },
  { id: 17, icon: '✍️', category: 'ai', titleAr: 'كاتب محتوى', titleEn: 'Content Writer', promptAr: 'صمم وكيل لكتابة محتوى تسويقي، مقالات، ووصف منتجات', promptEn: 'Design an agent for writing marketing content, articles, and product descriptions' },
  { id: 18, icon: '🔄', category: 'ai', titleAr: 'مترجم ذكي', titleEn: 'Smart Translator', promptAr: 'أنشئ وكيل ترجمة يفهم السياق ويترجم بدقة مع الحفاظ على المعنى', promptEn: 'Create a translation agent that understands context and translates accurately' },
  { id: 19, icon: '📊', category: 'ai', titleAr: 'محلل بيانات', titleEn: 'Data Analyst', promptAr: 'صمم وكيل لتحليل البيانات واستخراج رؤى وتوصيات', promptEn: 'Design an agent for data analysis and extracting insights and recommendations' },
  { id: 20, icon: '📧', category: 'ai', titleAr: 'مدير بريد', titleEn: 'Email Manager', promptAr: 'أنشئ وكيل لتصنيف وتلخيص والرد على البريد الإلكتروني', promptEn: 'Create an agent to classify, summarize, and respond to emails' },
  { id: 21, icon: '🎯', category: 'ai', titleAr: 'مساعد تسويق', titleEn: 'Marketing Assistant', promptAr: 'صمم وكيل لإنشاء حملات تسويقية، محتوى سوشيال ميديا، وتحليل المنافسين', promptEn: 'Design an agent for creating marketing campaigns, social media content, and competitor analysis' },
  { id: 22, icon: '💻', category: 'ai', titleAr: 'مراجع كود', titleEn: 'Code Reviewer', promptAr: 'أنشئ وكيل لمراجعة الكود واقتراح تحسينات وإيجاد الأخطاء', promptEn: 'Create an agent to review code, suggest improvements, and find bugs' },
  
  // Business Tools
  { id: 23, icon: '📋', category: 'business', titleAr: 'لوحة تحكم', titleEn: 'Admin Dashboard', promptAr: 'صمم لوحة تحكم إدارية مع إحصائيات، رسوم بيانية، وإدارة المستخدمين', promptEn: 'Design an admin dashboard with stats, charts, and user management' },
  { id: 24, icon: '📝', category: 'business', titleAr: 'نظام فواتير', titleEn: 'Invoice System', promptAr: 'أنشئ نظام فواتير مع إنشاء فاتورة، تتبع المدفوعات، وتقارير', promptEn: 'Create an invoice system with invoice creation, payment tracking, and reports' },
  { id: 25, icon: '👥', category: 'business', titleAr: 'نظام HR', titleEn: 'HR System', promptAr: 'صمم نظام موارد بشرية مع ملفات الموظفين، الإجازات، والرواتب', promptEn: 'Design an HR system with employee profiles, leaves, and payroll' },
  { id: 26, icon: '📅', category: 'business', titleAr: 'نظام حجوزات', titleEn: 'Booking System', promptAr: 'أنشئ نظام حجز مواعيد مع تقويم، تأكيدات، وتذكيرات', promptEn: 'Create an appointment booking system with calendar, confirmations, and reminders' },
  { id: 27, icon: '📦', category: 'business', titleAr: 'إدارة مخزون', titleEn: 'Inventory Management', promptAr: 'صمم نظام إدارة مخزون مع تتبع المنتجات، تنبيهات النفاد، وتقارير', promptEn: 'Design inventory management with product tracking, stock alerts, and reports' },
  { id: 28, icon: '🎫', category: 'business', titleAr: 'نظام تذاكر', titleEn: 'Ticket System', promptAr: 'أنشئ نظام تذاكر دعم مع أولويات، تصنيفات، وتتبع الحالة', promptEn: 'Create a support ticket system with priorities, categories, and status tracking' },
  
  // Creative Projects
  { id: 29, icon: '🎮', category: 'creative', titleAr: 'لعبة بسيطة', titleEn: 'Simple Game', promptAr: 'صمم لعبة ويب بسيطة مثل Tic-tac-toe أو Memory Game', promptEn: 'Design a simple web game like Tic-tac-toe or Memory Game' },
  { id: 30, icon: '🎨', category: 'creative', titleAr: 'أداة رسم', titleEn: 'Drawing Tool', promptAr: 'أنشئ أداة رسم بسيطة مع فرش، ألوان، وحفظ الرسومات', promptEn: 'Create a simple drawing tool with brushes, colors, and saving drawings' },
  { id: 31, icon: '🎬', category: 'creative', titleAr: 'معرض أفلام', titleEn: 'Movie Gallery', promptAr: 'صمم موقع لعرض الأفلام مع تصنيفات، تقييمات، ومقطورات', promptEn: 'Design a movie showcase with categories, ratings, and trailers' },
  { id: 32, icon: '📸', category: 'creative', titleAr: 'معرض صور', titleEn: 'Photo Gallery', promptAr: 'أنشئ معرض صور مع ألبومات، فلاتر، وعرض lightbox', promptEn: 'Create a photo gallery with albums, filters, and lightbox view' },
  { id: 33, icon: '🎤', category: 'creative', titleAr: 'موقع بودكاست', titleEn: 'Podcast Site', promptAr: 'صمم موقع بودكاست مع الحلقات، المواسم، ومشغل صوت', promptEn: 'Design a podcast site with episodes, seasons, and audio player' },
  { id: 34, icon: '📖', category: 'creative', titleAr: 'موقع وصفات', titleEn: 'Recipe Site', promptAr: 'أنشئ موقع وصفات طبخ مع المكونات، الخطوات، وتقييمات', promptEn: 'Create a cooking recipe site with ingredients, steps, and ratings' },
  
  // Developer Tools
  { id: 35, icon: '⚙️', category: 'tool', titleAr: 'مولد JSON', titleEn: 'JSON Generator', promptAr: 'صمم أداة لتوليد بيانات JSON وهمية للتطوير والاختبار', promptEn: 'Design a tool to generate fake JSON data for development and testing' },
  { id: 36, icon: '🎨', category: 'tool', titleAr: 'منتقي ألوان', titleEn: 'Color Picker', promptAr: 'أنشئ أداة منتقي ألوان متقدمة مع palettes وتحويلات الألوان', promptEn: 'Create an advanced color picker with palettes and color conversions' },
  { id: 37, icon: '📐', category: 'tool', titleAr: 'منشئ CSS', titleEn: 'CSS Generator', promptAr: 'صمم أداة لتوليد CSS للـ gradients، shadows، وanimations', promptEn: 'Design a tool to generate CSS for gradients, shadows, and animations' },
  { id: 38, icon: '🔗', category: 'tool', titleAr: 'مختصر روابط', titleEn: 'URL Shortener', promptAr: 'أنشئ خدمة اختصار روابط مع إحصائيات وQR codes', promptEn: 'Create a URL shortening service with stats and QR codes' },
  { id: 39, icon: '📊', category: 'tool', titleAr: 'منشئ رسوم', titleEn: 'Chart Generator', promptAr: 'صمم أداة لإنشاء رسوم بيانية من بيانات CSV أو JSON', promptEn: 'Design a tool to create charts from CSV or JSON data' },
  { id: 40, icon: '✏️', category: 'tool', titleAr: 'محرر Markdown', titleEn: 'Markdown Editor', promptAr: 'أنشئ محرر Markdown مع معاينة مباشرة وتصدير', promptEn: 'Create a Markdown editor with live preview and export' },
  
  // More Ideas
  { id: 41, icon: '🌤️', category: 'app', titleAr: 'تطبيق طقس', titleEn: 'Weather App', promptAr: 'صمم تطبيق طقس مع توقعات أسبوعية، خرائط، وتنبيهات', promptEn: 'Design a weather app with weekly forecasts, maps, and alerts' },
  { id: 42, icon: '💬', category: 'app', titleAr: 'تطبيق دردشة', titleEn: 'Chat App', promptAr: 'أنشئ تطبيق دردشة مع غرف، رسائل خاصة، ومشاركة ملفات', promptEn: 'Create a chat app with rooms, private messages, and file sharing' },
  { id: 43, icon: '🗺️', category: 'app', titleAr: 'تطبيق سفر', titleEn: 'Travel App', promptAr: 'صمم تطبيق تخطيط رحلات مع وجهات، فنادق، وجدول الرحلة', promptEn: 'Design a trip planning app with destinations, hotels, and itinerary' },
  { id: 44, icon: '🎁', category: 'web', titleAr: 'موقع هدايا', titleEn: 'Gift Shop', promptAr: 'أنشئ موقع متجر هدايا مع تصنيفات، مناسبات، وتغليف', promptEn: 'Create a gift shop site with categories, occasions, and wrapping' },
  { id: 45, icon: '🏠', category: 'web', titleAr: 'موقع عقارات', titleEn: 'Real Estate', promptAr: 'صمم موقع عقارات مع بحث، فلاتر، خرائط، وتفاصيل العقارات', promptEn: 'Design a real estate site with search, filters, maps, and property details' },
  { id: 46, icon: '🚗', category: 'web', titleAr: 'موقع سيارات', titleEn: 'Car Dealership', promptAr: 'أنشئ موقع معرض سيارات مع كتالوج، مقارنة، وحجز معاينة', promptEn: 'Create a car dealership site with catalog, comparison, and viewing booking' },
  { id: 47, icon: '💼', category: 'web', titleAr: 'موقع وظائف', titleEn: 'Job Board', promptAr: 'صمم منصة توظيف مع إعلانات الوظائف، سيرة ذاتية، وتقديم', promptEn: 'Design a job platform with listings, resumes, and applications' },
  { id: 48, icon: '🎪', category: 'web', titleAr: 'موقع فعاليات', titleEn: 'Events Site', promptAr: 'أنشئ موقع فعاليات مع تقويم، حجز تذاكر، وتفاصيل الفعاليات', promptEn: 'Create an events site with calendar, ticket booking, and event details' },
  { id: 49, icon: '📞', category: 'tool', titleAr: 'منشئ QR', titleEn: 'QR Generator', promptAr: 'صمم أداة لإنشاء QR codes مع ألوان وشعارات مخصصة', promptEn: 'Design a tool to create QR codes with custom colors and logos' },
  { id: 50, icon: '🔐', category: 'tool', titleAr: 'مولد كلمات مرور', titleEn: 'Password Generator', promptAr: 'أنشئ أداة توليد كلمات مرور قوية مع خيارات متعددة', promptEn: 'Create a strong password generator with multiple options' },
  { id: 51, icon: '📏', category: 'tool', titleAr: 'محول وحدات', titleEn: 'Unit Converter', promptAr: 'صمم محول وحدات شامل للطول، الوزن، الحرارة، والعملات', promptEn: 'Design a comprehensive unit converter for length, weight, temperature, and currency' },
  { id: 52, icon: '⏱️', category: 'tool', titleAr: 'مؤقت بومودورو', titleEn: 'Pomodoro Timer', promptAr: 'أنشئ مؤقت بومودورو مع جلسات عمل، استراحات، وإحصائيات', promptEn: 'Create a Pomodoro timer with work sessions, breaks, and stats' },
  { id: 53, icon: '🧮', category: 'tool', titleAr: 'آلة حاسبة', titleEn: 'Calculator', promptAr: 'صمم آلة حاسبة علمية متقدمة مع تاريخ العمليات', promptEn: 'Design an advanced scientific calculator with operation history' },
  { id: 54, icon: '📝', category: 'ai', titleAr: 'ملخص مقالات', titleEn: 'Article Summarizer', promptAr: 'أنشئ وكيل لتلخيص المقالات الطويلة واستخراج النقاط الرئيسية', promptEn: 'Create an agent to summarize long articles and extract key points' },
  { id: 55, icon: '🎨', category: 'ai', titleAr: 'وصف صور', titleEn: 'Image Describer', promptAr: 'صمم وكيل لوصف الصور وإنشاء alt text للمواقع', promptEn: 'Design an agent to describe images and create alt text for websites' },
  { id: 56, icon: '📊', category: 'business', titleAr: 'تقارير مبيعات', titleEn: 'Sales Reports', promptAr: 'أنشئ نظام تقارير مبيعات مع رسوم بيانية وتصدير PDF', promptEn: 'Create a sales reports system with charts and PDF export' },
  { id: 57, icon: '🎯', category: 'business', titleAr: 'لوحة OKRs', titleEn: 'OKRs Dashboard', promptAr: 'صمم لوحة تحكم للأهداف ونتائج المفتاحية مع تتبع التقدم', promptEn: 'Design an OKRs dashboard with objectives and key results tracking' },
  { id: 58, icon: '📈', category: 'business', titleAr: 'تحليلات ويب', titleEn: 'Web Analytics', promptAr: 'أنشئ لوحة تحليلات للمواقع مع زوار، صفحات، وسلوك المستخدم', promptEn: 'Create a web analytics dashboard with visitors, pages, and user behavior' },
  { id: 59, icon: '🎲', category: 'creative', titleAr: 'مولد أسماء', titleEn: 'Name Generator', promptAr: 'صمم مولد أسماء للشركات، المنتجات، أو الشخصيات', promptEn: 'Design a name generator for companies, products, or characters' },
  { id: 60, icon: '✨', category: 'creative', titleAr: 'مولد أفكار', titleEn: 'Idea Generator', promptAr: 'أنشئ أداة لتوليد أفكار مشاريع عشوائية مع تصنيفات', promptEn: 'Create a tool to generate random project ideas with categories' },
];

// Get 3 prompts for today based on date
function getDailyPrompts(date: Date): DailyPrompt[] {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const seed = dayOfYear + date.getFullYear();
  
  // Simple seeded random
  const seededRandom = (seed: number, index: number) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };
  
  // Get 3 unique indices
  const indices: number[] = [];
  let attempt = 0;
  while (indices.length < 3 && attempt < 100) {
    const idx = Math.floor(seededRandom(seed, attempt) * ALL_PROMPTS.length);
    if (!indices.includes(idx)) {
      indices.push(idx);
    }
    attempt++;
  }
  
  return indices.map(i => ALL_PROMPTS[i]);
}

interface DailyPromptsProps {
  onUsePrompt?: (prompt: string) => void;
}

export default function DailyPrompts({ onUsePrompt }: DailyPromptsProps) {
  const { language, setCurrentService } = useAppStore();
  const [copied, setCopied] = useState<number | null>(null);
  
  const todayPrompts = useMemo(() => getDailyPrompts(new Date()), []);
  
  const isRTL = language === 'ar';

  const categoryColors: Record<string, string> = {
    web: 'from-blue-500 to-cyan-500',
    app: 'from-purple-500 to-pink-500',
    ai: 'from-orange-500 to-red-500',
    business: 'from-green-500 to-emerald-500',
    creative: 'from-yellow-500 to-orange-500',
    tool: 'from-indigo-500 to-purple-500',
  };

  const categoryLabels: Record<string, { ar: string; en: string }> = {
    web: { ar: 'ويب', en: 'Web' },
    app: { ar: 'تطبيق', en: 'App' },
    ai: { ar: 'ذكاء', en: 'AI' },
    business: { ar: 'أعمال', en: 'Business' },
    creative: { ar: 'إبداعي', en: 'Creative' },
    tool: { ar: 'أداة', en: 'Tool' },
  };

  const handleCopy = async (prompt: DailyPrompt) => {
    const text = isRTL ? prompt.promptAr : prompt.promptEn;
    await navigator.clipboard.writeText(text);
    setCopied(prompt.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleUse = (prompt: DailyPrompt) => {
    const text = isRTL ? prompt.promptAr : prompt.promptEn;
    if (onUsePrompt) {
      onUsePrompt(text);
    } else {
      // Navigate to builder with the prompt
      setCurrentService('builder');
    }
  };

  return (
    <div className="card bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="text-2xl">💡</span>
          <span>{isRTL ? 'أفكار اليوم' : "Today's Ideas"}</span>
        </h3>
        <span className="text-xs text-[var(--muted)] px-2 py-1 bg-[var(--card)] rounded-full">
          {isRTL ? 'تتجدد يومياً' : 'Daily refresh'}
        </span>
      </div>
      
      <div className="grid gap-3">
        {todayPrompts.map((prompt, index) => (
          <div 
            key={prompt.id}
            className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] hover:border-amber-500/50 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryColors[prompt.category]} flex items-center justify-center text-xl shrink-0`}>
                {prompt.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate">
                    {isRTL ? prompt.titleAr : prompt.titleEn}
                  </h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${categoryColors[prompt.category]} text-white`}>
                    {categoryLabels[prompt.category][language]}
                  </span>
                </div>
                
                <p className="text-sm text-[var(--muted)] line-clamp-2">
                  {isRTL ? prompt.promptAr : prompt.promptEn}
                </p>
                
                <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(prompt)}
                    className="text-xs px-3 py-1.5 bg-[var(--card-hover)] rounded-lg hover:bg-[var(--primary)] hover:text-white transition-colors flex items-center gap-1"
                  >
                    {copied === prompt.id ? '✓' : '📋'}
                    <span>{copied === prompt.id ? (isRTL ? 'تم النسخ' : 'Copied') : (isRTL ? 'نسخ' : 'Copy')}</span>
                  </button>
                  <button
                    onClick={() => handleUse(prompt)}
                    className="text-xs px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                  >
                    🚀
                    <span>{isRTL ? 'استخدم' : 'Use'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-center text-[var(--muted)] mt-4">
        {isRTL 
          ? `📅 ${new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
          : `📅 ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
        }
      </p>
    </div>
  );
}
