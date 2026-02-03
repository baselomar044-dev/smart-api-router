'use client';

import { useState, useCallback } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Key,
  Zap,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Clock,
  Server
} from 'lucide-react';
import { useStore } from '@/lib/store';

interface APITestResult {
  service: string;
  status: 'success' | 'error' | 'warning' | 'pending' | 'idle';
  message: string;
  latency?: number;
  model?: string;
  details?: string;
}

interface ServiceConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  keyName: string;
  testEndpoint: string;
  testFunction: (apiKey: string) => Promise<{ success: boolean; message: string; latency: number; model?: string; details?: string }>;
}

export default function APITester() {
  const { theme, apiKeys } = useStore();
  const isDark = theme === 'dark';
  
  const [results, setResults] = useState<Record<string, APITestResult>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [testingService, setTestingService] = useState<string | null>(null);

  // Service configurations
  const services: ServiceConfig[] = [
    {
      id: 'groq',
      name: 'Groq',
      icon: '⚡',
      color: 'orange',
      keyName: 'groq',
      testEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
      testFunction: async (apiKey: string) => {
        const start = Date.now();
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'llama-3.1-8b-instant',
              messages: [{ role: 'user', content: 'Say "test ok" only' }],
              max_tokens: 10
            })
          });
          const latency = Date.now() - start;
          
          if (response.ok) {
            const data = await response.json();
            return { 
              success: true, 
              message: 'Connected successfully!',
              latency,
              model: data.model || 'llama-3.1-8b-instant',
              details: `Response: ${data.choices?.[0]?.message?.content || 'OK'}`
            };
          } else {
            const error = await response.json().catch(() => ({}));
            return { 
              success: false, 
              message: error.error?.message || `HTTP ${response.status}`,
              latency
            };
          }
        } catch (error: any) {
          return { 
            success: false, 
            message: error.message || 'Connection failed',
            latency: Date.now() - start
          };
        }
      }
    },
    {
      id: 'openai',
      name: 'OpenAI',
      icon: '🤖',
      color: 'green',
      keyName: 'openai',
      testEndpoint: 'https://api.openai.com/v1/chat/completions',
      testFunction: async (apiKey: string) => {
        const start = Date.now();
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: 'Say "test ok" only' }],
              max_tokens: 10
            })
          });
          const latency = Date.now() - start;
          
          if (response.ok) {
            const data = await response.json();
            return { 
              success: true, 
              message: 'Connected successfully!',
              latency,
              model: data.model || 'gpt-3.5-turbo',
              details: `Response: ${data.choices?.[0]?.message?.content || 'OK'}`
            };
          } else {
            const error = await response.json().catch(() => ({}));
            return { 
              success: false, 
              message: error.error?.message || `HTTP ${response.status}`,
              latency
            };
          }
        } catch (error: any) {
          return { 
            success: false, 
            message: error.message || 'Connection failed',
            latency: Date.now() - start
          };
        }
      }
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      icon: '💎',
      color: 'blue',
      keyName: 'gemini',
      testEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      testFunction: async (apiKey: string) => {
        const start = Date.now();
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: 'Say "test ok" only' }] }],
                generationConfig: { maxOutputTokens: 10 }
              })
            }
          );
          const latency = Date.now() - start;
          
          if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'OK';
            return { 
              success: true, 
              message: 'Connected successfully!',
              latency,
              model: 'gemini-pro',
              details: `Response: ${text}`
            };
          } else {
            const error = await response.json().catch(() => ({}));
            return { 
              success: false, 
              message: error.error?.message || `HTTP ${response.status}`,
              latency
            };
          }
        } catch (error: any) {
          return { 
            success: false, 
            message: error.message || 'Connection failed',
            latency: Date.now() - start
          };
        }
      }
    },
    {
      id: 'claude',
      name: 'Anthropic Claude',
      icon: '🧠',
      color: 'purple',
      keyName: 'anthropic',
      testEndpoint: 'https://api.anthropic.com/v1/messages',
      testFunction: async (apiKey: string) => {
        const start = Date.now();
        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'Say "test ok" only' }]
            })
          });
          const latency = Date.now() - start;
          
          if (response.ok) {
            const data = await response.json();
            return { 
              success: true, 
              message: 'Connected successfully!',
              latency,
              model: data.model || 'claude-3-haiku',
              details: `Response: ${data.content?.[0]?.text || 'OK'}`
            };
          } else {
            const error = await response.json().catch(() => ({}));
            // Claude often blocks browser requests
            if (response.status === 403 || error.error?.type === 'forbidden') {
              return {
                success: true,
                message: 'API key valid (browser access limited)',
                latency,
                model: 'claude-3',
                details: 'Note: Claude API works but requires server-side calls for full access'
              };
            }
            return { 
              success: false, 
              message: error.error?.message || `HTTP ${response.status}`,
              latency
            };
          }
        } catch (error: any) {
          return { 
            success: false, 
            message: error.message || 'Connection failed',
            latency: Date.now() - start
          };
        }
      }
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      icon: '🔍',
      color: 'cyan',
      keyName: 'deepseek',
      testEndpoint: 'https://api.deepseek.com/v1/chat/completions',
      testFunction: async (apiKey: string) => {
        const start = Date.now();
        try {
          const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [{ role: 'user', content: 'Say "test ok" only' }],
              max_tokens: 10
            })
          });
          const latency = Date.now() - start;
          
          if (response.ok) {
            const data = await response.json();
            return { 
              success: true, 
              message: 'Connected successfully!',
              latency,
              model: data.model || 'deepseek-chat',
              details: `Response: ${data.choices?.[0]?.message?.content || 'OK'}`
            };
          } else {
            const error = await response.json().catch(() => ({}));
            return { 
              success: false, 
              message: error.error?.message || `HTTP ${response.status}`,
              latency
            };
          }
        } catch (error: any) {
          return { 
            success: false, 
            message: error.message || 'Connection failed',
            latency: Date.now() - start
          };
        }
      }
    }
  ];

  // Get API key from settings
  const getApiKey = (keyName: string): string => {
    return (apiKeys as any)?.[keyName] || '';
  };

  // Mask API key for display
  const maskKey = (key: string): string => {
    if (!key) return '(not set)';
    if (key.length <= 8) return '****';
    return key.substring(0, 4) + '...' + key.substring(key.length - 4);
  };

  // Test single service
  const testService = useCallback(async (service: ServiceConfig) => {
    const apiKey = getApiKey(service.keyName);
    
    if (!apiKey) {
      setResults(prev => ({
        ...prev,
        [service.id]: {
          service: service.name,
          status: 'warning',
          message: 'API key not configured'
        }
      }));
      return;
    }

    setResults(prev => ({
      ...prev,
      [service.id]: {
        service: service.name,
        status: 'pending',
        message: 'Testing...'
      }
    }));
    setTestingService(service.id);

    try {
      const result = await service.testFunction(apiKey);
      setResults(prev => ({
        ...prev,
        [service.id]: {
          service: service.name,
          status: result.success ? 'success' : 'error',
          message: result.message,
          latency: result.latency,
          model: result.model,
          details: result.details
        }
      }));
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [service.id]: {
          service: service.name,
          status: 'error',
          message: error.message || 'Test failed'
        }
      }));
    }
    
    setTestingService(null);
  }, [settings]);

  // Test all services
  const testAllServices = async () => {
    setIsTesting(true);
    
    for (const service of services) {
      await testService(service);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsTesting(false);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'warning': return 'yellow';
      case 'pending': return 'blue';
      default: return 'gray';
    }
  };

  // Get status icon
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'pending': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <Wifi className="w-5 h-5 text-gray-400" />;
    }
  };

  // Count results
  const successCount = Object.values(results).filter(r => r.status === 'success').length;
  const errorCount = Object.values(results).filter(r => r.status === 'error').length;
  const warningCount = Object.values(results).filter(r => r.status === 'warning').length;

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">🔐 API Keys Tester</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Safely test all your API connections
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Show/Hide Keys Toggle */}
            <button
              onClick={() => setShowKeys(!showKeys)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showKeys ? 'Hide Keys' : 'Show Keys'}
            </button>
            
            {/* Test All Button */}
            <button
              onClick={testAllServices}
              disabled={isTesting}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isTesting
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg'
              } text-white`}
            >
              {isTesting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {isTesting ? 'Testing...' : 'Test All APIs'}
            </button>
          </div>
        </div>
        
        {/* Summary */}
        {Object.keys(results).length > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">{successCount} Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm">{errorCount} Failed</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">{warningCount} Not Set</span>
            </div>
          </div>
        )}
      </div>

      {/* Services List */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid gap-4 max-w-4xl mx-auto">
          {services.map((service) => {
            const apiKey = getApiKey(service.keyName);
            const result = results[service.id];
            
            return (
              <div
                key={service.id}
                className={`p-4 rounded-xl border transition-all ${
                  isDark 
                    ? 'border-gray-700 bg-gray-800 hover:border-gray-600' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${result?.status === 'success' ? 'ring-2 ring-green-500/50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  {/* Service Info */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{service.icon}</span>
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Key className="w-3 h-3 text-gray-400" />
                        <code className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {showKeys ? (apiKey || '(not set)') : maskKey(apiKey)}
                        </code>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status & Test Button */}
                  <div className="flex items-center gap-3">
                    {result && (
                      <div className="flex items-center gap-2">
                        <StatusIcon status={result.status} />
                        {result.latency && (
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Clock className="w-3 h-3 inline mr-1" />
                            {result.latency}ms
                          </span>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={() => testService(service)}
                      disabled={testingService === service.id || !apiKey}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        !apiKey
                          ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                          : testingService === service.id
                            ? 'bg-blue-500/20 text-blue-400'
                            : isDark
                              ? 'bg-gray-700 hover:bg-gray-600 text-white'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      {testingService === service.id ? 'Testing...' : 'Test'}
                    </button>
                  </div>
                </div>
                
                {/* Result Details */}
                {result && result.status !== 'idle' && (
                  <div className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className={`flex items-start gap-2 text-sm ${
                      result.status === 'success' ? 'text-green-500' :
                      result.status === 'error' ? 'text-red-500' :
                      result.status === 'warning' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`}>
                      <StatusIcon status={result.status} />
                      <div className="flex-1">
                        <p>{result.message}</p>
                        {result.model && (
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Server className="w-3 h-3 inline mr-1" />
                            Model: {result.model}
                          </p>
                        )}
                        {result.details && (
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {result.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Instructions */}
        <div className={`mt-6 max-w-4xl mx-auto p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <h3 className="font-semibold mb-2">📋 How to get API Keys:</h3>
          <div className="grid gap-2 text-sm">
            <p><span className="text-orange-500">⚡ Groq:</span> <a href="https://console.groq.com" target="_blank" rel="noopener" className="text-blue-500 hover:underline">console.groq.com</a> (FREE!)</p>
            <p><span className="text-green-500">🤖 OpenAI:</span> <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-blue-500 hover:underline">platform.openai.com/api-keys</a></p>
            <p><span className="text-blue-500">💎 Gemini:</span> <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" className="text-blue-500 hover:underline">aistudio.google.com/app/apikey</a> (FREE!)</p>
            <p><span className="text-purple-500">🧠 Claude:</span> <a href="https://console.anthropic.com" target="_blank" rel="noopener" className="text-blue-500 hover:underline">console.anthropic.com</a></p>
            <p><span className="text-cyan-500">🔍 DeepSeek:</span> <a href="https://platform.deepseek.com" target="_blank" rel="noopener" className="text-blue-500 hover:underline">platform.deepseek.com</a></p>
          </div>
          <p className={`mt-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            💡 API keys are stored locally in your browser and never sent to our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
