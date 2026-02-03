'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { translations } from '@/lib/i18n'
import { safeStorage } from '@/lib/safeStorage';

// ============================================
// PROMPT GENERATOR SERVICE
// Generate AI prompts for various purposes
// ============================================

interface PromptCategory {
  id: string
  icon: string
  nameEn: string
  nameAr: string
  descEn: string
  descAr: string
  templates: PromptTemplate[]
}

interface PromptTemplate {
  id: string
  nameEn: string
  nameAr: string
  templateEn: string
  templateAr: string
  variables: string[]
}

const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    id: 'website',
    icon: '🌐',
    nameEn: 'Website Building',
    nameAr: 'بناء المواقع',
    descEn: 'Generate prompts for website development',
    descAr: 'توليد بروبتات لتطوير المواقع',
    templates: [
      {
        id: 'landing',
        nameEn: 'Landing Page',
        nameAr: 'صفحة هبوط',
        templateEn: 'Create a professional landing page for [BUSINESS_TYPE] with:\n- Hero section with headline and CTA\n- Features section (3-4 key features)\n- Testimonials section\n- Pricing section\n- Contact form\n- Footer with social links\n\nColor scheme: [COLORS]\nStyle: [STYLE]',
        templateAr: 'أنشئ صفحة هبوط احترافية لـ [BUSINESS_TYPE] تحتوي على:\n- قسم رئيسي مع عنوان وزر دعوة للعمل\n- قسم المميزات (3-4 مميزات رئيسية)\n- قسم الشهادات\n- قسم الأسعار\n- نموذج تواصل\n- تذييل مع روابط التواصل الاجتماعي\n\nنظام الألوان: [COLORS]\nالأسلوب: [STYLE]',
        variables: ['BUSINESS_TYPE', 'COLORS', 'STYLE']
      },
      {
        id: 'portfolio',
        nameEn: 'Portfolio Website',
        nameAr: 'موقع معرض أعمال',
        templateEn: 'Create a stunning portfolio website for a [PROFESSION] with:\n- About me section with professional photo placeholder\n- Projects gallery with hover effects\n- Skills section with progress bars\n- Experience timeline\n- Contact section with form and social links\n\nTheme: [THEME]\nPersonality: [PERSONALITY]',
        templateAr: 'أنشئ موقع معرض أعمال مذهل لـ [PROFESSION] يحتوي على:\n- قسم عني مع مكان للصورة الشخصية\n- معرض المشاريع مع تأثيرات عند التمرير\n- قسم المهارات مع أشرطة التقدم\n- خط زمني للخبرات\n- قسم التواصل مع نموذج وروابط اجتماعية\n\nالثيم: [THEME]\nالشخصية: [PERSONALITY]',
        variables: ['PROFESSION', 'THEME', 'PERSONALITY']
      },
      {
        id: 'ecommerce',
        nameEn: 'E-commerce Page',
        nameAr: 'صفحة متجر إلكتروني',
        templateEn: 'Create an e-commerce product page for [PRODUCT_TYPE] with:\n- Product image gallery with zoom\n- Product title and description\n- Price with discount badge\n- Size/variant selector\n- Add to cart button with quantity\n- Customer reviews section\n- Related products carousel\n\nBrand style: [BRAND_STYLE]',
        templateAr: 'أنشئ صفحة منتج لمتجر إلكتروني لـ [PRODUCT_TYPE] تحتوي على:\n- معرض صور المنتج مع تكبير\n- عنوان ووصف المنتج\n- السعر مع شارة الخصم\n- محدد المقاس/الخيارات\n- زر إضافة للسلة مع الكمية\n- قسم تقييمات العملاء\n- منتجات ذات صلة\n\nأسلوب العلامة التجارية: [BRAND_STYLE]',
        variables: ['PRODUCT_TYPE', 'BRAND_STYLE']
      }
    ]
  },
  {
    id: 'content',
    icon: '✍️',
    nameEn: 'Content Writing',
    nameAr: 'كتابة المحتوى',
    descEn: 'Generate prompts for content creation',
    descAr: 'توليد بروبتات لإنشاء المحتوى',
    templates: [
      {
        id: 'blog',
        nameEn: 'Blog Article',
        nameAr: 'مقالة مدونة',
        templateEn: 'Write a comprehensive blog article about [TOPIC] that:\n- Engages readers from the first sentence\n- Includes practical tips and examples\n- Uses clear headings and subheadings\n- Has a word count of approximately [WORD_COUNT] words\n- Includes a call-to-action at the end\n\nTone: [TONE]\nTarget audience: [AUDIENCE]',
        templateAr: 'اكتب مقالة مدونة شاملة عن [TOPIC] تتضمن:\n- جذب القراء من الجملة الأولى\n- نصائح وأمثلة عملية\n- عناوين رئيسية وفرعية واضحة\n- عدد كلمات تقريباً [WORD_COUNT] كلمة\n- دعوة للعمل في النهاية\n\nالأسلوب: [TONE]\nالجمهور المستهدف: [AUDIENCE]',
        variables: ['TOPIC', 'WORD_COUNT', 'TONE', 'AUDIENCE']
      },
      {
        id: 'social',
        nameEn: 'Social Media Post',
        nameAr: 'منشور سوشيال ميديا',
        templateEn: 'Create a viral [PLATFORM] post about [TOPIC] that:\n- Grabs attention in the first line\n- Uses relevant emojis\n- Includes a hook and value proposition\n- Has a clear call-to-action\n- Includes relevant hashtags\n\nBrand voice: [VOICE]\nGoal: [GOAL]',
        templateAr: 'أنشئ منشور [PLATFORM] فيروسي عن [TOPIC] يتضمن:\n- جذب الانتباه في السطر الأول\n- استخدام إيموجي مناسبة\n- خطاف وقيمة مقدمة\n- دعوة واضحة للعمل\n- هاشتاجات ذات صلة\n\nصوت العلامة التجارية: [VOICE]\nالهدف: [GOAL]',
        variables: ['PLATFORM', 'TOPIC', 'VOICE', 'GOAL']
      },
      {
        id: 'email',
        nameEn: 'Marketing Email',
        nameAr: 'بريد تسويقي',
        templateEn: 'Write a marketing email for [PRODUCT/SERVICE] that:\n- Has an attention-grabbing subject line\n- Opens with a compelling hook\n- Highlights key benefits (not just features)\n- Includes social proof\n- Has a clear, single CTA\n- Creates urgency without being pushy\n\nEmail type: [TYPE]\nTarget: [TARGET]',
        templateAr: 'اكتب بريد تسويقي لـ [PRODUCT/SERVICE] يتضمن:\n- عنوان يجذب الانتباه\n- افتتاحية مقنعة\n- إبراز الفوائد الرئيسية (ليس فقط المميزات)\n- دليل اجتماعي\n- دعوة واضحة للعمل\n- خلق إحساس بالإلحاح دون إزعاج\n\nنوع البريد: [TYPE]\nالمستهدف: [TARGET]',
        variables: ['PRODUCT/SERVICE', 'TYPE', 'TARGET']
      }
    ]
  },
  {
    id: 'code',
    icon: '💻',
    nameEn: 'Code Generation',
    nameAr: 'توليد الكود',
    descEn: 'Generate prompts for coding tasks',
    descAr: 'توليد بروبتات لمهام البرمجة',
    templates: [
      {
        id: 'component',
        nameEn: 'React Component',
        nameAr: 'مكون React',
        templateEn: 'Create a React component for [COMPONENT_TYPE] that:\n- Uses TypeScript with proper types\n- Follows React best practices\n- Is fully responsive\n- Has proper accessibility (a11y)\n- Includes error handling\n- Has smooth animations\n\nStyling: [STYLING]\nState management: [STATE]',
        templateAr: 'أنشئ مكون React لـ [COMPONENT_TYPE] يتضمن:\n- استخدام TypeScript مع أنواع صحيحة\n- اتباع أفضل ممارسات React\n- تجاوب كامل\n- إمكانية وصول صحيحة (a11y)\n- معالجة الأخطاء\n- رسوم متحركة سلسة\n\nالتنسيق: [STYLING]\nإدارة الحالة: [STATE]',
        variables: ['COMPONENT_TYPE', 'STYLING', 'STATE']
      },
      {
        id: 'api',
        nameEn: 'API Endpoint',
        nameAr: 'نقطة نهاية API',
        templateEn: 'Create a REST API endpoint for [FUNCTIONALITY] that:\n- Uses [FRAMEWORK] best practices\n- Includes input validation\n- Has proper error handling with status codes\n- Includes authentication/authorization\n- Has rate limiting\n- Returns consistent response format\n\nDatabase: [DATABASE]\nAuth method: [AUTH]',
        templateAr: 'أنشئ نقطة نهاية REST API لـ [FUNCTIONALITY] تتضمن:\n- استخدام أفضل ممارسات [FRAMEWORK]\n- التحقق من المدخلات\n- معالجة أخطاء صحيحة مع رموز الحالة\n- المصادقة/التفويض\n- تحديد معدل الطلبات\n- تنسيق استجابة متسق\n\nقاعدة البيانات: [DATABASE]\nطريقة المصادقة: [AUTH]',
        variables: ['FUNCTIONALITY', 'FRAMEWORK', 'DATABASE', 'AUTH']
      },
      {
        id: 'algorithm',
        nameEn: 'Algorithm',
        nameAr: 'خوارزمية',
        templateEn: 'Write an optimized algorithm in [LANGUAGE] to [TASK] that:\n- Has O([TIME_COMPLEXITY]) time complexity\n- Is memory efficient\n- Handles edge cases\n- Includes clear comments\n- Has unit tests\n- Is production-ready',
        templateAr: 'اكتب خوارزمية محسنة بـ [LANGUAGE] لـ [TASK] تتضمن:\n- تعقيد زمني O([TIME_COMPLEXITY])\n- كفاءة في استخدام الذاكرة\n- معالجة الحالات الحدية\n- تعليقات واضحة\n- اختبارات وحدة\n- جاهزة للإنتاج',
        variables: ['LANGUAGE', 'TASK', 'TIME_COMPLEXITY']
      }
    ]
  },
  {
    id: 'image',
    icon: '🎨',
    nameEn: 'Image Generation',
    nameAr: 'توليد الصور',
    descEn: 'Generate prompts for AI image generation',
    descAr: 'توليد بروبتات لتوليد الصور بالذكاء الاصطناعي',
    templates: [
      {
        id: 'realistic',
        nameEn: 'Realistic Photo',
        nameAr: 'صورة واقعية',
        templateEn: '[SUBJECT], professional photography, [LIGHTING] lighting, [CAMERA] lens, shallow depth of field, [MOOD] atmosphere, highly detailed, 8k resolution, award-winning photography',
        templateAr: '[SUBJECT]، تصوير احترافي، إضاءة [LIGHTING]، عدسة [CAMERA]، عمق مجال ضحل، أجواء [MOOD]، تفاصيل عالية، دقة 8k، تصوير حائز على جوائز',
        variables: ['SUBJECT', 'LIGHTING', 'CAMERA', 'MOOD']
      },
      {
        id: 'illustration',
        nameEn: 'Digital Illustration',
        nameAr: 'رسم رقمي',
        templateEn: '[SUBJECT], digital illustration, [STYLE] style, vibrant colors, [ATMOSPHERE] atmosphere, trending on ArtStation, highly detailed, professional artwork, [ARTIST] inspired',
        templateAr: '[SUBJECT]، رسم رقمي، أسلوب [STYLE]، ألوان نابضة، أجواء [ATMOSPHERE]، رائج على ArtStation، تفاصيل عالية، عمل فني احترافي، مستوحى من [ARTIST]',
        variables: ['SUBJECT', 'STYLE', 'ATMOSPHERE', 'ARTIST']
      },
      {
        id: 'logo',
        nameEn: 'Logo Design',
        nameAr: 'تصميم شعار',
        templateEn: 'Logo design for [BRAND_NAME], [INDUSTRY] company, [STYLE] style, [COLORS] color scheme, minimalist, professional, scalable, memorable, unique, vector graphic',
        templateAr: 'تصميم شعار لـ [BRAND_NAME]، شركة [INDUSTRY]، أسلوب [STYLE]، ألوان [COLORS]، بسيط، احترافي، قابل للتوسع، لا يُنسى، فريد، رسم متجهات',
        variables: ['BRAND_NAME', 'INDUSTRY', 'STYLE', 'COLORS']
      }
    ]
  },
  {
    id: 'business',
    icon: '💼',
    nameEn: 'Business',
    nameAr: 'الأعمال',
    descEn: 'Generate prompts for business tasks',
    descAr: 'توليد بروبتات لمهام الأعمال',
    templates: [
      {
        id: 'pitch',
        nameEn: 'Pitch Deck Script',
        nameAr: 'نص عرض تقديمي',
        templateEn: 'Create a pitch deck script for [STARTUP_NAME], a [DESCRIPTION] startup:\n\n1. Problem slide: Define the pain point\n2. Solution slide: Our unique approach\n3. Market size: TAM/SAM/SOM\n4. Business model: How we make money\n5. Traction: Key metrics and milestones\n6. Competition: Our competitive advantage\n7. Team: Why we\'re the right team\n8. Ask: What we need ([FUNDING_AMOUNT])\n\nTone: [TONE]',
        templateAr: 'أنشئ نص عرض تقديمي لـ [STARTUP_NAME]، شركة ناشئة [DESCRIPTION]:\n\n1. شريحة المشكلة: تحديد نقطة الألم\n2. شريحة الحل: نهجنا الفريد\n3. حجم السوق: TAM/SAM/SOM\n4. نموذج العمل: كيف نربح\n5. الجذب: المقاييس والمعالم الرئيسية\n6. المنافسة: ميزتنا التنافسية\n7. الفريق: لماذا نحن الفريق المناسب\n8. الطلب: ما نحتاجه ([FUNDING_AMOUNT])\n\nالأسلوب: [TONE]',
        variables: ['STARTUP_NAME', 'DESCRIPTION', 'FUNDING_AMOUNT', 'TONE']
      },
      {
        id: 'proposal',
        nameEn: 'Business Proposal',
        nameAr: 'عرض تجاري',
        templateEn: 'Write a professional business proposal for [SERVICE] to [CLIENT_TYPE]:\n\n1. Executive Summary\n2. Understanding of needs\n3. Proposed solution\n4. Methodology & timeline\n5. Deliverables\n6. Investment & pricing\n7. About us / Why choose us\n8. Terms & conditions\n9. Next steps\n\nValue proposition: [VALUE]\nBudget range: [BUDGET]',
        templateAr: 'اكتب عرض تجاري احترافي لـ [SERVICE] إلى [CLIENT_TYPE]:\n\n1. الملخص التنفيذي\n2. فهم الاحتياجات\n3. الحل المقترح\n4. المنهجية والجدول الزمني\n5. التسليمات\n6. الاستثمار والتسعير\n7. عنا / لماذا نحن\n8. الشروط والأحكام\n9. الخطوات التالية\n\nقيمة العرض: [VALUE]\nnطاق الميزانية: [BUDGET]',
        variables: ['SERVICE', 'CLIENT_TYPE', 'VALUE', 'BUDGET']
      }
    ]
  },
  {
    id: 'education',
    icon: '📚',
    nameEn: 'Education',
    nameAr: 'التعليم',
    descEn: 'Generate prompts for educational content',
    descAr: 'توليد بروبتات للمحتوى التعليمي',
    templates: [
      {
        id: 'lesson',
        nameEn: 'Lesson Plan',
        nameAr: 'خطة درس',
        templateEn: 'Create a comprehensive lesson plan for teaching [TOPIC] to [LEVEL] students:\n\n1. Learning objectives (3-5 measurable goals)\n2. Prerequisites\n3. Introduction/Hook (5 min)\n4. Main content with activities\n5. Practice exercises\n6. Assessment methods\n7. Homework/Extension\n8. Resources needed\n\nDuration: [DURATION]\nTeaching style: [STYLE]',
        templateAr: 'أنشئ خطة درس شاملة لتدريس [TOPIC] لطلاب [LEVEL]:\n\n1. أهداف التعلم (3-5 أهداف قابلة للقياس)\n2. المتطلبات السابقة\n3. المقدمة/الجذب (5 دقائق)\n4. المحتوى الرئيسي مع الأنشطة\n5. تمارين التدريب\n6. طرق التقييم\n7. الواجب/التوسع\n8. الموارد المطلوبة\n\nالمدة: [DURATION]\nأسلوب التدريس: [STYLE]',
        variables: ['TOPIC', 'LEVEL', 'DURATION', 'STYLE']
      },
      {
        id: 'quiz',
        nameEn: 'Quiz/Test',
        nameAr: 'اختبار',
        templateEn: 'Create a [DIFFICULTY] level quiz about [TOPIC] with:\n\n1. [COUNT] multiple choice questions (4 options each)\n2. [COUNT] true/false questions\n3. [COUNT] short answer questions\n4. [COUNT] essay questions\n\nInclude:\n- Clear instructions\n- Point values\n- Answer key with explanations\n- Time limit suggestion',
        templateAr: 'أنشئ اختبار مستوى [DIFFICULTY] عن [TOPIC] يتضمن:\n\n1. [COUNT] أسئلة اختيار من متعدد (4 خيارات لكل سؤال)\n2. [COUNT] أسئلة صح/خطأ\n3. [COUNT] أسئلة إجابة قصيرة\n4. [COUNT] أسئلة مقالية\n\nيتضمن:\n- تعليمات واضحة\n- قيم النقاط\n- مفتاح الإجابة مع الشرح\n- اقتراح وقت',
        variables: ['DIFFICULTY', 'TOPIC', 'COUNT']
      }
    ]
  }
]

export default function PromptGeneratorService() {
  const { language, apiKeys } = useAppStore()
  const t = translations[language]
  
  // State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [savedPrompts, setSavedPrompts] = useState<{ id: string; name: string; prompt: string }[]>([])
  const [customPrompt, setCustomPrompt] = useState('')
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load saved prompts
  useState(() => {
    const saved = safeStorage.getItem('solveit-saved-prompts')
    if (saved) {
      try {
        setSavedPrompts(JSON.parse(saved))
      } catch (e) {}
    }
  })

  // Get current category
  const currentCategory = PROMPT_CATEGORIES.find(c => c.id === selectedCategory)

  // Generate prompt from template
  const generatePrompt = () => {
    if (!selectedTemplate) return
    
    let prompt = language === 'ar' ? selectedTemplate.templateAr : selectedTemplate.templateEn
    
    // Replace variables
    selectedTemplate.variables.forEach(v => {
      const value = variables[v] || `[${v}]`
      prompt = prompt.replace(new RegExp(`\\[${v}\\]`, 'g'), value)
    })
    
    setGeneratedPrompt(prompt)
    setEnhancedPrompt('')
  }

  // Enhance prompt with AI
  const enhancePrompt = async () => {
    const promptToEnhance = customPrompt || generatedPrompt
    if (!promptToEnhance.trim()) return
    
    const hasKeys = apiKeys.groq || apiKeys.gemini || apiKeys.claude || apiKeys.openai
    if (!hasKeys) {
      alert(language === 'ar' 
        ? 'يرجى إضافة مفتاح API في الإعدادات'
        : 'Please add an API key in Settings'
      )
      return
    }

    setIsEnhancing(true)
    
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an expert prompt engineer. Your task is to enhance and improve prompts to get better results from AI systems.

When enhancing prompts:
1. Add more specific details and context
2. Include quality modifiers and style descriptors
3. Clarify ambiguous parts
4. Add constraints to prevent unwanted outputs
5. Structure the prompt for clarity
6. Keep the original intent intact

Respond with ONLY the enhanced prompt, no explanations.`
            },
            {
              role: 'user',
              content: `Enhance this prompt for better AI results:\n\n${promptToEnhance}`
            }
          ],
          apiKeys
        })
      })

      const data = await response.json()
      setEnhancedPrompt(data.content || '')
    } catch (error) {
      console.error('Enhancement error:', error)
      alert(language === 'ar' ? 'فشل في تحسين البروبت' : 'Failed to enhance prompt')
    } finally {
      setIsEnhancing(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Save prompt
  const savePrompt = (prompt: string) => {
    const name = window.prompt(
      language === 'ar' ? 'اسم البروبت:' : 'Prompt name:',
      language === 'ar' ? 'بروبت جديد' : 'New Prompt'
    )
    if (!name) return
    
    const newPrompt = {
      id: Date.now().toString(),
      name,
      prompt
    }
    
    const updated = [...savedPrompts, newPrompt]
    setSavedPrompts(updated)
    safeStorage.setItem('solveit-saved-prompts', JSON.stringify(updated))
  }

  // Delete saved prompt
  const deleteSavedPrompt = (id: string) => {
    const updated = savedPrompts.filter(p => p.id !== id)
    setSavedPrompts(updated)
    safeStorage.setItem('solveit-saved-prompts', JSON.stringify(updated))
  }

  return (
    <div className="h-[calc(100vh-140px)] flex gap-4">
      {/* Left Panel - Categories & Templates */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        {/* Categories */}
        <div className="card flex-shrink-0">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>📚</span>
            <span>{language === 'ar' ? 'الفئات' : 'Categories'}</span>
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {PROMPT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id)
                  setSelectedTemplate(null)
                  setVariables({})
                  setGeneratedPrompt('')
                  setEnhancedPrompt('')
                }}
                className={`p-3 rounded-xl text-center transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--bg)] hover:bg-[var(--card-hover)]'
                }`}
              >
                <span className="text-2xl block mb-1">{cat.icon}</span>
                <span className="text-xs font-medium">
                  {language === 'ar' ? cat.nameAr : cat.nameEn}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Templates */}
        {currentCategory && (
          <div className="card flex-1 overflow-hidden flex flex-col">
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
              <span>{currentCategory.icon}</span>
              <span>{language === 'ar' ? currentCategory.nameAr : currentCategory.nameEn}</span>
            </h2>
            <p className="text-xs text-[var(--muted)] mb-4">
              {language === 'ar' ? currentCategory.descAr : currentCategory.descEn}
            </p>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {currentCategory.templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template)
                    setVariables({})
                    setGeneratedPrompt('')
                    setEnhancedPrompt('')
                  }}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--bg)] hover:bg-[var(--card-hover)]'
                  }`}
                >
                  <span className="font-medium block">
                    {language === 'ar' ? template.nameAr : template.nameEn}
                  </span>
                  <span className="text-xs opacity-70">
                    {template.variables.length} {language === 'ar' ? 'متغيرات' : 'variables'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Saved Prompts */}
        <div className="card flex-shrink-0 max-h-48 overflow-hidden flex flex-col">
          <h2 className="text-sm font-bold mb-2 flex items-center gap-2">
            <span>💾</span>
            <span>{language === 'ar' ? 'البروبتات المحفوظة' : 'Saved Prompts'}</span>
            <span className="text-xs text-[var(--muted)]">({savedPrompts.length})</span>
          </h2>
          
          {savedPrompts.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">
              {language === 'ar' ? 'لا توجد بروبتات محفوظة' : 'No saved prompts'}
            </p>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-1">
              {savedPrompts.map(sp => (
                <div
                  key={sp.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg)] group"
                >
                  <button
                    onClick={() => {
                      setCustomPrompt(sp.prompt)
                      setGeneratedPrompt('')
                      setEnhancedPrompt('')
                    }}
                    className="flex-1 text-left text-sm truncate hover:text-[var(--primary)]"
                  >
                    {sp.name}
                  </button>
                  <button
                    onClick={() => copyToClipboard(sp.prompt)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--card-hover)] rounded"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => deleteSavedPrompt(sp.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-400"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Generator */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Template Form or Custom Prompt */}
        <div className="card">
          {selectedTemplate ? (
            <>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>✏️</span>
                <span>{language === 'ar' ? selectedTemplate.nameAr : selectedTemplate.nameEn}</span>
              </h2>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {selectedTemplate.variables.map(v => (
                  <div key={v}>
                    <label className="text-xs text-[var(--muted)] mb-1 block">{v}</label>
                    <input
                      type="text"
                      value={variables[v] || ''}
                      onChange={(e) => setVariables({ ...variables, [v]: e.target.value })}
                      placeholder={v}
                      className="input w-full"
                    />
                  </div>
                ))}
              </div>
              
              <button
                onClick={generatePrompt}
                className="btn btn-primary w-full"
              >
                🚀 {language === 'ar' ? 'توليد البروبت' : 'Generate Prompt'}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>✍️</span>
                <span>{language === 'ar' ? 'بروبت مخصص' : 'Custom Prompt'}</span>
              </h2>
              
              <textarea
                ref={textareaRef}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={language === 'ar' ? 'اكتب البروبت الخاص بك هنا...' : 'Write your custom prompt here...'}
                className="input w-full h-32 resize-none mb-4"
              />
              
              <p className="text-xs text-[var(--muted)] text-center">
                {language === 'ar' ? 'أو اختر قالب من الفئات على اليسار' : 'Or select a template from categories on the left'}
              </p>
            </>
          )}
        </div>

        {/* Generated Prompt */}
        {(generatedPrompt || customPrompt) && (
          <div className="card flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>📝</span>
                <span>{language === 'ar' ? 'البروبت المولد' : 'Generated Prompt'}</span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(generatedPrompt || customPrompt)}
                  className="btn btn-secondary text-sm"
                >
                  📋 {language === 'ar' ? 'نسخ' : 'Copy'}
                </button>
                <button
                  onClick={() => savePrompt(generatedPrompt || customPrompt)}
                  className="btn btn-secondary text-sm"
                >
                  💾 {language === 'ar' ? 'حفظ' : 'Save'}
                </button>
                <button
                  onClick={enhancePrompt}
                  disabled={isEnhancing}
                  className="btn btn-primary text-sm"
                >
                  {isEnhancing ? '⏳' : '✨'} {language === 'ar' ? 'تحسين بالذكاء الاصطناعي' : 'AI Enhance'}
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Original Prompt */}
              <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                    {language === 'ar' ? 'الأصلي' : 'Original'}
                  </span>
                </div>
                <pre className="whitespace-pre-wrap text-sm">{generatedPrompt || customPrompt}</pre>
              </div>

              {/* Enhanced Prompt */}
              {enhancedPrompt && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium px-2 py-1 rounded bg-violet-500/20 text-violet-400">
                      ✨ {language === 'ar' ? 'محسّن' : 'Enhanced'}
                    </span>
                    <button
                      onClick={() => copyToClipboard(enhancedPrompt)}
                      className="text-xs hover:text-[var(--primary)] transition-colors"
                    >
                      📋 {language === 'ar' ? 'نسخ المحسّن' : 'Copy Enhanced'}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm">{enhancedPrompt}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!generatedPrompt && !customPrompt && (
          <div className="card flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="text-6xl block mb-4">🎯</span>
              <h3 className="text-xl font-bold mb-2">
                {language === 'ar' ? 'مولد البروبتات الذكي' : 'Smart Prompt Generator'}
              </h3>
              <p className="text-[var(--muted)] max-w-md">
                {language === 'ar'
                  ? 'اختر فئة وقالب من اليسار، أو اكتب بروبت مخصص. يمكنك تحسين أي بروبت بالذكاء الاصطناعي!'
                  : 'Choose a category and template from the left, or write a custom prompt. You can enhance any prompt with AI!'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
