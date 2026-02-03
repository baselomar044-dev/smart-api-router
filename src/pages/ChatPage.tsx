// ============================================
// 💬 CHAT PAGE v2.0 - Full ChatGPT-like Experience
// Gemini Pro + Egyptian Arabic + Memory + Vision
// ============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import {
  smartChat,
  webSearch,
  textToSpeech,
  speechToText,
  generateImage,
  generatePDF,
  generateExcel,
  generateWord,
  downloadFile,
  analyzeImage,
  addReminder,
  webScrape,
  executeCode,
  sendEmail,
  ChatMessage,
} from '../services/aiMatrix';

// ===== TYPES =====
interface Attachment {
  id: string;
  file: File;
  preview?: string;
  base64?: string;
  type: 'image' | 'audio' | 'document' | 'other';
}

interface ThinkingStep {
  id: string;
  text: string;
  textAr: string;
  status: 'pending' | 'active' | 'done' | 'error';
  startTime: number;
  endTime?: number;
}

interface GeneratedFile {
  blob: Blob;
  filename: string;
  type: string;
}

// ===== THINKING STEPS =====
const THINKING_STEPS = {
  analyzing: { text: 'Analyzing your request...', textAr: 'بحلل طلبك...' },
  searching: { text: 'Searching the web...', textAr: 'بدور في الإنترنت...' },
  generating_image: { text: 'Creating image...', textAr: 'بعمل الصورة...' },
  generating_pdf: { text: 'Creating PDF...', textAr: 'بعمل PDF...' },
  generating_excel: { text: 'Creating Excel...', textAr: 'بعمل Excel...' },
  generating_word: { text: 'Creating Word...', textAr: 'بعمل Word...' },
  executing_code: { text: 'Running code...', textAr: 'بنفذ الكود...' },
  scraping: { text: 'Reading webpage...', textAr: 'بقرأ الصفحة...' },
  transcribing: { text: 'Converting speech...', textAr: 'بحول الصوت...' },
  thinking: { text: 'Thinking...', textAr: 'بفكر...' },
  responding: { text: 'Generating response...', textAr: 'بجهز الرد...' },
  analyzing_image: { text: 'Analyzing image...', textAr: 'بحلل الصورة...' },
  sending_email: { text: 'Sending email...', textAr: 'ببعت الإيميل...' },
  remembering: { text: 'Remembering...', textAr: 'بفتكر...' },
};

// ===== COMPONENT =====
const ChatPage: React.FC = () => {
  const { 
    language, 
    conversations, 
    activeConversationId, 
    addMessage, 
    setActiveConversation, 
    createConversation,
    getMessages 
  } = useStore();
  
  const isArabic = language === 'ar';
  
  // State
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get messages
  const storeMessages = activeConversationId ? getMessages(activeConversationId) : [];
  const messages = storeMessages.length > 0 ? storeMessages : localMessages;
  
  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingSteps]);
  
  // Create conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      createConversation(isArabic ? 'محادثة جديدة' : 'New Chat');
    } else if (!activeConversationId) {
      setActiveConversation(conversations[0].id);
    }
  }, [conversations.length, activeConversationId]);

  // ===== THINKING STEP HELPERS =====
  const addThinkingStep = useCallback((key: keyof typeof THINKING_STEPS): string => {
    const step = THINKING_STEPS[key];
    const id = crypto.randomUUID();
    setThinkingSteps(prev => [...prev, {
      id,
      text: step.text,
      textAr: step.textAr,
      status: 'active',
      startTime: Date.now(),
    }]);
    return id;
  }, []);

  const updateThinkingStep = useCallback((id: string, status: 'done' | 'error') => {
    setThinkingSteps(prev => prev.map(step => 
      step.id === id ? { ...step, status, endTime: Date.now() } : step
    ));
  }, []);

  const clearThinkingSteps = useCallback(() => {
    setTimeout(() => setThinkingSteps([]), 2000);
  }, []);

  // ===== PROCESS AI COMMANDS =====
  const processAICommands = async (response: string): Promise<{ text: string; files: GeneratedFile[] }> => {
    let text = response;
    const files: GeneratedFile[] = [];
    
    // Generate PDF
    const pdfMatch = text.match(/\[GENERATE_FILE:pdf\]([^[]*)/i) || text.match(/\[PDF:([^\]]+)\]/i);
    if (pdfMatch) {
      const stepId = addThinkingStep('generating_pdf');
      try {
        const content = pdfMatch[1]?.trim() || text;
        const blob = await generatePDF({ 
          title: isArabic ? 'مستند' : 'Document', 
          sections: [{ body: content }] 
        });
        files.push({ blob, filename: 'document.pdf', type: 'pdf' });
        text = text.replace(pdfMatch[0], '');
        updateThinkingStep(stepId, 'done');
      } catch (e) {
        updateThinkingStep(stepId, 'error');
      }
    }
    
    // Generate Excel
    const excelMatch = text.match(/\[GENERATE_FILE:excel\]([^[]*)/i) || text.match(/\[EXCEL:([^\]]+)\]/i);
    if (excelMatch) {
      const stepId = addThinkingStep('generating_excel');
      try {
        const blob = await generateExcel({ 
          sheetName: isArabic ? 'ورقة 1' : 'Sheet1',
          headers: [isArabic ? 'عمود 1' : 'Column 1', isArabic ? 'عمود 2' : 'Column 2'],
          rows: [[isArabic ? 'بيانات' : 'Data', '1']]
        });
        files.push({ blob, filename: 'spreadsheet.xlsx', type: 'excel' });
        text = text.replace(excelMatch[0], '');
        updateThinkingStep(stepId, 'done');
      } catch (e) {
        updateThinkingStep(stepId, 'error');
      }
    }
    
    // Generate Word
    const wordMatch = text.match(/\[GENERATE_FILE:word\]([^[]*)/i) || text.match(/\[WORD:([^\]]+)\]/i);
    if (wordMatch) {
      const stepId = addThinkingStep('generating_word');
      try {
        const content = wordMatch[1]?.trim() || text;
        const blob = await generateWord({ title: isArabic ? 'مستند' : 'Document', sections: [{ body: content }] });
        files.push({ blob, filename: 'document.docx', type: 'word' });
        text = text.replace(wordMatch[0], '');
        updateThinkingStep(stepId, 'done');
      } catch (e) {
        updateThinkingStep(stepId, 'error');
      }
    }
    
    // Search
    const searchMatch = text.match(/\[SEARCH:([^\]]+)\]/i);
    if (searchMatch) {
      const stepId = addThinkingStep('searching');
      try {
        const results = await webSearch(searchMatch[1]);
        const resultsText = results.map((r: any) => `• ${r.title}: ${r.snippet}`).join('\n');
        text = text.replace(searchMatch[0], `\n\n📊 ${isArabic ? 'نتائج البحث:' : 'Search results:'}\n${resultsText}`);
        updateThinkingStep(stepId, 'done');
      } catch (e) {
        updateThinkingStep(stepId, 'error');
      }
    }
    
    // Image
    const imageMatch = text.match(/\[IMAGE:([^\]]+)\]/i);
    if (imageMatch) {
      const stepId = addThinkingStep('generating_image');
      try {
        const url = await generateImage(imageMatch[1]);
        text = text.replace(imageMatch[0], `\n\n🎨 ${isArabic ? 'الصورة:' : 'Image:'}\n![Generated](${url})`);
        updateThinkingStep(stepId, 'done');
      } catch (e) {
        updateThinkingStep(stepId, 'error');
      }
    }

    // Scrape
    const scrapeMatch = text.match(/\[SCRAPE:([^\]]+)\]/i);
    if (scrapeMatch) {
      const stepId = addThinkingStep('scraping');
      try {
        const content = await webScrape(scrapeMatch[1]);
        text = text.replace(scrapeMatch[0], `\n\n📄 ${isArabic ? 'محتوى الصفحة:' : 'Page content:'}\n${content.substring(0, 500)}...`);
        updateThinkingStep(stepId, 'done');
      } catch (e) {
        updateThinkingStep(stepId, 'error');
      }
    }

    // Execute Code
    const codeMatch = text.match(/\[EXECUTE_CODE:([\s\S]+?)\]/i);
    if (codeMatch) {
      const stepId = addThinkingStep('executing_code');
      try {
        const result = await executeCode(codeMatch[1]);
        text = text.replace(codeMatch[0], `\n\n💻 ${isArabic ? 'تنفيذ الكود:' : 'Code execution:'}\n${result.output || result.error}`);
        updateThinkingStep(stepId, 'done');
      } catch (e) {
        updateThinkingStep(stepId, 'error');
      }
    }

    // Send Email
    const emailMatch = text.match(/\[SEND_EMAIL:([^\|]+)\|([^\|]+)\|([^\]]+)\]/i);
    if (emailMatch) {
      const stepId = addThinkingStep('sending_email');
      try {
        await sendEmail(emailMatch[1], emailMatch[2], emailMatch[3]);
        text = text.replace(emailMatch[0], `\n\n📧 ${isArabic ? 'تم إرسال الإيميل!' : 'Email sent!'}`);
        updateThinkingStep(stepId, 'done');
      } catch (e) {
        updateThinkingStep(stepId, 'error');
      }
    }

    // Reminder
    const reminderMatch = text.match(/\[REMINDER:([^\|]+)\|([^\]]+)\]/i);
    if (reminderMatch) {
      try {
        addReminder(reminderMatch[1].trim(), reminderMatch[2].trim());
        text = text.replace(reminderMatch[0], `\n\n✅ ${isArabic ? 'تم إضافة التذكير!' : 'Reminder added!'}`);
      } catch (e) {
        console.error('Reminder failed:', e);
      }
    }
    
    return { text: text.trim(), files };
  };

  // ===== FILE TO BASE64 =====
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ===== SEND MESSAGE =====
  const handleSend = async (voiceBlob?: Blob) => {
    let userText = input.trim();
    
    // Handle voice
    if (voiceBlob) {
      const stepId = addThinkingStep('transcribing');
      try {
        userText = await speechToText(voiceBlob);
        updateThinkingStep(stepId, 'done');
      } catch (e) {
        updateThinkingStep(stepId, 'error');
        return;
      }
    }
    
    if (!userText && attachments.length === 0) return;
    
    // Get image attachments for vision
    const imageAttachments = attachments.filter(a => a.type === 'image');
    let imageBase64: string | undefined;
    
    if (imageAttachments.length > 0 && imageAttachments[0].base64) {
      imageBase64 = imageAttachments[0].base64;
    }
    
    // Add attachment info to message
    if (attachments.length > 0) {
      const nonImageAttachments = attachments.filter(a => a.type !== 'image');
      if (nonImageAttachments.length > 0) {
        userText += `\n\n[${isArabic ? 'مرفقات' : 'Attachments'}: ${nonImageAttachments.map(a => a.file.name).join(', ')}]`;
        
        // Try to read text files content
        for (const att of nonImageAttachments) {
          if (att.file.size < 500000 && ( // 500KB limit
              att.file.type.startsWith('text/') || 
              att.file.name.match(/\.(txt|md|csv|json|js|ts|tsx|py|html|css|xml|yaml|yml)$/i)
             )) {
               try {
                 const text = await new Promise<string>((resolve) => {
                   const reader = new FileReader();
                   reader.onload = (e) => resolve(e.target?.result as string);
                   reader.readAsText(att.file);
                 });
                 userText += `\n\n--- Start of ${att.file.name} ---\n${text}\n--- End of ${att.file.name} ---\n`;
               } catch (e) {
                 console.error('Failed to read file', e);
               }
          }
        }
      }
    }
    
    // Create user message
    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: userText,
      timestamp: new Date(),
      isVoice: !!voiceBlob,
      attachments: attachments.map(a => ({ name: a.file.name, type: a.type, preview: a.preview })),
    };
    
    // Add to local state immediately
    setLocalMessages(prev => [...prev, userMsg]);
    
    // Also try to add to store
    if (activeConversationId) {
      try {
        addMessage(activeConversationId, { role: 'user', content: userText, conversationId: activeConversationId });
      } catch (e) {
        console.log('Store addMessage failed, using local state');
      }
    }
    
    setInput('');
    setAttachments([]);
    setIsLoading(true);
    
    // Start thinking
    const thinkingId = addThinkingStep('thinking');
    
    try {
      // If there's an image, analyze it first
      let imageContext = '';
      if (imageBase64) {
        const analyzeId = addThinkingStep('analyzing_image');
        try {
          imageContext = await analyzeImage(imageBase64, userText || (isArabic ? 'وصفلي الصورة دي' : 'Describe this image'));
          updateThinkingStep(analyzeId, 'done');
        } catch (e) {
          updateThinkingStep(analyzeId, 'error');
        }
      }
      
      // Prepare messages for AI
      const chatHistory: ChatMessage[] = messages.slice(-10).map((m: any) => ({
        role: m.role,
        content: m.content,
      }));
      
      // Build prompt
      let prompt = userText;
      if (imageContext) {
        prompt = `[تحليل الصورة المرفقة: ${imageContext}]\n\n${userText || (isArabic ? 'إيه رأيك؟' : 'What do you think?')}`;
      }
      
      updateThinkingStep(thinkingId, 'done');
      const respondingId = addThinkingStep('responding');
      
      // Call AI with streamChat (Server-side) instead of smartChat (Client-side)
      // This fixes the "AI not working" issue by using server environment variables
      const aiResponse = await new Promise<{content: string, provider: string, model: string}>((resolve, reject) => {
        let fullText = '';
        streamChat(
          prompt,
          activeConversationId || 'temp-id',
          {
            onToken: (token) => {
              fullText += token;
              // Optional: Update UI in real-time here if we refactor localMessages to be mutable
            },
            onComplete: (text) => {
              resolve({
                content: text,
                provider: 'server-router',
                model: 'auto'
              });
            },
            onError: (err) => {
              console.error("Stream error:", err);
              // Fallback to smartChat if server fails
              console.log("Falling back to client-side smartChat...");
              smartChat([...chatHistory, { role: 'user', content: prompt }], {
                enableWebSearch: webSearchEnabled,
                language: language,
                enableMemory: true,
              }).then(resolve).catch(reject);
            }
          },
          {
            // Pass history as system prompt context or options if supported
            // For now, relying on conversationId or single-turn context
          }
        );
      });
      
      updateThinkingStep(respondingId, 'done');
      
      // Process AI commands (file generation, etc.)
      const { text: processedText, files } = await processAICommands(aiResponse.content);
      
      // Create assistant message
      const assistantMsg = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: processedText,
        timestamp: new Date(),
        generatedFiles: files,
        provider: aiResponse.provider,
        model: aiResponse.model,
      };
      
      // Add to local state
      setLocalMessages(prev => [...prev, assistantMsg]);
      
      // Also try to add to store
      if (activeConversationId) {
        try {
          addMessage(activeConversationId, { role: 'assistant', content: processedText, conversationId: activeConversationId });
        } catch (e) {
          console.log('Store addMessage failed, using local state');
        }
      }
      
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMsg = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: isArabic 
          ? `❌ في مشكلة: ${error.message}. جرب تاني.`
          : `❌ Error: ${error.message}. Please try again.`,
        timestamp: new Date(),
      };
      setLocalMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      clearThinkingSteps();
    }
  };

  // ===== ATTACHMENTS =====
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    for (const file of Array.from(files)) {
      const attachment: Attachment = {
        id: crypto.randomUUID(),
        file,
        type: file.type.startsWith('image/') ? 'image' 
            : file.type.startsWith('audio/') ? 'audio'
            : file.type.includes('document') || file.type.includes('pdf') ? 'document'
            : 'other',
      };
      
      if (attachment.type === 'image') {
        const base64 = await fileToBase64(file);
        attachment.preview = base64;
        attachment.base64 = base64;
      }
      
      setAttachments(prev => [...prev, attachment]);
    }
    
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // ===== VOICE RECORDING =====
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      alert(isArabic ? '❌ مش قادر أوصل للميكروفون. تأكد من الإذن.' : '❌ Cannot access microphone. Check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleSend(audioBlob);
      };
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // ===== TEXT TO SPEECH =====
  const speakMessage = async (text: string) => {
    try {
      const audioBlob = await textToSpeech(text);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('TTS failed:', error);
      alert(isArabic ? 'فشل تشغيل الصوت' : 'Failed to play audio');
    }
  };

  // ===== FORMAT TIME =====
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ===== RENDER =====
  return (
    <div className="flex h-full bg-white dark:bg-gray-900" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900">
          <div>
            <h2 className="text-xl font-bold truncate flex items-center gap-2">
              ✨ {isArabic ? 'Try-It!' : 'Try-It!'}
            </h2>
            <p className="text-xs text-gray-500">
              Professional AI Assistant
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
              <span className="text-sm">{isArabic ? '🔍 بحث' : '🔍 Search'}</span>
              <input
                type="checkbox"
                checked={webSearchEnabled}
                onChange={(e) => setWebSearchEnabled(e.target.checked)}
                className="w-5 h-5 accent-neutral-500"
              />
            </label>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Welcome Screen - REMOVED */}
          {messages.length === 0 && (
             <div className="text-center py-12"></div>
          )}

          {/* Message List */}
          {messages.map((msg: any) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? (isArabic ? 'justify-start' : 'justify-end') : (isArabic ? 'justify-end' : 'justify-start')}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-neutral-500 to-neutral-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}>
                {/* Voice indicator */}
                {msg.isVoice && (
                  <div className="text-xs opacity-70 mb-2 flex items-center gap-1">
                    🎤 {isArabic ? 'رسالة صوتية' : 'Voice message'}
                  </div>
                )}
                
                {/* Image Attachments Preview */}
                {msg.attachments && msg.attachments.filter((a: any) => a.type === 'image').map((att: any, i: number) => (
                  <div key={i} className="mb-3">
                    {att.preview && (
                      <img src={att.preview} alt="" className="max-h-64 rounded-xl" />
                    )}
                  </div>
                ))}
                
                {/* Other Attachments */}
                {msg.attachments && msg.attachments.filter((a: any) => a.type !== 'image').length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.attachments.filter((a: any) => a.type !== 'image').map((att: any, i: number) => (
                      <div key={i} className="text-xs bg-black/20 rounded-full px-3 py-1">
                        📎 {att.name || att}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Content */}
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                
                {/* Generated Files */}
                {msg.generatedFiles && msg.generatedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.generatedFiles.map((file: GeneratedFile, i: number) => (
                      <button
                        key={i}
                        onClick={() => downloadFile(file.blob, file.filename)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all shadow-sm"
                      >
                        📥 {isArabic ? 'تحميل' : 'Download'} {file.filename}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Provider info + Speak button */}
                {msg.role === 'assistant' && (
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() => speakMessage(msg.content)}
                      className="text-sm opacity-60 hover:opacity-100 transition-all flex items-center gap-1"
                    >
                      🔊 {isArabic ? 'استمع' : 'Listen'}
                    </button>
                    {msg.provider && (
                      <span className="text-xs opacity-40">
                        {msg.provider} • {msg.model}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking Steps Bar */}
          {thinkingSteps.length > 0 && (
            <div className="bg-gradient-to-r from-neutral-100 to-purple-50 dark:from-neutral-900/30 dark:to-purple-900/30 rounded-2xl p-4 border border-neutral-300 dark:border-neutral-800 shadow-sm">
              <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-3 flex items-center gap-2">
                🧠 {isArabic ? 'بفكر...' : 'Thinking...'}
              </div>
              <div className="space-y-2">
                {thinkingSteps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3 text-sm">
                    {step.status === 'active' && (
                      <div className="w-4 h-4 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {step.status === 'done' && <span className="text-green-500 text-lg">✓</span>}
                    {step.status === 'error' && <span className="text-red-500 text-lg">✗</span>}
                    {step.status === 'pending' && <span className="text-gray-400">○</span>}
                    <span className={step.status === 'active' ? 'text-neutral-600 dark:text-neutral-300 font-medium' : ''}>
                      {isArabic ? step.textAr : step.text}
                    </span>
                    {step.endTime && (
                      <span className="text-xs text-gray-400 ml-auto">
                        ({((step.endTime - step.startTime) / 1000).toFixed(1)}s)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && thinkingSteps.length === 0 && (
            <div className={`flex ${isArabic ? 'justify-end' : 'justify-start'}`}>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex flex-wrap gap-3">
              {attachments.map(att => (
                <div key={att.id} className="relative group">
                  {att.type === 'image' && att.preview ? (
                    <img src={att.preview} alt="" className="h-20 w-20 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-600" />
                  ) : (
                    <div className="h-20 w-20 bg-gray-200 dark:bg-gray-600 rounded-xl flex items-center justify-center text-2xl">
                      {att.type === 'audio' ? '🎵' : att.type === 'document' ? '📄' : '📎'}
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm shadow-lg hover:bg-red-600 transition-all"
                  >
                    ✕
                  </button>
                  <div className="text-xs truncate w-20 text-center mt-1">{att.file.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          {isRecording ? (
            /* Recording UI */
            <div className="flex items-center justify-center gap-6 py-4 bg-red-50 dark:bg-red-900/20 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-600 dark:text-red-400 font-mono text-xl">{formatTime(recordingTime)}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelRecording}
                  className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all"
                >
                  {isArabic ? '❌ إلغاء' : '❌ Cancel'}
                </button>
                <button
                  onClick={stopRecording}
                  className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all"
                >
                  {isArabic ? '✓ إرسال' : '✓ Send'}
                </button>
              </div>
            </div>
          ) : (
            /* Normal Input UI */
            <div className="flex items-center gap-3">
              {/* Attachment Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-500 hover:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900/30 rounded-xl transition-all"
                title={isArabic ? 'إرفاق ملف / صورة' : 'Attach file / image'}
              >
                📎
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* Voice Button */}
              <button
                onClick={startRecording}
                className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                title={isArabic ? 'رسالة صوتية' : 'Voice message'}
              >
                🎤
              </button>
              
              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={isArabic ? 'اكتب رسالتك... (عربي/English/Franko)' : 'Type a message... (Arabic/English/Franko)'}
                className="flex-1 px-5 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-neutral-500 focus:border-transparent outline-none transition-all"
                disabled={isLoading}
              />
              
              {/* Send Button */}
              <button
                onClick={() => handleSend()}
                disabled={isLoading || (!input.trim() && attachments.length === 0)}
                className="p-3 bg-gradient-to-r from-neutral-500 to-purple-600 text-white rounded-xl hover:from-neutral-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="font-bold">{isArabic ? 'إرسال' : 'Send'}</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
