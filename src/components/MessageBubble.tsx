import React from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
}

interface MessageBubbleProps {
  message: Message;
  isDark?: boolean;
  isStreaming?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isDark = true,
  isStreaming = false 
}) => {
  const isUser = message.role === 'user';
  
  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    // Handle code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeContent = part.slice(3, -3);
        const firstLineEnd = codeContent.indexOf('\n');
        const language = firstLineEnd > 0 ? codeContent.slice(0, firstLineEnd).trim() : '';
        const code = firstLineEnd > 0 ? codeContent.slice(firstLineEnd + 1) : codeContent;
        
        return (
          <div key={index} className="my-3 rounded-xl overflow-hidden">
            {language && (
              <div className={`px-4 py-2 text-xs font-mono ${
                isDark ? 'bg-slate-900 text-gray-400' : 'bg-gray-800 text-gray-400'
              }`}>
                {language}
              </div>
            )}
            <pre className={`p-4 overflow-x-auto text-sm ${
              isDark ? 'bg-slate-950 text-gray-200' : 'bg-gray-900 text-gray-200'
            }`}>
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      
      // Handle inline formatting
      let text = part;
      
      // Bold
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Italic
      text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Inline code
      text = text.replace(/`([^`]+)`/g, `<code class="px-1.5 py-0.5 rounded ${
        isDark ? 'bg-slate-700 text-neutral-200' : 'bg-gray-200 text-neutral-600'
      } text-sm font-mono">$1</code>`);
      
      // Line breaks
      text = text.replace(/\n/g, '<br/>');
      
      return (
        <span 
          key={index} 
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`max-w-[85%] md:max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-neutral-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-sm">🤖</span>
            </div>
            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Try-it! AI
            </span>
            {message.model && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isDark ? 'bg-slate-700 text-gray-400' : 'bg-gray-200 text-gray-500'
              }`}>
                {message.model}
              </span>
            )}
          </div>
        )}
        
        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gradient-to-br from-neutral-500 to-purple-600 text-white rounded-tr-md shadow-lg'
              : isDark
                ? 'bg-slate-800 text-gray-100 border border-slate-700 rounded-tl-md'
                : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-tl-md'
          }`}
        >
          <div className={`prose prose-sm max-w-none ${
            isUser 
              ? 'prose-invert' 
              : isDark 
                ? 'prose-invert' 
                : ''
          }`}>
            {renderContent(message.content)}
          </div>
          
          {/* Streaming indicator */}
          {isStreaming && (
            <span className="inline-flex ml-1">
              <span className="animate-pulse">●</span>
            </span>
          )}
        </div>
        
        {/* Timestamp */}
        <div className={`flex items-center gap-2 mt-1 text-xs ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        } ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span>
            {message.timestamp.toLocaleTimeString('ar-SA', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          {message.tokens && (
            <span>• {message.tokens} tokens</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
