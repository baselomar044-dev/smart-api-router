import React, { useRef, useEffect } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isLoading?: boolean;
  isDark?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onStop,
  isLoading = false,
  isDark = true,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className={`border-t ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'} p-4`}>
      <div className={`max-w-4xl mx-auto`}>
        <div className={`flex items-end gap-3 rounded-2xl ${
          isDark ? 'bg-slate-900 border border-slate-700' : 'bg-gray-50 border border-gray-200'
        } p-3 shadow-lg`}>
          {/* Attachment Button */}
          <button
            className={`p-2 rounded-xl transition ${
              isDark 
                ? 'hover:bg-slate-700 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
            }`}
            title="إرفاق ملف"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك هنا... (Enter للإرسال)"
              rows={1}
              className={`w-full resize-none bg-transparent outline-none ${
                isDark ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'
              } text-base leading-6`}
              style={{ maxHeight: '200px' }}
              disabled={isLoading}
              dir="auto"
            />
          </div>

          {/* Voice Button */}
          <button
            className={`p-2 rounded-xl transition ${
              isDark 
                ? 'hover:bg-slate-700 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
            }`}
            title="تسجيل صوتي"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* Send/Stop Button */}
          {isLoading ? (
            <button
              onClick={onStop}
              className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition shadow-lg flex items-center justify-center"
              title="إيقاف"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!value.trim()}
              className={`p-3 rounded-xl transition shadow-lg flex items-center justify-center ${
                value.trim()
                  ? 'bg-gradient-to-r from-neutral-500 to-purple-600 hover:opacity-90 text-white'
                  : isDark
                    ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title="إرسال"
            >
              <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>

        {/* Helper text */}
        <div className={`flex items-center justify-between mt-2 text-xs ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <span>
            💡 Shift+Enter لسطر جديد
          </span>
          <span>
            🆓 مجاني بالكامل • بدون حدود
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
