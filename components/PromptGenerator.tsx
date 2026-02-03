'use client';

// ============================================
// SOLVE IT! - Prompt Generator
// مولد البرومبتات الذكي
// ============================================

'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';

interface GeneratedPrompt {
  title: string;
  prompt: string;
  category: string;
}

const PROMPT_TEMPLATES = {
  ar: {
    landing: {
      title: 'صفحة هبوط',
      templates: [
        { title: 'شركة تقنية', prompt: 'أنشئ صفحة هبوط احترافية لشركة تقنية متخصصة في تطوير التطبيقات، تتضمن: هيدر مع لوجو وقائمة تنقل، قسم رئيسي مع عنوان جذاب وزر CTA، قسم الخدمات، قسم عن الشركة، قسم شهادات العملاء، وقسم تواصل معنا' },
        { title: 'متجر إلكتروني', prompt: 'أنشئ صفحة هبوط لمتجر إلكتروني يبيع منتجات تقنية، تتضمن: شريط إعلانات في الأعلى، هيدر مع شعار وبحث وسلة، قسم عروض مميزة، قسم فئات المنتجات، قسم المنتجات الأكثر مبيعاً، وفوتر شامل' },
        { title: 'مطعم', prompt: 'أنشئ صفحة هبوط أنيقة لمطعم فاخر، تتضمن: صورة خلفية كبيرة مع عنوان، قسم القائمة (Menu) مع أقسام للمقبلات والأطباق الرئيسية والحلويات، قسم الحجز، قسم الموقع وأوقات العمل، وأيقونات التواصل الاجتماعي' },
        { title: 'بورتفوليو', prompt: 'أنشئ صفحة بورتفوليو شخصية لمصمم جرافيك، تتضمن: مقدمة مع صورة شخصية واسم، قسم المهارات مع نسب مئوية، معرض أعمال بتصميم grid، قسم الخبرات، وقسم التواصل مع نموذج' },
      ]
    },
    sections: {
      title: 'أقسام الصفحة',
      templates: [
        { title: 'هيدر وتنقل', prompt: 'أضف هيدر احترافي يتضمن: لوجو على اليمين، قائمة تنقل في المنتصف (الرئيسية، الخدمات، من نحن، المدونة، تواصل معنا)، وزر CTA على اليسار. يجب أن يكون responsive ويتحول لقائمة hamburger في الموبايل' },
        { title: 'قسم البطل (Hero)', prompt: 'أضف قسم Hero كبير مع: خلفية gradient، عنوان رئيسي جذاب، فقرة وصفية، زرين CTA (ابدأ الآن، تعرف أكثر)، وصورة أو illustration على الجانب' },
        { title: 'قسم المميزات', prompt: 'أضف قسم مميزات يتضمن 6 بطاقات، كل بطاقة تحتوي: أيقونة، عنوان، ووصف قصير. استخدم تصميم grid متجاوب (3 أعمدة على الديسكتوب، 2 على التابلت، 1 على الموبايل)' },
        { title: 'فوتر شامل', prompt: 'أضف فوتر احترافي يتضمن: 4 أعمدة (عن الشركة، روابط سريعة، خدماتنا، تواصل معنا)، قسم النشرة البريدية، أيقونات السوشيال ميديا، وحقوق النشر في الأسفل' },
        { title: 'قسم الأسعار', prompt: 'أضف جدول أسعار بثلاث خطط (أساسي، متقدم، احترافي) مع: اسم الخطة، السعر، قائمة المميزات لكل خطة، وزر اشتراك. اجعل الخطة المتقدمة مميزة بلون مختلف وعلامة "الأكثر شعبية"' },
        { title: 'قسم شهادات العملاء', prompt: 'أضف قسم شهادات عملاء بتصميم slider/carousel يتضمن: صورة العميل، اسمه، منصبه، وشهادته. أضف 4 شهادات على الأقل مع أزرار تنقل' },
      ]
    },
    modifications: {
      title: 'تعديلات',
      templates: [
        { title: 'تغيير الألوان', prompt: 'غيّر نظام الألوان إلى: اللون الأساسي أزرق (#3B82F6)، اللون الثانوي بنفسجي (#8B5CF6)، الخلفية بيضاء، والنصوص رمادي داكن' },
        { title: 'تحسين التجاوب', prompt: 'حسّن تجاوب الصفحة لتعمل بشكل مثالي على جميع الأجهزة: موبايل (أقل من 640px)، تابلت (640-1024px)، وديسكتوب (أكثر من 1024px). تأكد من أحجام الخطوط والمسافات' },
        { title: 'إضافة أنيميشن', prompt: 'أضف تأثيرات حركية خفيفة: fade-in للعناصر عند الظهور، hover effects للأزرار والبطاقات، وتأثير smooth scroll للروابط الداخلية' },
        { title: 'وضع داكن', prompt: 'أضف دعم الوضع الداكن (Dark Mode) مع زر تبديل. في الوضع الداكن: الخلفية (#1F2937)، البطاقات (#374151)، النصوص بيضاء، والألوان الأساسية تبقى كما هي' },
      ]
    }
  },
  en: {
    landing: {
      title: 'Landing Pages',
      templates: [
        { title: 'Tech Company', prompt: 'Create a professional landing page for a tech company specializing in app development. Include: header with logo and navigation, hero section with catchy headline and CTA button, services section, about us, testimonials, and contact section' },
        { title: 'E-commerce Store', prompt: 'Create a landing page for an electronics e-commerce store. Include: announcement bar, header with logo, search, and cart, featured offers section, product categories, best sellers, and comprehensive footer' },
        { title: 'Restaurant', prompt: 'Create an elegant landing page for a fine dining restaurant. Include: large hero image with title, menu section (appetizers, main courses, desserts), reservation section, location and hours, and social media icons' },
        { title: 'Portfolio', prompt: 'Create a personal portfolio page for a graphic designer. Include: intro with profile photo and name, skills section with percentages, work gallery in grid layout, experience section, and contact form' },
      ]
    },
    sections: {
      title: 'Page Sections',
      templates: [
        { title: 'Header & Nav', prompt: 'Add a professional header with: logo on the left, centered navigation (Home, Services, About, Blog, Contact), and CTA button on the right. Must be responsive with hamburger menu on mobile' },
        { title: 'Hero Section', prompt: 'Add a large Hero section with: gradient background, catchy headline, descriptive paragraph, two CTA buttons (Get Started, Learn More), and an image or illustration on the side' },
        { title: 'Features Section', prompt: 'Add a features section with 6 cards, each containing: icon, title, and short description. Use responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile)' },
        { title: 'Footer', prompt: 'Add a professional footer with: 4 columns (About, Quick Links, Services, Contact), newsletter signup, social media icons, and copyright at the bottom' },
        { title: 'Pricing Section', prompt: 'Add a pricing table with three plans (Basic, Pro, Enterprise) with: plan name, price, feature list, and subscribe button. Highlight the Pro plan with different color and "Most Popular" badge' },
        { title: 'Testimonials', prompt: 'Add a testimonials section with slider/carousel design including: customer photo, name, position, and testimonial. Add at least 4 testimonials with navigation buttons' },
      ]
    },
    modifications: {
      title: 'Modifications',
      templates: [
        { title: 'Change Colors', prompt: 'Change the color scheme to: primary blue (#3B82F6), secondary purple (#8B5CF6), white background, and dark gray text' },
        { title: 'Improve Responsiveness', prompt: 'Improve responsiveness for all devices: mobile (<640px), tablet (640-1024px), desktop (>1024px). Ensure proper font sizes and spacing' },
        { title: 'Add Animations', prompt: 'Add subtle animations: fade-in for elements on scroll, hover effects for buttons and cards, smooth scroll for internal links' },
        { title: 'Dark Mode', prompt: 'Add Dark Mode support with toggle button. In dark mode: background (#1F2937), cards (#374151), white text, primary colors stay the same' },
      ]
    }
  }
};

interface PromptGeneratorProps {
  onSelect: (prompt: string) => void;
  onClose: () => void;
}

export default function PromptGenerator({ onSelect, onClose }: PromptGeneratorProps) {
  const { language } = useAppStore();
  const templates = PROMPT_TEMPLATES[language];
  const [activeCategory, setActiveCategory] = useState<'landing' | 'sections' | 'modifications'>('landing');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [customizations, setCustomizations] = useState({
    businessName: '',
    industry: '',
    colors: '',
    extra: '',
  });

  const categories = [
    { id: 'landing' as const, icon: '🏠', label: language === 'ar' ? 'صفحات هبوط' : 'Landing Pages' },
    { id: 'sections' as const, icon: '🧩', label: language === 'ar' ? 'أقسام' : 'Sections' },
    { id: 'modifications' as const, icon: '🎨', label: language === 'ar' ? 'تعديلات' : 'Modifications' },
  ];

  const handleUsePrompt = () => {
    if (!selectedPrompt) return;
    
    let finalPrompt = selectedPrompt;
    
    // Add customizations
    const extras: string[] = [];
    if (customizations.businessName) {
      extras.push(language === 'ar' ? `اسم الشركة/المشروع: ${customizations.businessName}` : `Business name: ${customizations.businessName}`);
    }
    if (customizations.industry) {
      extras.push(language === 'ar' ? `المجال: ${customizations.industry}` : `Industry: ${customizations.industry}`);
    }
    if (customizations.colors) {
      extras.push(language === 'ar' ? `الألوان المفضلة: ${customizations.colors}` : `Preferred colors: ${customizations.colors}`);
    }
    if (customizations.extra) {
      extras.push(customizations.extra);
    }
    
    if (extras.length > 0) {
      finalPrompt += '\n\n' + (language === 'ar' ? 'تخصيصات إضافية:\n' : 'Additional customizations:\n') + extras.join('\n');
    }
    
    onSelect(finalPrompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>✨</span>
              <span>{language === 'ar' ? 'مولد البرومبتات' : 'Prompt Generator'}</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'ar' ? 'اختر قالباً وخصصه حسب احتياجك' : 'Choose a template and customize it'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Categories Sidebar */}
          <div className="w-48 border-e border-border p-3 space-y-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedPrompt(null);
                }}
                className={`w-full p-3 rounded-lg text-start transition flex items-center gap-2 ${
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary'
                }`}
              >
                <span>{cat.icon}</span>
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Templates List */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-3">{templates[activeCategory].title}</h3>
            <div className="grid gap-3">
              {templates[activeCategory].templates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPrompt(template.prompt)}
                  className={`p-4 rounded-xl text-start transition border-2 ${
                    selectedPrompt === template.prompt
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  }`}
                >
                  <h4 className="font-semibold mb-2">{template.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{template.prompt}</p>
                </button>
              ))}
            </div>

            {/* Customizations */}
            {selectedPrompt && (
              <div className="mt-6 p-4 bg-secondary/50 rounded-xl space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <span>⚙️</span>
                  <span>{language === 'ar' ? 'تخصيصات (اختياري)' : 'Customizations (optional)'}</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">
                      {language === 'ar' ? 'اسم الشركة/المشروع' : 'Business Name'}
                    </label>
                    <input
                      type="text"
                      value={customizations.businessName}
                      onChange={(e) => setCustomizations({ ...customizations, businessName: e.target.value })}
                      className="w-full p-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder={language === 'ar' ? 'مثال: شركة التقنية' : 'e.g., Tech Solutions'}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">
                      {language === 'ar' ? 'المجال' : 'Industry'}
                    </label>
                    <input
                      type="text"
                      value={customizations.industry}
                      onChange={(e) => setCustomizations({ ...customizations, industry: e.target.value })}
                      className="w-full p-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder={language === 'ar' ? 'مثال: تقنية المعلومات' : 'e.g., Information Technology'}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">
                      {language === 'ar' ? 'الألوان المفضلة' : 'Preferred Colors'}
                    </label>
                    <input
                      type="text"
                      value={customizations.colors}
                      onChange={(e) => setCustomizations({ ...customizations, colors: e.target.value })}
                      className="w-full p-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder={language === 'ar' ? 'مثال: أزرق وأبيض' : 'e.g., Blue and white'}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">
                      {language === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}
                    </label>
                    <input
                      type="text"
                      value={customizations.extra}
                      onChange={(e) => setCustomizations({ ...customizations, extra: e.target.value })}
                      className="w-full p-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder={language === 'ar' ? 'أي متطلبات أخرى...' : 'Any other requirements...'}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg hover:bg-secondary transition"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleUsePrompt}
            disabled={!selectedPrompt}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>✨</span>
            <span>{language === 'ar' ? 'استخدم هذا البرومبت' : 'Use This Prompt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
