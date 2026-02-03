'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'html' | 'css' | 'javascript' | 'jsx';
  theme?: 'dark' | 'light';
  readOnly?: boolean;
}

// Lightweight syntax highlighting
const highlightCode = (code: string, language: string): string => {
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const patterns: Record<string, [RegExp, string][]> = {
    html: [
      [/(&lt;\/?[\w-]+)/g, '<span class="text-pink-400">$1</span>'],
      [/([\w-]+)=/g, '<span class="text-yellow-300">$1</span>='],
      [/"([^"]*)"/g, '<span class="text-green-400">"$1"</span>'],
      [/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-gray-500">$1</span>'],
    ],
    css: [
      [/([\w-]+)\s*:/g, '<span class="text-cyan-400">$1</span>:'],
      [/([.#][\w-]+)/g, '<span class="text-yellow-300">$1</span>'],
      [/(\/\*[\s\S]*?\*\/)/g, '<span class="text-gray-500">$1</span>'],
    ],
    javascript: [
      [/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|try|catch|throw|new)\b/g, '<span class="text-purple-400">$1</span>'],
      [/\b(true|false|null|undefined|this)\b/g, '<span class="text-orange-400">$1</span>'],
      [/"([^"]*)"/g, '<span class="text-green-400">"$1"</span>'],
      [/'([^']*)'/g, '<span class="text-green-400">\'$1\'</span>'],
      [/\/\/.*$/gm, '<span class="text-gray-500">$&</span>'],
      [/\b(\d+)\b/g, '<span class="text-orange-300">$1</span>'],
      [/\b(console|document|window)\b/g, '<span class="text-cyan-400">$1</span>'],
    ],
    jsx: [
      [/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await)\b/g, '<span class="text-purple-400">$1</span>'],
      [/\b(true|false|null|undefined|this)\b/g, '<span class="text-orange-400">$1</span>'],
      [/(&lt;\/?[\w]+)/g, '<span class="text-pink-400">$1</span>'],
      [/([\w]+)=/g, '<span class="text-yellow-300">$1</span>='],
      [/"([^"]*)"/g, '<span class="text-green-400">"$1"</span>'],
      [/\/\/.*$/gm, '<span class="text-gray-500">$&</span>'],
      [/\b(useState|useEffect|useRef|useCallback|useMemo)\b/g, '<span class="text-cyan-400">$1</span>'],
    ],
  };

  const langPatterns = patterns[language] || patterns.javascript;
  langPatterns.forEach(([regex, replacement]) => {
    highlighted = highlighted.replace(regex, replacement);
  });

  return highlighted;
};

export default function CodeEditor({ value, onChange, language, theme = 'dark', readOnly = false }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && preRef.current && lineNumbersRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  useEffect(() => {
    setLineCount(value.split('\n').length);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className="relative flex bg-gray-900 border-gray-700 border rounded-lg overflow-hidden font-mono text-sm h-full">
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="text-gray-600 select-none text-right pr-3 pl-3 py-3 border-r border-gray-700 overflow-hidden"
        style={{ minWidth: '3rem' }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i + 1} className="leading-6">{i + 1}</div>
        ))}
      </div>

      {/* Code Area */}
      <div className="relative flex-1 overflow-hidden">
        <pre
          ref={preRef}
          className="absolute inset-0 p-3 overflow-auto pointer-events-none text-gray-100 leading-6 whitespace-pre"
          dangerouslySetInnerHTML={{ __html: highlightCode(value, language) + '\n' }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          className="absolute inset-0 w-full h-full p-3 bg-transparent text-transparent caret-white resize-none outline-none leading-6 whitespace-pre overflow-auto"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>
    </div>
  );
}
