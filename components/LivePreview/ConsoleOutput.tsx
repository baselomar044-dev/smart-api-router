'use client';

import { useRef, useEffect } from 'react';
import { ConsoleMessage } from './PreviewFrame';

interface ConsoleOutputProps {
  messages: ConsoleMessage[];
  onClear: () => void;
  onAIFix?: (error: string) => void;
}

export default function ConsoleOutput({ messages, onClear, onAIFix }: ConsoleOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const getTypeStyles = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error': return 'bg-red-500/20 text-red-400 border-l-red-500';
      case 'warn': return 'bg-yellow-500/20 text-yellow-400 border-l-yellow-500';
      case 'info': return 'bg-blue-500/20 text-blue-400 border-l-blue-500';
      default: return 'bg-gray-500/10 text-gray-300 border-l-gray-500';
    }
  };

  const getTypeIcon = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  const errorCount = messages.filter(m => m.type === 'error').length;
  const warnCount = messages.filter(m => m.type === 'warn').length;

  return (
    <div className="flex flex-col h-full bg-gray-900 border-t border-gray-700">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-gray-300 font-medium text-sm">Console</span>
          {errorCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium">
              {errorCount} error{errorCount > 1 ? 's' : ''}
            </span>
          )}
          {warnCount > 0 && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
              {warnCount} warning{warnCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {errorCount > 0 && onAIFix && (
            <button
              onClick={() => {
                const lastError = messages.filter(m => m.type === 'error').pop();
                if (lastError) onAIFix(lastError.message);
              }}
              className="px-2 py-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded text-xs font-medium transition-colors flex items-center gap-1"
            >
              🤖 AI Fix
            </button>
          )}
          <button
            onClick={onClear}
            className="px-2 py-1 bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-300 rounded text-xs font-medium transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-2 space-y-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            Console output will appear here...
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`px-3 py-2 rounded border-l-2 font-mono text-xs ${getTypeStyles(msg.type)}`}>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0">{getTypeIcon(msg.type)}</span>
                <span className="flex-1 break-all whitespace-pre-wrap">{msg.message}</span>
                <span className="flex-shrink-0 text-gray-600 text-[10px]">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
