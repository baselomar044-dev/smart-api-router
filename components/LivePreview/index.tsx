'use client';

import { useState, useCallback, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import PreviewFrame, { ConsoleMessage } from './PreviewFrame';
import ConsoleOutput from './ConsoleOutput';
import { safeStorage } from '@/lib/safeStorage';

interface LivePreviewProps {
  onAIFix?: (code: string, error: string, language: string) => Promise<string>;
  initialTemplate?: string;
}

type FileTab = 'html' | 'css' | 'javascript';
type ViewportSize = 'mobile' | 'tablet' | 'desktop' | 'full';
type LayoutMode = 'split' | 'code' | 'preview';

interface ProjectFiles { html: string; css: string; javascript: string; }

const templates: Record<string, { name: string; icon: string; files: ProjectFiles; isReact: boolean }> = {
  blank: {
    name: 'Blank', icon: '📄', isReact: false,
    files: {
      html: '<div class="container">\n  <h1>Hello World</h1>\n  <p>Start building!</p>\n</div>',
      css: '.container {\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n}\nh1 { font-size: 3rem; margin-bottom: 1rem; }',
      javascript: 'console.log("Hello!");',
    },
  },
  landing: {
    name: 'Landing Page', icon: '🚀', isReact: false,
    files: {
      html: `<nav class="navbar"><div class="logo">🚀 MyApp</div><button class="cta">Get Started</button></nav>
<header class="hero"><h1>Build Something Amazing</h1><p>Turn your ideas into reality</p>
<div class="buttons"><button class="primary">Start Free</button><button class="secondary">Watch Demo</button></div></header>
<section class="features"><h2>Features</h2><div class="grid">
<div class="card"><span>⚡</span><h3>Fast</h3><p>Optimized for speed</p></div>
<div class="card"><span>🔒</span><h3>Secure</h3><p>Enterprise security</p></div>
<div class="card"><span>🎨</span><h3>Beautiful</h3><p>Modern design</p></div>
</div></section>`,
      css: `.navbar{display:flex;justify-content:space-between;align-items:center;padding:1rem 2rem;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.1)}
.logo{font-size:1.5rem;font-weight:bold}.cta{background:#6366f1;color:#fff;border:none;padding:.75rem 1.5rem;border-radius:8px;cursor:pointer}
.hero{min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:2rem}
.hero h1{font-size:3rem;margin-bottom:1rem}.hero p{font-size:1.25rem;opacity:.9;margin-bottom:2rem}
.buttons{display:flex;gap:1rem}.primary{background:#fff;color:#6366f1;border:none;padding:1rem 2rem;border-radius:8px;font-weight:600;cursor:pointer}
.secondary{background:transparent;color:#fff;border:2px solid #fff;padding:1rem 2rem;border-radius:8px;cursor:pointer}
.features{padding:4rem 2rem;text-align:center;background:#f9fafb}.features h2{font-size:2rem;margin-bottom:2rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:2rem;max-width:1000px;margin:0 auto}
.card{background:#fff;padding:2rem;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.08)}.card span{font-size:2.5rem}
.card h3{margin:1rem 0 .5rem}.card p{color:#6b7280}`,
      javascript: `document.querySelector('.primary').onclick=()=>alert('Starting trial! 🚀');
document.querySelector('.secondary').onclick=()=>alert('Playing demo 🎬');
console.log('Landing page ready! ✨');`,
    },
  },
  react: {
    name: 'React App', icon: '⚛️', isReact: true,
    files: {
      html: '',
      css: `.app{min-height:100vh;background:linear-gradient(135deg,#1e1e2e,#2d2d44);color:#fff;display:flex;align-items:center;justify-content:center}
.card{background:rgba(255,255,255,.1);backdrop-filter:blur(10px);border-radius:16px;padding:2rem;text-align:center;min-width:300px}
.count{font-size:5rem;font-weight:bold;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:1rem 0}
.buttons{display:flex;gap:1rem;justify-content:center;margin-top:1.5rem}
.btn{width:50px;height:50px;border:none;border-radius:50%;font-size:1.5rem;cursor:pointer;transition:transform .2s}
.btn:hover{transform:scale(1.1)}.btn.minus{background:#ef4444;color:#fff}.btn.plus{background:#22c55e;color:#fff}
.btn.reset{width:auto;padding:0 1.5rem;border-radius:25px;background:#6366f1;color:#fff}`,
      javascript: `const { useState } = React;

function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="app">
      <div className="card">
        <h1>⚛️ React Counter</h1>
        <div className="count">{count}</div>
        <div className="buttons">
          <button className="btn minus" onClick={() => setCount(c => c - 1)}>-</button>
          <button className="btn reset" onClick={() => setCount(0)}>Reset</button>
          <button className="btn plus" onClick={() => setCount(c => c + 1)}>+</button>
        </div>
      </div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);`,
    },
  },
  dashboard: {
    name: 'Dashboard', icon: '📊', isReact: true,
    files: {
      html: '',
      css: `.dash{min-height:100vh;background:#0f172a;color:#fff;padding:1.5rem}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem}
.title{font-size:1.75rem;font-weight:700}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:2rem}
.stat{background:#1e293b;border-radius:12px;padding:1.25rem;border:1px solid #334155}
.stat-label{color:#94a3b8;font-size:.875rem}.stat-value{font-size:2rem;font-weight:700}
.change{font-size:.75rem;margin-top:.5rem}.change.up{color:#22c55e}.change.down{color:#ef4444}
.chart{background:#1e293b;border-radius:12px;padding:1.5rem;border:1px solid #334155}
.bars{display:flex;align-items:flex-end;gap:.5rem;height:150px}
.bar{flex:1;background:linear-gradient(to top,#6366f1,#8b5cf6);border-radius:4px 4px 0 0;transition:height .5s}
.labels{display:flex;gap:.5rem;margin-top:.5rem}.label{flex:1;text-align:center;font-size:.75rem;color:#64748b}`,
      javascript: `const { useState } = React;

function Stat({ label, value, change, up }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={"change " + (up ? "up" : "down")}>{up ? "↑" : "↓"} {change}</div>
    </div>
  );
}

function App() {
  const stats = [
    { label: "Revenue", value: "$45,231", change: "12%", up: true },
    { label: "Users", value: "2,345", change: "8%", up: true },
    { label: "Conversion", value: "3.2%", change: "2%", up: false },
    { label: "Avg Order", value: "$89", change: "5%", up: true },
  ];
  const data = [65, 45, 78, 52, 88, 72, 95];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const max = Math.max(...data);

  return (
    <div className="dash">
      <div className="header">
        <h1 className="title">📊 Dashboard</h1>
        <span style={{color:"#64748b"}}>Updated: Just now</span>
      </div>
      <div className="grid">
        {stats.map((s, i) => <Stat key={i} {...s} />)}
      </div>
      <div className="chart">
        <h3 style={{marginBottom:"1rem"}}>📈 Weekly Revenue</h3>
        <div className="bars">
          {data.map((v, i) => <div key={i} className="bar" style={{height: (v/max*100)+"%"}} />)}
        </div>
        <div className="labels">{labels.map((l, i) => <span key={i} className="label">{l}</span>)}</div>
      </div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);`,
    },
  },
  todo: {
    name: 'Todo App', icon: '✅', isReact: true,
    files: {
      html: '',
      css: `.todo{min-height:100vh;background:linear-gradient(135deg,#667eea,#764ba2);padding:2rem;display:flex;justify-content:center}
.container{width:100%;max-width:500px}
.header{text-align:center;color:#fff;margin-bottom:2rem}.header h1{font-size:2.5rem}
.input-wrap{display:flex;gap:.5rem;margin-bottom:1.5rem}
.input{flex:1;padding:1rem;border:none;border-radius:12px;font-size:1rem}
.add-btn{padding:1rem 1.5rem;background:#1e1e2e;color:#fff;border:none;border-radius:12px;font-weight:600;cursor:pointer}
.list{display:flex;flex-direction:column;gap:.75rem}
.item{display:flex;align-items:center;gap:1rem;padding:1rem;background:#fff;border-radius:12px;animation:slideIn .3s}
@keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
.checkbox{width:24px;height:24px;accent-color:#6366f1}
.text{flex:1}.text.done{text-decoration:line-through;color:#9ca3af}
.delete{background:#ef4444;color:#fff;border:none;width:32px;height:32px;border-radius:8px;cursor:pointer}
.stats{text-align:center;color:rgba(255,255,255,.8);margin-top:1.5rem}`,
      javascript: `const { useState } = React;

function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Learn React", done: true },
    { id: 2, text: "Build apps", done: false },
  ]);
  const [input, setInput] = useState("");

  const add = () => {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input, done: false }]);
    setInput("");
  };

  const toggle = (id) => setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id) => setTodos(todos.filter(t => t.id !== id));

  return (
    <div className="todo">
      <div className="container">
        <div className="header"><h1>✅ Todo List</h1></div>
        <div className="input-wrap">
          <input className="input" placeholder="What needs to be done?" value={input}
            onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && add()} />
          <button className="add-btn" onClick={add}>Add</button>
        </div>
        <div className="list">
          {todos.map(t => (
            <div key={t.id} className="item">
              <input type="checkbox" className="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
              <span className={"text " + (t.done ? "done" : "")}>{t.text}</span>
              <button className="delete" onClick={() => remove(t.id)}>✕</button>
            </div>
          ))}
        </div>
        <div className="stats">{todos.filter(t => t.done).length} of {todos.length} completed</div>
      </div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);`,
    },
  },
};

export default function LivePreview({ onAIFix, initialTemplate = 'blank' }: LivePreviewProps) {
  const [activeTab, setActiveTab] = useState<FileTab>('html');
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [showConsole, setShowConsole] = useState(true);
  const [currentTemplate, setCurrentTemplate] = useState(initialTemplate);
  const [isReact, setIsReact] = useState(templates[initialTemplate]?.isReact || false);
  const [projectName, setProjectName] = useState('My Project');
  const [files, setFiles] = useState<ProjectFiles>(templates[initialTemplate]?.files || templates.blank.files);

  // Auto-save with safe localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = safeStorage.getItem('livepreview_project');
        if (saved) {
          const data = JSON.parse(saved);
          setFiles(data.files);
          setIsReact(data.isReact);
          setProjectName(data.projectName || 'My Project');
        }
      }
    } catch (e) {
      console.warn('localStorage not available');
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          safeStorage.setItem('livepreview_project', JSON.stringify({ files, isReact, projectName }));
        }
      } catch (e) {
        console.warn('localStorage not available');
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [files, isReact, projectName]);

  const handleFileChange = (content: string) => setFiles(prev => ({ ...prev, [activeTab]: content }));

  const handleConsoleMessage = (msg: ConsoleMessage) => setConsoleMessages(prev => [...prev.slice(-99), msg]);

  const handleAIFix = async (error: string) => {
    if (onAIFix) {
      const fixed = await onAIFix(files[activeTab], error, activeTab);
      setFiles(prev => ({ ...prev, [activeTab]: fixed }));
    }
  };

  const loadTemplate = (key: string) => {
    const t = templates[key];
    if (t) {
      setFiles(t.files);
      setIsReact(t.isReact);
      setCurrentTemplate(key);
      setConsoleMessages([]);
      setActiveTab(t.isReact ? 'javascript' : 'html');
    }
  };

  const exportProject = () => {
    const doc = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${projectName}</title>
${isReact ? `<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>` : ''}
<script src="https://cdn.tailwindcss.com"></script>
<style>${files.css}</style></head>
<body>${isReact ? '<div id="root"></div>' : files.html}
<script${isReact ? ' type="text/babel"' : ''}>${files.javascript}</script>
</body></html>`;
    const blob = new Blob([doc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = isReact
    ? [{ key: 'css' as FileTab, label: 'CSS', icon: '🎨' }, { key: 'javascript' as FileTab, label: 'React', icon: '⚛️' }]
    : [{ key: 'html' as FileTab, label: 'HTML', icon: '📄' }, { key: 'css' as FileTab, label: 'CSS', icon: '🎨' }, { key: 'javascript' as FileTab, label: 'JS', icon: '⚡' }];

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-600 focus:border-purple-500 focus:outline-none w-36" />
          <select value={currentTemplate} onChange={(e) => loadTemplate(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm border border-gray-600 cursor-pointer">
            {Object.entries(templates).map(([k, t]) => <option key={k} value={k}>{t.icon} {t.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
          {(['mobile', 'tablet', 'desktop', 'full'] as ViewportSize[]).map((s) => (
            <button key={s} onClick={() => setViewportSize(s)}
              className={`px-3 py-1 rounded text-sm transition-colors ${viewportSize === s ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}>
              {s === 'mobile' ? '📱' : s === 'tablet' ? '📱' : s === 'desktop' ? '💻' : '🖥️'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            {(['code', 'split', 'preview'] as LayoutMode[]).map((m) => (
              <button key={m} onClick={() => setLayoutMode(m)}
                className={`px-3 py-1 rounded text-sm transition-colors ${layoutMode === m ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                {m === 'code' ? '< >' : m === 'split' ? '◧' : '▣'}
              </button>
            ))}
          </div>
          <button onClick={exportProject}
            className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
            📥 Export
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {layoutMode !== 'preview' && (
          <div className={`flex flex-col bg-gray-900 ${layoutMode === 'split' ? 'w-1/2' : 'w-full'} border-r border-gray-700`}>
            <div className="flex items-center bg-gray-800 border-b border-gray-700">
              {tabs.map((t) => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${activeTab === t.key ? 'bg-gray-900 text-white border-t-2 border-purple-500' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              <CodeEditor value={files[activeTab]} onChange={handleFileChange}
                language={activeTab === 'javascript' ? (isReact ? 'jsx' : 'javascript') : activeTab} theme="dark" />
            </div>
          </div>
        )}
        {layoutMode !== 'code' && (
          <div className={`flex flex-col ${layoutMode === 'split' ? 'w-1/2' : 'w-full'}`}>
            <div className={`flex-1 ${showConsole ? 'h-2/3' : 'h-full'}`}>
              <PreviewFrame html={files.html} css={files.css} javascript={files.javascript}
                isReact={isReact} viewportSize={viewportSize} onError={handleConsoleMessage} onLog={handleConsoleMessage} />
            </div>
            <button onClick={() => setShowConsole(!showConsole)}
              className="flex items-center justify-center gap-2 py-1 bg-gray-800 text-gray-400 hover:text-white text-xs transition-colors">
              {showConsole ? '▼' : '▲'} Console ({consoleMessages.filter(m => m.type === 'error').length} errors)
            </button>
            {showConsole && (
              <div className="h-1/3 min-h-[150px]">
                <ConsoleOutput messages={consoleMessages} onClear={() => setConsoleMessages([])}
                  onAIFix={onAIFix ? handleAIFix : undefined} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
