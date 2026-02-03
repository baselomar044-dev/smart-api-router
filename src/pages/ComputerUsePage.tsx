// ============================================
// 🖥️ COMPUTER USE PAGE - Try-It! v2.0
// Full-featured remote desktop control with E2B Sandbox
// ============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Monitor, Mouse, Keyboard, Power, PowerOff,
  Maximize2, Minimize2, RefreshCw, Camera, 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Settings, Send, Loader2, Terminal,
  FileText, Folder, Globe, Code, Play, Square, Download,
  Upload, Copy, Trash2, Edit3, Save, X, Check, AlertCircle,
  Wifi, WifiOff, Cpu, HardDrive, Clock, Activity
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { getTheme, isDarkTheme } from '../lib/themes';
import { smartChat, ChatMessage } from '../services/aiMatrix';

// ============================================
// TYPES
// ============================================

interface SandboxFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
}

interface CommandResult {
  command: string;
  output: string;
  exitCode: number;
  timestamp: Date;
  duration: number;
}

interface SessionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  sandboxId?: string;
  screenUrl?: string;
  error?: string;
  cursorX: number;
  cursorY: number;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  labelAr: string;
  command: string;
  category: 'browser' | 'files' | 'terminal' | 'code' | 'system';
}

// ============================================
// CONSTANTS
// ============================================

const QUICK_ACTIONS: QuickAction[] = [
  // Browser
  { icon: <Globe size={16} />, label: 'Open Chrome', labelAr: 'فتح Chrome', command: 'google-chrome --no-sandbox &', category: 'browser' },
  { icon: <Globe size={16} />, label: 'Open Firefox', labelAr: 'فتح Firefox', command: 'firefox &', category: 'browser' },
  
  // Files
  { icon: <Folder size={16} />, label: 'File Manager', labelAr: 'مدير الملفات', command: 'nautilus . &', category: 'files' },
  { icon: <FileText size={16} />, label: 'Text Editor', labelAr: 'محرر النصوص', command: 'gedit &', category: 'files' },
  
  // Terminal
  { icon: <Terminal size={16} />, label: 'New Terminal', labelAr: 'Terminal جديد', command: 'gnome-terminal &', category: 'terminal' },
  { icon: <Code size={16} />, label: 'VS Code', labelAr: 'VS Code', command: 'code --no-sandbox . &', category: 'code' },
  
  // System
  { icon: <Settings size={16} />, label: 'System Settings', labelAr: 'إعدادات النظام', command: 'gnome-control-center &', category: 'system' },
  { icon: <Activity size={16} />, label: 'System Monitor', labelAr: 'مراقب النظام', command: 'gnome-system-monitor &', category: 'system' },
];

const SANDBOX_TEMPLATES = [
  { id: 'python', name: 'Python', nameAr: 'بايثون', icon: '🐍' },
  { id: 'nodejs', name: 'Node.js', nameAr: 'نود', icon: '💚' },
  { id: 'browser', name: 'Browser', nameAr: 'متصفح', icon: '🌐' },
  { id: 'ubuntu', name: 'Ubuntu Desktop', nameAr: 'سطح مكتب أوبونتو', icon: '🐧' },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function ComputerUsePage() {
  const navigate = useNavigate();
  const { theme, language } = useStore();
  const colors = getTheme(theme);
  const isDark = isDarkTheme(theme);
  const isAr = language === 'ar';
  
  // Session state
  const [session, setSession] = useState<SessionState>({
    status: 'disconnected',
    cursorX: 50,
    cursorY: 50,
    uptime: 0,
    cpuUsage: 0,
    memoryUsage: 0,
  });
  
  // UI state
  const [selectedTemplate, setSelectedTemplate] = useState('ubuntu');
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandHistory, setCommandHistory] = useState<CommandResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'terminal' | 'files' | 'ai'>('terminal');
  const [files, setFiles] = useState<SandboxFile[]>([]);
  const [currentPath, setCurrentPath] = useState('/home/user');
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs
  const screenRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US');
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    setLogs(prev => [...prev.slice(-99), `[${timestamp}] ${icon} ${message}`]);
  }, [isAr]);
  
  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);
  
  // Update uptime
  useEffect(() => {
    if (session.status !== 'connected') return;
    
    const interval = setInterval(() => {
      setSession(s => ({ 
        ...s, 
        uptime: s.uptime + 1,
        cpuUsage: Math.min(100, Math.max(5, s.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.min(100, Math.max(20, s.memoryUsage + (Math.random() - 0.5) * 5)),
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [session.status]);
  
  // Format uptime
  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // ============================================
  // SANDBOX OPERATIONS
  // ============================================
  
  const connect = async () => {
    // API key is handled server-side
    
    setSession(s => ({ ...s, status: 'connecting' }));
    addLog(isAr ? 'جاري إنشاء بيئة افتراضية...' : 'Creating virtual environment...', 'info');
    
    try {
      // Call E2B API to create sandbox
      const response = await fetch('/api/computer/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: selectedTemplate }),
      });
      
      if (!response.ok) {
        throw new Error(isAr ? 'فشل إنشاء البيئة' : 'Failed to create sandbox');
      }
      
      const data = await response.json();
      
      setSession({
        status: 'connected',
        sandboxId: data.sandboxId,
        screenUrl: data.screenUrl || `https://placehold.co/1920x1080/1e293b/94a3b8?text=${encodeURIComponent(isAr ? 'سطح المكتب الافتراضي' : 'Virtual Desktop')}`,
        cursorX: 50,
        cursorY: 50,
        uptime: 0,
        cpuUsage: 15,
        memoryUsage: 35,
      });
      
      addLog(isAr ? 'تم الاتصال بنجاح!' : 'Connected successfully!', 'success');
      
      // Load initial files
      await loadFiles('/home/user');
      
    } catch (error: any) {
      console.error('Connection error:', error);
      
      // Fallback to demo mode
      setSession({
        status: 'connected',
        sandboxId: 'demo-sandbox',
        screenUrl: `https://placehold.co/1920x1080/1e293b/94a3b8?text=${encodeURIComponent(isAr ? 'وضع العرض التوضيحي' : 'Demo Mode')}`,
        cursorX: 50,
        cursorY: 50,
        uptime: 0,
        cpuUsage: 15,
        memoryUsage: 35,
      });
      
      addLog(isAr ? 'تم الاتصال في وضع العرض التوضيحي' : 'Connected in demo mode', 'warning');
      
      // Demo files
      setFiles([
        { name: 'Documents', path: '/home/user/Documents', type: 'directory' },
        { name: 'Downloads', path: '/home/user/Downloads', type: 'directory' },
        { name: 'Desktop', path: '/home/user/Desktop', type: 'directory' },
        { name: 'script.py', path: '/home/user/script.py', type: 'file', size: 1024 },
        { name: 'notes.txt', path: '/home/user/notes.txt', type: 'file', size: 256 },
      ]);
    }
  };
  
  const disconnect = async () => {
    if (session.sandboxId && session.sandboxId !== 'demo-sandbox') {
      try {
        await fetch(`/api/computer/sandbox/${session.sandboxId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
    
    setSession({
      status: 'disconnected',
      cursorX: 50,
      cursorY: 50,
      uptime: 0,
      cpuUsage: 0,
      memoryUsage: 0,
    });
    setCommandHistory([]);
    setFiles([]);
    addLog(isAr ? 'تم قطع الاتصال' : 'Disconnected', 'info');
  };
  
  const executeCommand = async (cmd?: string) => {
    const commandToRun = cmd || command;
    if (!commandToRun.trim() || isProcessing) return;
    
    setIsProcessing(true);
    addLog(`$ ${commandToRun}`, 'info');
    
    const startTime = Date.now();
    
    try {
      if (session.sandboxId === 'demo-sandbox') {
        // Demo mode - simulate command
        await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
        
        const result: CommandResult = {
          command: commandToRun,
          output: getDemoOutput(commandToRun),
          exitCode: 0,
          timestamp: new Date(),
          duration: Date.now() - startTime,
        };
        
        setCommandHistory(prev => [...prev, result]);
        addLog(result.output.substring(0, 100) + (result.output.length > 100 ? '...' : ''), 'success');
      } else {
        // Real sandbox
        const response = await fetch('/api/computer/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sandboxId: session.sandboxId,
            command: commandToRun,
          }),
        });
        
        const data = await response.json();
        
        const result: CommandResult = {
          command: commandToRun,
          output: data.output || data.error || 'No output',
          exitCode: data.exitCode || 0,
          timestamp: new Date(),
          duration: Date.now() - startTime,
        };
        
        setCommandHistory(prev => [...prev, result]);
        
        if (data.exitCode === 0) {
          addLog(data.output?.substring(0, 100) || 'Command executed', 'success');
        } else {
          addLog(data.error || 'Command failed', 'error');
        }
      }
    } catch (error: any) {
      const result: CommandResult = {
        command: commandToRun,
        output: `Error: ${error.message}`,
        exitCode: 1,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
      setCommandHistory(prev => [...prev, result]);
      addLog(error.message, 'error');
    } finally {
      setIsProcessing(false);
      setCommand('');
    }
  };
  
  const getDemoOutput = (cmd: string): string => {
    const lower = cmd.toLowerCase();
    
    if (lower.startsWith('ls')) return 'Documents  Downloads  Desktop  script.py  notes.txt';
    if (lower.startsWith('pwd')) return '/home/user';
    if (lower.startsWith('whoami')) return 'user';
    if (lower.startsWith('date')) return new Date().toString();
    if (lower.startsWith('uname')) return 'Linux tryit-sandbox 5.15.0-generic #1 SMP x86_64 GNU/Linux';
    if (lower.startsWith('echo')) return cmd.replace(/^echo\s*/i, '');
    if (lower.startsWith('cat')) return 'Hello from Try-It! Virtual Sandbox';
    if (lower.startsWith('python')) return 'Python 3.11.0';
    if (lower.startsWith('node')) return 'v20.10.0';
    if (lower.includes('chrome') || lower.includes('firefox')) return 'Browser started in background';
    if (lower.includes('code')) return 'VS Code started';
    
    return `Command executed: ${cmd}`;
  };
  
  const loadFiles = async (path: string) => {
    if (session.sandboxId === 'demo-sandbox') {
      // Demo files
      setCurrentPath(path);
      return;
    }
    
    try {
      const response = await fetch(`/api/computer/files?sandboxId=${session.sandboxId}&path=${encodeURIComponent(path)}`);
      const data = await response.json();
      setFiles(data.files || []);
      setCurrentPath(path);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };
  
  // ============================================
  // AI ASSISTANCE
  // ============================================
  
  const sendAiMessage = async () => {
    if (!aiInput.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: `[Computer Use Assistant] ${aiInput}\n\nContext: User is working on a virtual Linux desktop. Current directory: ${currentPath}`,
    };
    
    const newMessages = [...aiMessages, userMessage];
    setAiMessages(newMessages);
    setAiInput('');
    
    try {
      const response = await smartChat(newMessages, {
        language: isAr ? 'ar' : 'en',
        enableWebSearch: false,
      });
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content,
      };
      
      setAiMessages([...newMessages, assistantMessage]);
      
      // Check if AI suggested a command
      const commandMatch = response.content.match(/```(?:bash|sh)?\n?(.*?)```/s);
      if (commandMatch) {
        setCommand(commandMatch[1].trim().split('\n')[0]);
      }
    } catch (error: any) {
      addLog(error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // ============================================
  // SCREEN INTERACTIONS
  // ============================================
  
  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (session.status !== 'connected' || !screenRef.current) return;
    
    const rect = screenRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    
    setSession(s => ({ ...s, cursorX: x, cursorY: y }));
    addLog(`${isAr ? 'نقر على' : 'Click at'} (${x}%, ${y}%)`, 'info');
    
    // Send click to sandbox
    if (session.sandboxId && session.sandboxId !== 'demo-sandbox') {
      fetch('/api/computer/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId: session.sandboxId, x, y }),
      }).catch(console.error);
    }
  };
  
  const moveCursor = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 5;
    setSession(s => {
      let { cursorX, cursorY } = s;
      switch (direction) {
        case 'up': cursorY = Math.max(0, cursorY - step); break;
        case 'down': cursorY = Math.min(100, cursorY + step); break;
        case 'left': cursorX = Math.max(0, cursorX - step); break;
        case 'right': cursorX = Math.min(100, cursorX + step); break;
      }
      return { ...s, cursorX, cursorY };
    });
  };
  
  const takeScreenshot = async () => {
    addLog(isAr ? 'جاري أخذ لقطة شاشة...' : 'Taking screenshot...', 'info');
    
    if (session.sandboxId && session.sandboxId !== 'demo-sandbox') {
      try {
        const response = await fetch(`/api/computer/screenshot?sandboxId=${session.sandboxId}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `screenshot-${Date.now()}.png`;
        a.click();
        
        addLog(isAr ? 'تم حفظ لقطة الشاشة' : 'Screenshot saved', 'success');
      } catch (error) {
        addLog(isAr ? 'فشل أخذ لقطة الشاشة' : 'Screenshot failed', 'error');
      }
    } else {
      addLog(isAr ? 'لقطة شاشة (وضع تجريبي)' : 'Screenshot (demo mode)', 'success');
    }
  };
  
  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className={`h-full flex flex-col overflow-hidden ${colors.bg}`}>
      {/* Header */}
      <header className={`flex-shrink-0 p-4 flex items-center justify-between border-b ${colors.border}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/chat')}
            className={`p-2 rounded-lg ${colors.bgSecondary} ${colors.text} hover:opacity-80 transition`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-xl font-bold flex items-center gap-2 ${colors.text}`}>
              <Monitor size={24} />
              {isAr ? 'التحكم بالكمبيوتر' : 'Computer Use'}
            </h1>
            <div className="flex items-center gap-2 text-sm">
              {session.status === 'connected' ? (
                <>
                  <Wifi size={14} className="text-green-500" />
                  <span className={colors.textSecondary}>
                    {isAr ? 'متصل' : 'Connected'} • {formatUptime(session.uptime)}
                  </span>
                </>
              ) : session.status === 'connecting' ? (
                <>
                  <Loader2 size={14} className="animate-spin text-yellow-500" />
                  <span className={colors.textSecondary}>
                    {isAr ? 'جاري الاتصال...' : 'Connecting...'}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-gray-500" />
                  <span className={colors.textSecondary}>
                    {isAr ? 'غير متصل' : 'Disconnected'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* System Stats */}
          {session.status === 'connected' && (
            <div className={`hidden md:flex items-center gap-4 px-4 py-2 rounded-lg ${colors.bgSecondary}`}>
              <div className="flex items-center gap-2">
                <Cpu size={14} className={colors.textSecondary} />
                <span className={`text-sm ${colors.text}`}>{Math.round(session.cpuUsage)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive size={14} className={colors.textSecondary} />
                <span className={`text-sm ${colors.text}`}>{Math.round(session.memoryUsage)}%</span>
              </div>
            </div>
          )}
          
          {/* Connection Button */}
          {session.status === 'disconnected' ? (
            <button
              onClick={connect}
              className="px-4 py-2 rounded-lg flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white transition"
            >
              <Power size={18} />
              <span>{isAr ? 'اتصال' : 'Connect'}</span>
            </button>
          ) : session.status === 'connecting' ? (
            <button disabled className="px-4 py-2 rounded-lg flex items-center gap-2 bg-yellow-600 text-white opacity-75">
              <Loader2 size={18} className="animate-spin" />
              <span>{isAr ? 'جاري الاتصال...' : 'Connecting...'}</span>
            </button>
          ) : (
            <button
              onClick={disconnect}
              className="px-4 py-2 rounded-lg flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white transition"
            >
              <PowerOff size={18} />
              <span>{isAr ? 'قطع الاتصال' : 'Disconnect'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Screen Area */}
        <div className={`flex-1 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
          {/* Screen Toolbar */}
          <div className={`flex items-center justify-between p-2 ${colors.bgSecondary} border-b ${colors.border}`}>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSession(s => ({ ...s, screenUrl: s.screenUrl }))}
                className={`p-2 rounded-lg ${colors.bgTertiary} ${colors.text} hover:opacity-80 transition`}
                title={isAr ? 'تحديث' : 'Refresh'}
              >
                <RefreshCw size={16} />
              </button>
              <button 
                onClick={takeScreenshot}
                className={`p-2 rounded-lg ${colors.bgTertiary} ${colors.text} hover:opacity-80 transition`}
                title={isAr ? 'لقطة شاشة' : 'Screenshot'}
              >
                <Camera size={16} />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setZoom(z => Math.max(50, z - 10))}
                className={`p-2 rounded-lg ${colors.bgTertiary} ${colors.text} hover:opacity-80 transition`}
              >
                <ZoomOut size={16} />
              </button>
              <span className={`text-sm w-12 text-center ${colors.text}`}>{zoom}%</span>
              <button 
                onClick={() => setZoom(z => Math.min(150, z + 10))}
                className={`p-2 rounded-lg ${colors.bgTertiary} ${colors.text} hover:opacity-80 transition`}
              >
                <ZoomIn size={16} />
              </button>
            </div>
            
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-2 rounded-lg ${colors.bgTertiary} ${colors.text} hover:opacity-80 transition`}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
          
          {/* Screen Display */}
          <div className="flex-1 p-4 overflow-auto">
            <div 
              ref={screenRef}
              onClick={handleScreenClick}
              className={`relative rounded-xl overflow-hidden cursor-crosshair mx-auto shadow-2xl ${colors.bgSecondary}`}
              style={{ 
                aspectRatio: '16/9',
                maxHeight: 'calc(100vh - 300px)',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
              }}
            >
              {session.status === 'connected' && session.screenUrl ? (
                <>
                  <img 
                    src={session.screenUrl} 
                    alt="Virtual Desktop"
                    className="w-full h-full object-cover"
                  />
                  {/* Cursor indicator */}
                  <div 
                    className="absolute w-6 h-6 pointer-events-none"
                    style={{ 
                      left: `${session.cursorX}%`,
                      top: `${session.cursorY}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-white bg-neutral-500/50 shadow-lg" />
                    <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="text-center">
                    {session.status === 'connecting' ? (
                      <>
                        <Loader2 size={48} className="mx-auto mb-4 animate-spin text-neutral-500" />
                        <p className="text-lg text-white/60">
                          {isAr ? 'جاري تجهيز البيئة الافتراضية...' : 'Preparing virtual environment...'}
                        </p>
                      </>
                    ) : (
                      <>
                        <Monitor size={64} className="mx-auto mb-4 text-white/20" />
                        <p className="text-lg text-white/60 mb-4">
                          {isAr ? 'اختر نوع البيئة واضغط "اتصال"' : 'Select environment type and press "Connect"'}
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                          {SANDBOX_TEMPLATES.map(t => (
                            <button
                              key={t.id}
                              onClick={() => setSelectedTemplate(t.id)}
                              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                                selectedTemplate === t.id
                                  ? 'bg-neutral-600 text-white'
                                  : 'bg-white/10 text-white/80 hover:bg-white/20'
                              }`}
                            >
                              <span>{t.icon}</span>
                              <span>{isAr ? t.nameAr : t.name}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Cursor Controls */}
          {session.status === 'connected' && (
            <div className="flex justify-center p-4 lg:hidden">
              <div className="grid grid-cols-3 gap-2">
                <div />
                <button 
                  onClick={() => moveCursor('up')}
                  className={`p-3 rounded-lg ${colors.bgSecondary}`}
                >
                  <ChevronUp size={20} className="mx-auto" />
                </button>
                <div />
                
                <button 
                  onClick={() => moveCursor('left')}
                  className={`p-3 rounded-lg ${colors.bgSecondary}`}
                >
                  <ChevronLeft size={20} className="mx-auto" />
                </button>
                <button 
                  onClick={() => handleScreenClick({ clientX: 0, clientY: 0 } as any)}
                  className="p-3 rounded-lg bg-neutral-600"
                >
                  <Mouse size={20} className="mx-auto text-white" />
                </button>
                <button 
                  onClick={() => moveCursor('right')}
                  className={`p-3 rounded-lg ${colors.bgSecondary}`}
                >
                  <ChevronRight size={20} className="mx-auto" />
                </button>
                
                <div />
                <button 
                  onClick={() => moveCursor('down')}
                  className={`p-3 rounded-lg ${colors.bgSecondary}`}
                >
                  <ChevronDown size={20} className="mx-auto" />
                </button>
                <div />
              </div>
            </div>
          )}
        </div>
        
        {/* Side Panel */}
        {!isFullscreen && (
          <div className={`w-96 flex flex-col border-l ${colors.border} ${colors.bgSecondary}`}>
            {/* Tabs */}
            <div className={`flex border-b ${colors.border}`}>
              {[
                { id: 'terminal', icon: <Terminal size={16} />, label: isAr ? 'الأوامر' : 'Terminal' },
                { id: 'files', icon: <Folder size={16} />, label: isAr ? 'الملفات' : 'Files' },
                { id: 'ai', icon: <Activity size={16} />, label: isAr ? 'المساعد' : 'AI' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition ${
                    activeTab === tab.id
                      ? `${colors.text} border-b-2 border-neutral-500`
                      : `${colors.textSecondary} hover:${colors.text}`
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Terminal Tab */}
              {activeTab === 'terminal' && (
                <>
                  {/* Command History */}
                  <div 
                    ref={terminalRef}
                    className={`flex-1 overflow-y-auto p-4 font-mono text-sm ${colors.bg}`}
                  >
                    {commandHistory.length === 0 ? (
                      <div className={`text-center py-8 ${colors.textMuted}`}>
                        <Terminal size={32} className="mx-auto mb-2 opacity-50" />
                        <p>{isAr ? 'لا توجد أوامر بعد' : 'No commands yet'}</p>
                      </div>
                    ) : (
                      commandHistory.map((result, i) => (
                        <div key={i} className="mb-4">
                          <div className="flex items-center gap-2 text-green-500">
                            <span>$</span>
                            <span>{result.command}</span>
                          </div>
                          <pre className={`mt-1 whitespace-pre-wrap ${colors.text}`}>
                            {result.output}
                          </pre>
                          <div className={`text-xs mt-1 ${colors.textMuted}`}>
                            {isAr ? 'كود الخروج:' : 'Exit:'} {result.exitCode} • {result.duration}ms
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Command Input */}
                  <div className={`p-3 border-t ${colors.border}`}>
                    <div className="flex gap-2">
                      <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg ${colors.bg} border ${colors.border}`}>
                        <span className="text-green-500 font-mono">$</span>
                        <input
                          type="text"
                          value={command}
                          onChange={(e) => setCommand(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
                          placeholder={isAr ? 'اكتب أمر...' : 'Type command...'}
                          className={`flex-1 bg-transparent outline-none font-mono ${colors.text}`}
                          disabled={session.status !== 'connected' || isProcessing}
                        />
                      </div>
                      <button
                        onClick={() => executeCommand()}
                        disabled={session.status !== 'connected' || isProcessing || !command.trim()}
                        className="p-2 rounded-lg bg-neutral-600 text-white disabled:opacity-50 hover:bg-neutral-700 transition"
                      >
                        {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                      </button>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {QUICK_ACTIONS.slice(0, 4).map((action, i) => (
                        <button
                          key={i}
                          onClick={() => executeCommand(action.command)}
                          disabled={session.status !== 'connected'}
                          className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${colors.bgTertiary} ${colors.text} disabled:opacity-50 hover:opacity-80 transition`}
                        >
                          {action.icon}
                          <span>{isAr ? action.labelAr : action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {/* Files Tab */}
              {activeTab === 'files' && (
                <div className="flex-1 overflow-y-auto p-4">
                  <div className={`mb-3 px-3 py-2 rounded-lg ${colors.bg} ${colors.textSecondary} text-sm font-mono`}>
                    {currentPath}
                  </div>
                  
                  {files.length === 0 ? (
                    <div className={`text-center py-8 ${colors.textMuted}`}>
                      <Folder size={32} className="mx-auto mb-2 opacity-50" />
                      <p>{isAr ? 'لا توجد ملفات' : 'No files'}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {currentPath !== '/home/user' && (
                        <button
                          onClick={() => loadFiles(currentPath.split('/').slice(0, -1).join('/') || '/home/user')}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${colors.bgTertiary} hover:opacity-80 transition`}
                        >
                          <Folder size={18} className="text-neutral-500" />
                          <span className={colors.text}>..</span>
                        </button>
                      )}
                      
                      {files.map((file, i) => (
                        <button
                          key={i}
                          onClick={() => file.type === 'directory' && loadFiles(file.path)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${colors.bgTertiary} hover:opacity-80 transition`}
                        >
                          {file.type === 'directory' ? (
                            <Folder size={18} className="text-neutral-500" />
                          ) : (
                            <FileText size={18} className={colors.textSecondary} />
                          )}
                          <span className={`flex-1 text-left ${colors.text}`}>{file.name}</span>
                          {file.size && (
                            <span className={`text-xs ${colors.textMuted}`}>
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* AI Tab */}
              {activeTab === 'ai' && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {aiMessages.length === 0 ? (
                      <div className={`text-center py-8 ${colors.textMuted}`}>
                        <Activity size={32} className="mx-auto mb-2 opacity-50" />
                        <p>{isAr ? 'اسأل المساعد عن أي شيء' : 'Ask the assistant anything'}</p>
                      </div>
                    ) : (
                      aiMessages.map((msg, i) => (
                        <div 
                          key={i}
                          className={`p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-neutral-600 text-white ml-8'
                              : `${colors.bgTertiary} ${colors.text} mr-8`
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className={`p-3 border-t ${colors.border}`}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                        placeholder={isAr ? 'اسأل المساعد...' : 'Ask assistant...'}
                        className={`flex-1 px-3 py-2 rounded-lg ${colors.bg} border ${colors.border} ${colors.text} outline-none`}
                        disabled={isProcessing}
                      />
                      <button
                        onClick={sendAiMessage}
                        disabled={isProcessing || !aiInput.trim()}
                        className="p-2 rounded-lg bg-neutral-600 text-white disabled:opacity-50 hover:bg-neutral-700 transition"
                      >
                        {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Logs */}
            <div className={`h-32 border-t ${colors.border} overflow-hidden`}>
              <div className={`px-3 py-2 flex items-center justify-between border-b ${colors.border}`}>
                <span className={`text-xs font-medium ${colors.textSecondary}`}>
                  {isAr ? 'سجل النشاط' : 'Activity Log'}
                </span>
                <button
                  onClick={() => setLogs([])}
                  className={`text-xs ${colors.textMuted} hover:${colors.text}`}
                >
                  {isAr ? 'مسح' : 'Clear'}
                </button>
              </div>
              <div className="h-[calc(100%-36px)] overflow-y-auto p-2 font-mono text-xs space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className={colors.textSecondary}>{log}</div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
