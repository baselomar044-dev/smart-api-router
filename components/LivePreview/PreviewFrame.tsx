'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface PreviewFrameProps {
  html: string;
  css: string;
  javascript: string;
  isReact?: boolean;
  onError?: (error: ConsoleMessage) => void;
  onLog?: (log: ConsoleMessage) => void;
  viewportSize: 'mobile' | 'tablet' | 'desktop' | 'full';
}

export interface ConsoleMessage {
  type: 'error' | 'warn' | 'log' | 'info';
  message: string;
  timestamp: Date;
}

const viewportDimensions = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
  full: { width: '100%', height: '100%' },
};

export default function PreviewFrame({ html, css, javascript, isReact = false, onError, onLog, viewportSize }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const buildPreviewDoc = useCallback(() => {
    const consoleScript = `
      const originalConsole = { log: console.log, error: console.error, warn: console.warn, info: console.info };
      ['log', 'error', 'warn', 'info'].forEach(type => {
        console[type] = (...args) => {
          originalConsole[type](...args);
          window.parent.postMessage({ type: 'console', level: type, message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
        };
      });
      window.onerror = (msg, url, line) => {
        window.parent.postMessage({ type: 'console', level: 'error', message: msg + ' (line ' + line + ')' }, '*');
        return true;
      };
    `;

    if (isReact) {
      return `<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif}${css}</style>
</head><body>
  <div id="root"></div>
  <script>${consoleScript}</script>
  <script type="text/babel">${javascript}</script>
</body></html>`;
    }

    return `<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif}${css}</style>
</head><body>
  ${html}
  <script>${consoleScript}</script>
  <script>${javascript}</script>
</body></html>`;
  }, [html, css, javascript, isReact]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console') {
        const msg: ConsoleMessage = { type: event.data.level, message: event.data.message, timestamp: new Date() };
        if (event.data.level === 'error' && onError) onError(msg);
        else if (onLog) onLog(msg);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onError, onLog]);

  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = buildPreviewDoc();
        setIsLoading(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [buildPreviewDoc]);

  const dimensions = viewportDimensions[viewportSize];
  const isFull = viewportSize === 'full';

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gray-800 overflow-auto p-4">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
          <div className="flex items-center gap-2 text-white">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Updating...</span>
          </div>
        </div>
      )}
      
      <div
        className={`bg-white shadow-2xl transition-all duration-300 ${isFull ? 'w-full h-full' : 'rounded-lg overflow-hidden'}`}
        style={isFull ? {} : { width: dimensions.width, height: dimensions.height, maxWidth: '100%', maxHeight: '100%' }}
      >
        {!isFull && (
          <div className="bg-gray-200 px-3 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-500 text-center">
              Preview - {viewportSize}
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          className="w-full bg-white border-0"
          style={{ height: isFull ? '100%' : `calc(100% - 36px)` }}
          sandbox="allow-scripts allow-modals"
          title="Preview"
        />
      </div>
    </div>
  );
}
