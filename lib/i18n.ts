'use client'

// ============================================
// SOLVE IT! - Internationalization
// ============================================

import { useAppStore } from './store'

export const translations = {
  ar: {
    // App
    appName: 'Solve It!',
    tagline: 'منصة بناء المشاريع والوكلاء الذكية',
    
    // Auth
    login: 'تسجيل الدخول',
    password: 'كلمة المرور',
    enterPassword: 'أدخل كلمة المرور',
    wrongPassword: 'كلمة مرور خاطئة',
    logout: 'تسجيل الخروج',
    
    // Navigation
    dashboard: 'لوحة التحكم',
    builder: 'باني المشاريع',
    agents: 'الوكلاء',
    tools: 'الأدوات',
    workflows: 'سلاسل العمل',
    library: 'المكتبة',
    settings: 'الإعدادات',
    searchAgent: 'بحث الوكيل',
    mediaGenerator: 'مولد الوسائط',
    deploymentPanel: 'لوحة النشر',
    pluginManager: 'مدير الإضافات',
    versionHistory: 'سجل الإصدارات',
    assistant: 'المساعد الذكي',
    notes: 'الملاحظات',
    prompts: 'البرومبتات',
    theme: 'المظهر',
    light: 'فاتح',
    dark: 'داكن',
    language: 'اللغة',
    promptGenerator: 'مولد البرومبتات',
    
    // Dashboard
    welcomeBack: 'أهلاً بك!',
    totalProjects: 'المشاريع',
    totalAgents: 'الوكلاء',
    totalTools: 'الأدوات',
    totalWorkflows: 'سلاسل العمل',
    quickActions: 'إجراءات سريعة',
    recentActivity: 'النشاط الأخير',
    noActivity: 'لا يوجد نشاط حتى الآن',
    
    // Builder
    newProject: 'مشروع جديد',
    projectName: 'اسم المشروع',
    projectDescription: 'وصف المشروع',
    generateWithAI: 'توليد بالذكاء الاصطناعي',
    preview: 'معاينة',
    export: 'تصدير',
    deploy: 'نشر',
    files: 'الملفات',
    addFile: 'إضافة ملف',
    deleteFile: 'حذف الملف',
    generating: 'جاري التوليد...',
    generated: 'تم التوليد',
    describeProject: 'اوصف المشروع اللي عايزه...',
    importProject: 'استيراد مشروع',
    exportProject: 'تصدير المشروع',
    livePreview: 'معاينة مباشرة',
    codeEditor: 'محرر الكود',
    aiFix: 'إصلاح بالذكاء',
    aiGenerate: 'توليد بالذكاء',
    
    // Agents
    newAgent: 'وكيل جديد',
    agentName: 'اسم الوكيل',
    agentDescription: 'وصف الوكيل',
    systemPrompt: 'System Prompt',
    chatWith: 'محادثة مع',
    memory: 'الذاكرة',
    clearMemory: 'مسح الذاكرة',
    apiKey: 'مفتاح API',
    provider: 'المزود',
    
    // Tools
    newTool: 'أداة جديدة',
    toolName: 'اسم الأداة',
    toolDescription: 'وصف الأداة',
    httpTool: 'أداة HTTP',
    functionTool: 'أداة Function',
    testTool: 'اختبار الأداة',
    url: 'الرابط',
    method: 'الطريقة',
    headers: 'الهيدرز',
    body: 'المحتوى',
    parameters: 'المعاملات',
    
    // Workflows
    newWorkflow: 'سلسلة جديدة',
    workflowName: 'اسم السلسلة',
    workflowDescription: 'وصف السلسلة',
    addStep: 'إضافة خطوة',
    runWorkflow: 'تشغيل',
    agentStep: 'خطوة وكيل',
    toolStep: 'خطوة أداة',
    conditionStep: 'شرط',
    loopStep: 'تكرار',
    
    // Library
    libraryPrompts: 'البرومبتات',
    templates: 'القوالب',
    searchLibrary: 'ابحث في المكتبة...',
    addToFavorites: 'إضافة للمفضلة',
    removeFromFavorites: 'إزالة من المفضلة',
    copy: 'نسخ',
    copied: 'تم النسخ!',
    
    // Prompt Generator
    generatePrompts: 'توليد برومبتات',
    enterTopic: 'اكتب موضوع أو هاشتاج...',
    promptCount: 'عدد البرومبتات',
    creativity: 'الإبداعية',
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    generate: 'توليد',
    history: 'السجل',
    
    // Settings
    appearance: 'المظهر',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    settingsLanguage: 'اللغة',
    arabic: 'العربية',
    english: 'English',
    apiKeys: 'مفاتيح API',
    dataManagement: 'إدارة البيانات',
    exportData: 'تصدير البيانات',
    importData: 'استيراد البيانات',
    clearData: 'مسح البيانات',
    
    // Common
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    create: 'إنشاء',
    search: 'بحث',
    loading: 'جاري التحميل...',
    success: 'تم بنجاح',
    error: 'حدث خطأ',
    noResults: 'لا توجد نتائج',
    confirm: 'تأكيد',
    yes: 'نعم',
    no: 'لا',
    close: 'إغلاق',
    open: 'فتح',
    send: 'إرسال',
    type: 'النوع',
    name: 'الاسم',
    description: 'الوصف',
    actions: 'الإجراءات',
    status: 'الحالة',
    active: 'نشط',
    inactive: 'غير نشط',
    all: 'الكل',
    none: 'لا شيء',
    select: 'اختر',
    upload: 'رفع',
    download: 'تحميل',
    refresh: 'تحديث',
    undo: 'تراجع',
    redo: 'إعادة',
    fullscreen: 'ملء الشاشة',
    exitFullscreen: 'الخروج من ملء الشاشة',
    hd: 'HD',
    
    // AI System
    fallbackSystem: 'نظام الذكاء الاصطناعي',
    fallbackDescription: 'ترتيب الأولوية للموفرين - سيتم التبديل تلقائياً عند الحاجة',
  },
  en: {
    // App
    appName: 'Solve It!',
    tagline: 'Smart Projects & Agents Platform',
    
    // Auth
    login: 'Login',
    password: 'Password',
    enterPassword: 'Enter password',
    wrongPassword: 'Wrong password',
    logout: 'Logout',
    
    // Navigation
    dashboard: 'Dashboard',
    builder: 'Builder',
    agents: 'Agents',
    tools: 'Tools',
    workflows: 'Workflows',
    library: 'Library',
    settings: 'Settings',
    searchAgent: 'Search Agent',
    mediaGenerator: 'Media Generator',
    deploymentPanel: 'Deployment',
    pluginManager: 'Plugins',
    versionHistory: 'Version History',
    assistant: 'AI Assistant',
    notes: 'Notes',
    prompts: 'Prompts',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    language: 'Language',
    promptGenerator: 'Prompt Generator',
    
    // Dashboard
    welcomeBack: 'Welcome back!',
    totalProjects: 'Projects',
    totalAgents: 'Agents',
    totalTools: 'Tools',
    totalWorkflows: 'Workflows',
    quickActions: 'Quick Actions',
    recentActivity: 'Recent Activity',
    noActivity: 'No activity yet',
    
    // Builder
    newProject: 'New Project',
    projectName: 'Project Name',
    projectDescription: 'Project Description',
    generateWithAI: 'Generate with AI',
    preview: 'Preview',
    export: 'Export',
    deploy: 'Deploy',
    files: 'Files',
    addFile: 'Add File',
    deleteFile: 'Delete File',
    generating: 'Generating...',
    generated: 'Generated',
    describeProject: 'Describe your project...',
    importProject: 'Import Project',
    exportProject: 'Export Project',
    livePreview: 'Live Preview',
    codeEditor: 'Code Editor',
    aiFix: 'AI Fix',
    aiGenerate: 'AI Generate',
    
    // Agents
    newAgent: 'New Agent',
    agentName: 'Agent Name',
    agentDescription: 'Agent Description',
    systemPrompt: 'System Prompt',
    chatWith: 'Chat with',
    memory: 'Memory',
    clearMemory: 'Clear Memory',
    apiKey: 'API Key',
    provider: 'Provider',
    
    // Tools
    newTool: 'New Tool',
    toolName: 'Tool Name',
    toolDescription: 'Tool Description',
    httpTool: 'HTTP Tool',
    functionTool: 'Function Tool',
    testTool: 'Test Tool',
    url: 'URL',
    method: 'Method',
    headers: 'Headers',
    body: 'Body',
    parameters: 'Parameters',
    
    // Workflows
    newWorkflow: 'New Workflow',
    workflowName: 'Workflow Name',
    workflowDescription: 'Workflow Description',
    addStep: 'Add Step',
    runWorkflow: 'Run',
    agentStep: 'Agent Step',
    toolStep: 'Tool Step',
    conditionStep: 'Condition',
    loopStep: 'Loop',
    
    // Library
    libraryPrompts: 'Prompts',
    templates: 'Templates',
    searchLibrary: 'Search library...',
    addToFavorites: 'Add to favorites',
    removeFromFavorites: 'Remove from favorites',
    copy: 'Copy',
    copied: 'Copied!',
    
    // Prompt Generator
    generatePrompts: 'Generate Prompts',
    enterTopic: 'Enter topic or hashtag...',
    promptCount: 'Number of prompts',
    creativity: 'Creativity',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    generate: 'Generate',
    history: 'History',
    
    // Settings
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    settingsLanguage: 'Language',
    arabic: 'العربية',
    english: 'English',
    apiKeys: 'API Keys',
    dataManagement: 'Data Management',
    exportData: 'Export Data',
    importData: 'Import Data',
    clearData: 'Clear Data',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    noResults: 'No results',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    close: 'Close',
    open: 'Open',
    send: 'Send',
    type: 'Type',
    name: 'Name',
    description: 'Description',
    actions: 'Actions',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    all: 'All',
    none: 'None',
    select: 'Select',
    upload: 'Upload',
    download: 'Download',
    refresh: 'Refresh',
    undo: 'Undo',
    redo: 'Redo',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen',
    hd: 'HD',
    
    // AI System
    fallbackSystem: 'AI Provider System',
    fallbackDescription: 'Provider priority order - will automatically switch when needed',
  },
};

export type TranslationKey = keyof typeof translations.ar;

export function t(key: TranslationKey, lang: 'ar' | 'en' = 'ar'): string {
  return translations[lang][key] || key;
}

// React hook for translations
export function useTranslation() {
  const { language } = useAppStore()
  
  return (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.ar[key] || key
  }
}
