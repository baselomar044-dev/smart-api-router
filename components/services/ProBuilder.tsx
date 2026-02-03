import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal, Play, Maximize2, Minimize2, 
  Layout, Box, Type, Code, Layers, 
  Settings, Folder, File, ChevronRight, 
  ChevronDown, Plus, Save, RefreshCw, 
  Download, Upload, X, Gamepad2, Search,
  Mic, Music, Calculator, ShoppingCart, Briefcase, FileText, Zap,
  Sparkles, FileCode, Loader2, Send, Monitor, Tablet, Smartphone, Package,
  FileEdit, Volume2, Globe, Cpu, CheckCircle2, Circle, ListChecks, FileSearch, 
  ClipboardList, Wand2, Eye, Rocket, Bot, Brain
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import JSZip from 'jszip';

interface FileSystem {
  [key: string]: {
    content: string;
    isOpen?: boolean;
    type?: 'file' | 'directory';
  };
}

interface Template {
  id: string;
  name: string;
  description: string;
  mainFile: string;
  files: FileSystem;
  icon?: any;
}

interface Category {
  id: string;
  name: string;
  icon: any;
  templates: Template[];
}

const TEMPLATE_CATEGORIES: Category[] = [
    {
      id: 'featured',
      name: 'Featured',
      icon: Zap,
      templates: [
        {
          id: 'modern-portfolio',
          name: 'Modern Portfolio',
          description: '3D interactive portfolio with Three.js',
          icon: Briefcase,
          mainFile: '/App.js',
          files: {
            '/App.js': {
              content: `import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';

function Box(props) {
  const mesh = useRef();
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
  
  useFrame((state, delta) => (mesh.current.rotation.x += delta));
  
  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? 1.5 : 1}
      onClick={() => setActive(!active)}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}

export default function App() {
  return (
    <div className="h-screen w-full bg-gray-900 text-white">
      <div className="absolute top-0 left-0 p-8 z-10">
        <h1 className="text-6xl font-bold mb-4">John Doe</h1>
        <p className="text-xl text-gray-300">Creative Developer & UI Designer</p>
      </div>
      
      <Canvas>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        
        <Float speed={4} rotationIntensity={1} floatIntensity={2}>
          <Box position={[-1.2, 0, 0]} />
          <Box position={[1.2, 0, 0]} />
        </Float>
        
        <OrbitControls enableZoom={false} />
      </Canvas>
      
      <div className="absolute bottom-0 w-full p-8 text-center text-gray-500">
        Scroll to explore works
      </div>
    </div>
  );`
            }
          }
        },
        {
          id: 'pdf-to-audio',
          name: 'PDF to Audio',
          description: 'Convert PDF documents to speech',
          icon: Volume2,
          mainFile: '/App.js',
          files: {
            '/App.js': {
              content: `import React, { useState, useEffect } from 'react';
import { FileText, Play, Pause, Download, Volume2 } from 'lucide-react';

// Simple PDF text extraction simulation since we can't easily load pdf.js worker in this sandbox yet
// In a real app, we would use pdf.js
const extractTextFromPdf = async (file) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(\`This is a simulated extraction from \${file.name}. 
      
In a production environment, we would use Mozilla's PDF.js library to parse the binary content of the PDF file.
For now, this demo showcases the Text-to-Speech synthesis capabilities of the browser.

You can press play to hear this text read aloud, or pause to stop it. 
The Web Speech API provides native browser support for speech synthesis.\`);
    }, 1500);
  });
};

export default function App() {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [speech, setSpeech] = useState(null);

  useEffect(() => {
    const u = new SpeechSynthesisUtterance(text);
    u.onend = () => setIsPlaying(false);
    setSpeech(u);
    return () => window.speechSynthesis.cancel();
  }, [text]);

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setLoading(true);
      const extracted = await extractTextFromPdf(f);
      setText(extracted);
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!speech) return;
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.speak(speech);
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white flex items-center gap-3">
          <FileText className="w-8 h-8" />
          <h1 className="text-2xl font-bold">PDF to Audio Converter</h1>
        </div>
        
        <div className="p-8 space-y-8">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center hover:bg-indigo-50 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2">
              <Download className="w-10 h-10 mx-auto text-indigo-400" />
              <p className="text-lg font-medium text-indigo-900">
                {file ? file.name : 'Drop your PDF here or click to browse'}
              </p>
              <p className="text-sm text-indigo-400">Supports PDF files up to 10MB</p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="bg-slate-100 rounded-xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlay}
                disabled={!text}
                className={\`w-14 h-14 flex items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 \${
                  !text ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600'
                }\`}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>
              <div>
                <p className="font-semibold text-slate-700">
                  {loading ? 'Processing...' : (text ? 'Ready to play' : 'No file loaded')}
                </p>
                <p className="text-sm text-slate-400">
                  {text ? \`\${text.split(' ').length} words detected\` : 'Upload a file to start'}
                </p>
              </div>
            </div>
            <Volume2 className="w-6 h-6 text-slate-400" />
          </div>

          {/* Text Preview */}
          {text && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 max-h-60 overflow-y-auto">
              <p className="text-slate-600 whitespace-pre-wrap">{text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );`
            }
          }
        }
      ]
    },
    {
      id: 'web',
      name: 'Web Apps',
      icon: Layout,
      templates: [
        {
          id: 'landing-page',
          name: 'Landing Page',
          description: 'Modern hero section with Tailwind',
          icon: Globe,
          mainFile: '/App.js',
          files: {
            '/App.js': {
              content: `import React from 'react';
import { ArrowRight, Check, Star, Menu } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900">Nexus</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-gray-600 hover:text-indigo-600 font-medium">Features</a>
            <a href="#" className="text-gray-600 hover:text-indigo-600 font-medium">Testimonials</a>
            <a href="#" className="text-gray-600 hover:text-indigo-600 font-medium">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hidden md:block text-gray-900 font-medium hover:text-indigo-600">Sign In</a>
            <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              Get Started
            </button>
          </div>
        </div>
      </nav>
      
      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            v2.0 is now available
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 tracking-tight">
            Build faster with <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Intelligent Tools</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            The complete platform for building, testing, and deploying modern web applications. 
            Join thousands of developers shipping code daily.
          </p>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-20">
            <button className="flex items-center px-8 py-4 bg-gray-900 text-white rounded-full text-lg font-medium hover:bg-gray-800 transition-all hover:scale-105">
              Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="flex items-center px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-full text-lg font-medium hover:bg-gray-50 transition-all">
              View Documentation
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
            {[
              { title: 'Lightning Fast', desc: 'Optimized for speed with edge computing.' },
              { title: 'Secure by Default', desc: 'Enterprise-grade security out of the box.' }, 
              { title: 'Developer Experience', desc: 'Built by developers, for developers.' }
            ].map((item, i) => (
              <div key={i} className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-indigo-600">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );`
            }
          }
        }
      ]
    },
    {
      id: 'games',
      name: 'Games',
      icon: Gamepad2,
      templates: [
        {
          id: 'space-shooter',
          name: 'Space Shooter',
          description: 'Canvas-based arcade game',
          icon: Gamepad2,
          mainFile: '/App.js',
          files: {
            '/App.js': {
              content: `import React, { useEffect, useRef, useState } from 'react';

export default function App() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    // Game state
    const player = { x: canvas.width / 2, y: canvas.height - 50, width: 30, height: 30, color: '#4F46E5' };
    const bullets = [];
    const enemies = [];
    let frame = 0;
    
    const gameLoop = () => {
      // Clear
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      if (gameOver) return;

      // Player
      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.x - 15, player.y + 30);
      ctx.lineTo(player.x + 15, player.y + 30);
      ctx.fill();

      // Bullets
      ctx.fillStyle = '#38BDF8';
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= 7;
        ctx.fillRect(bullets[i].x - 2, bullets[i].y, 4, 10);
        if (bullets[i].y < 0) bullets.splice(i, 1);
      }

      // Enemies
      if (frame % 60 === 0) {
        enemies.push({
          x: Math.random() * (canvas.width - 30),
          y: -30,
          width: 30,
          height: 30,
          speed: 2 + Math.random() * 2
        });
      }

      ctx.fillStyle = '#EF4444';
      for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemies[i].speed;
        ctx.fillRect(enemies[i].x, enemies[i].y, enemies[i].width, enemies[i].height);
        
        // Collision with player
        if (
          player.x < enemies[i].x + enemies[i].width &&
          player.x + player.width > enemies[i].x &&
          player.y < enemies[i].y + enemies[i].height &&
          player.y + player.height > enemies[i].y
        ) {
          setGameOver(true);
        }

        // Collision with bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
          if (
            bullets[j].x > enemies[i].x &&
            bullets[j].x < enemies[i].x + enemies[i].width &&
            bullets[j].y > enemies[i].y &&
            bullets[j].y < enemies[i].y + enemies[i].height
          ) {
            enemies.splice(i, 1);
            bullets.splice(j, 1);
            setScore(s => s + 10);
            break;
          }
        }
        
        if (enemies[i] && enemies[i].y > canvas.height) enemies.splice(i, 1);
      }

      frame++;
      animationFrameId = window.requestAnimationFrame(gameLoop);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') player.x = Math.max(15, player.x - 20);
      if (e.key === 'ArrowRight') player.x = Math.min(canvas.width - 15, player.x + 20);
      if (e.key === ' ') bullets.push({ x: player.x, y: player.y });
    };

    window.addEventListener('keydown', handleKeyDown);
    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [gameOver]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="mb-4 flex items-center justify-between w-full max-w-lg">
        <h1 className="text-2xl font-bold text-indigo-400">Space Defender</h1>
        <div className="text-xl font-mono">Score: {score}</div>
      </div>
      
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={600} 
          className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700"
        />
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-red-500 mb-4">GAME OVER</h2>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-6 text-gray-500 text-sm">Use Arrow Keys to move, Space to shoot</p>
    </div>
  );`
            }
          }
        },
        {
          id: 'tic-tac-toe',
          name: 'Tic Tac Toe',
          description: 'Classic game implementation',
          icon: Gamepad2,
          mainFile: '/App.js',
          files: {
            '/App.js': {
              content: `import React, { useState } from 'react';

export default function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const winner = calculateWinner(board);
  const status = winner 
    ? \`Winner: \${winner}\` 
    : \`Next player: \${xIsNext ? 'X' : 'O'}\`;

  const handleClick = (i) => {
    if (calculateWinner(board) || board[i]) return;
    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-4xl font-black mb-10 text-gray-900 tracking-tight">Tic Tac Toe</h1>
      
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="mb-8 text-center">
          <div className="text-lg font-medium text-gray-500 uppercase tracking-wide mb-1">Status</div>
          <div className="text-2xl font-bold text-indigo-600">{status}</div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {board.map((square, i) => (
            <button
              key={i}
              className={\`w-24 h-24 text-5xl font-black flex items-center justify-center rounded-xl transition-all duration-200 \${
                square 
                  ? 'bg-gray-50 text-indigo-600' 
                  : 'bg-gray-100 hover:bg-gray-200 text-transparent'
              }\`}
              onClick={() => handleClick(i)}
            >
              {square || '.'}
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={() => setBoard(Array(9).fill(null))}
        className="mt-10 px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors shadow-lg"
      >
        Reset Game
      </button>
    </div>
  );`
            }
          }
        }
      ]
    },
    {
      id: 'utils',
      name: 'Utilities',
      icon: Settings,
      templates: [
        {
          id: 'markdown-editor',
          name: 'Markdown Editor',
          description: 'Live preview markdown editor',
          icon: FileEdit,
          mainFile: '/App.js',
          files: {
            '/App.js': {
              content: `import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileEdit, Eye, Copy, Check } from 'lucide-react';

export default function App() {
  const [markdown, setMarkdown] = useState('# Hello World\\n\\nStart typing to see the **magic** happen!');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="h-16 bg-white border-b flex items-center justify-between px-6">
        <div className="flex items-center gap-2 text-indigo-600">
          <FileEdit className="w-6 h-6" />
          <span className="font-bold text-lg">MD Editor</span>
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Markdown'}
        </button>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col border-r bg-white">
          <div className="bg-gray-50 px-4 py-2 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <FileEdit className="w-3 h-3" /> Editor
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="flex-1 p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed text-gray-800"
            spellCheck="false"
          />
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="bg-gray-50 px-4 py-2 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-3 h-3" /> Preview
          </div>
          <div className="flex-1 p-8 overflow-y-auto prose prose-indigo max-w-none">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );`
            }
          }
        },
        {
          id: 'classic',
          name: 'Classic Counter',
          description: 'Simple counter with state',
          icon: Cpu,
          mainFile: '/App.js',
          files: {
            '/App.js': {
              content: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-8 max-w-md mx-auto mt-20 bg-white rounded-xl shadow-lg text-center">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Counter</h2>
      <div className="text-6xl font-mono font-bold text-indigo-600 mb-8">{count}</div>
      <div className="flex justify-center gap-4">
        <button 
          onClick={() => setCount(c => c - 1)}
          className="w-12 h-12 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors text-xl font-bold"
        >
          -
        </button>
        <button 
          onClick={() => setCount(c => c + 1)}
          className="w-12 h-12 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors text-xl font-bold"
        >
          +
        </button>
      </div>
    </div>
  );`
            }
          }
        },
        {
          id: 'blank',
          name: 'Blank Project',
          description: 'Empty React project',
          icon: Code,
          mainFile: '/App.js',
          files: {
            '/App.js': {
              content: `import React from 'react';

export default function App() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Hello World</h1>
      <p>Start building your app here.</p>
    </div>
  );`
            }
          }
        }
      ]
    }
  ];

// Fallback for initial state
const INITIAL_TEMPLATE = TEMPLATE_CATEGORIES[0].templates[0];

// Workflow step types for Trae-like system
type WorkflowStep = 'idle' | 'analyzing' | 'prd' | 'coding' | 'preview' | 'complete';

interface WorkflowState {
  currentStep: WorkflowStep;
  analysis: string;
  prd: string;
  isStreaming: boolean;
  streamedContent: string;
}

export default function ProBuilder() {
  // --- Get API Keys from Store ---
  const { apiKeys } = useAppStore();
  
  // --- State ---
  
  // File System State (The Source of Truth)
  const [files, setFiles] = useState<FileSystem>(INITIAL_TEMPLATE.files);
  const [activeFile, setActiveFile] = useState<string>(INITIAL_TEMPLATE.mainFile);
  
  // Preview State (The Output)
  const [compiledCode, setCompiledCode] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Trae-like Workflow State
  const [workflow, setWorkflow] = useState<WorkflowState>({
    currentStep: 'idle',
    analysis: '',
    prd: '',
    isStreaming: false,
    streamedContent: ''
  });
  
  // UI State
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string, type?: 'text' | 'workflow' }[]>([
    { role: 'assistant', content: '👋 مرحباً! أنا مساعد البناء الذكي. يمكنني بناء تطبيقات كاملة من وصفك. سأقوم بـ:\n\n1️⃣ تحليل متطلباتك\n2️⃣ إنشاء وثيقة المتطلبات (PRD)\n3️⃣ كتابة الكود\n4️⃣ معاينة النتيجة\n\nماذا تريد أن نبني اليوم؟', type: 'text' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const lastErrorRef = useRef<{ msg: string, time: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleLoadTemplate = (template: Template) => {
    if (window.confirm('This will overwrite your current files. Continue?')) {
      setFiles(template.files);
      setActiveFile(template.mainFile);
      setShowTemplates(false);
      setMessages(prev => [...prev, { role: 'assistant', content: `🚀 Loaded template: ${template.name}` }]);
    }
  };

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Compiler Logic ---

  // Helper to find file in flat map (handles ./ and casing roughly)
  const findFile = useCallback((path: string, currentFiles: FileSystem) => {
    // 0. Exact match (as provided)
    if (currentFiles[path]) return path;

    // 1. Exact match with leading slash
    if (!path.startsWith('/') && currentFiles['/' + path]) return '/' + path;

    // Remove leading ./ or /
    const cleanPath = path.replace(/^(\.\/|\/)/, ''); 
    if (currentFiles[cleanPath]) return cleanPath;
    
    // Fuzzy search:
    // 2. Try exact match case-insensitive
    const caseKey = Object.keys(currentFiles).find(k => k.toLowerCase() === cleanPath.toLowerCase());
    if (caseKey) return caseKey;

    // 3. Try matching suffix (e.g. 'App.tsx' matches 'src/App.tsx')
    // We prioritize strict path ending (with slash) to avoid 'pp.tsx' matching 'App.tsx'
    return Object.keys(currentFiles).find(f => f.endsWith('/' + cleanPath) || f === cleanPath || f.endsWith(cleanPath));
  }, []);

  const compileProject = useCallback(async () => {
    setIsCompiling(true);
    
    try {
      // 1. Find Entry Point
      const entryPoint = findFile('index.html', files) || Object.keys(files).find(f => f.endsWith('.html'));
      
      if (!entryPoint) {
        // Auto-generate index.html wrapper if missing (for pure JS/React templates)
        // This allows "App.js" only templates to work
        const mainJs = Object.keys(files).find(f => f.endsWith('App.js') || f.endsWith('App.tsx') || f.endsWith('index.js'));
        if (mainJs) {
            // Virtual index.html
            const virtualContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="${mainJs}"></script>
</body>
</html>`;
             // Proceed with virtual content
             // We'll just continue using this content as if it was the file
             var content = virtualContent;
        } else {
            setCompiledCode('<div style="color:white;display:flex;justify-content:center;align-items:center;height:100vh;background:#111;font-family:sans-serif;">No index.html or App.js found</div>');
            setIsCompiling(false);
            return;
        }
      } else {
         content = files[entryPoint].content;
      }

      // 2. Inject Runtime (Babel/React if needed)
      // Check if we need to inject dependencies that might be missing in a raw ZIP
      if (!content.includes('babel.min.js') && Object.keys(files).some(f => f.endsWith('.tsx') || f.endsWith('.jsx') || f.includes('React'))) {
         // Simple injection if not present
         if (!content.includes('react.development.js')) {
             // We'll rely on the shim injector below mostly, but let's ensure head exists
             if (!content.includes('<head>')) {
                content = `<!DOCTYPE html><html><head></head><body>${content}</body></html>`;
             }
         }
      }

      // 3. Inline Assets using DOMParser (Robust)
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');

      // 0. Inject Error Capturing Script (Top Priority)
      const errorScript = doc.createElement('script');
      errorScript.textContent = `
        window.onerror = function(msg, url, line, col, error) {
          window.parent.postMessage({ type: 'PREVIEW_ERROR', message: msg, stack: error ? error.stack : '' }, '*');
        };
        window.addEventListener('unhandledrejection', function(event) {
          window.parent.postMessage({ type: 'PREVIEW_ERROR', message: event.reason ? event.reason.message : 'Unhandled Rejection', stack: event.reason ? event.reason.stack : '' }, '*');
        });
      `;
      if (doc.head) {
        doc.head.insertBefore(errorScript, doc.head.firstChild);
      } else {
        const head = doc.createElement('head');
        head.appendChild(errorScript);
        doc.documentElement.insertBefore(head, doc.body);
      }

      // Helper for recursive JS processing
      const processJsFile = async (path: string, visited: Set<string> = new Set()): Promise<string> => {
        if (visited.has(path)) return '';
        visited.add(path);
        
        const file = findFile(path, files);
        if (!file) {
          console.warn('File not found during compilation:', path);
          return `/* File not found: ${path} */`;
        }
        
        let jsContent = files[file].content;

        // Strip exports
        // 1. "export default function/class ..." -> "function/class ..."
        jsContent = jsContent.replace(/export\s+default\s+(function|class)\s+/g, '$1 ');
        // 2. "export default ..." -> "const _default_export = ..." (Approximate)
        jsContent = jsContent.replace(/export\s+default\s+/g, '');
        
        // 3. Handle "export { X } from 'Y'" (Re-export)
        // We convert this to: const { X } = window.require('Y');
        jsContent = jsContent.replace(/export\s+(\{[\s\S]*?\})\s+from\s+["']([^"']+)["'];?/g, (match, clause, path) => {
            return `const ${clause} = window.require('${path}');`;
        });

        // 4. "export { ... }" -> remove entirely (BUT keep "export { ... } from '...'")
        jsContent = jsContent.replace(/export\s+(\{[\s\S]*?\})\s*;(?!\s*from)/g, '');
        
        // 5. "export const/let/var/function/class" -> "const/let/var/function/class"
        jsContent = jsContent.replace(/export\s+(const|let|var|function|class|type|interface|enum)\s+/g, '$1 ');
        
        // Handle imports: import { ... } from 'path'; or import ... from 'path';
        const importRegex = /import\s+(?:([\s\S]*?)\s+from\s+)?["']([^"']+)["'];?/g;
        const imports = [...jsContent.matchAll(importRegex)];
        
        for (const match of imports) {
           const fullMatch = match[0];
           const importClause = match[1]; // e.g. "{ Button }" or "React" or "React, { useState }"
           const importPath = match[2]; // e.g. "./Button"
           
           // Handle CSS imports
           if (importPath.endsWith('.css')) {
             const cssPath = importPath.startsWith('.') || importPath.startsWith('/') 
               ? importPath.split('/').pop()! 
               : importPath;
               
             const resolvedCss = findFile(cssPath, files);
             if (resolvedCss) {
               const cssContent = files[resolvedCss].content.replace(/`/g, '\\`').replace(/\$/g, '\\$'); 
               jsContent = jsContent.replace(fullMatch, `
                 (function() {
                   const style = document.createElement('style');
                   style.textContent = \`${cssContent}\`;
                   document.head.appendChild(style);
                 })();
               `);
             } else {
               jsContent = jsContent.replace(fullMatch, `/* Missing CSS: ${importPath} */`);
             }
             continue;
           }

           // Resolve Path (Handle @/ alias and relative paths)
           let resolvedPath = importPath;
           if (importPath.startsWith('@/')) {
              resolvedPath = importPath.replace('@/', '');
           } else if (importPath.startsWith('.') || importPath.startsWith('/')) {
              resolvedPath = importPath.split('/').pop()!; 
           }
           
           // Try to find file
           const possibleFiles = [
              resolvedPath, 
              resolvedPath + '.js', resolvedPath + '.jsx', 
              resolvedPath + '.ts', resolvedPath + '.tsx',
              resolvedPath + '/index.js', resolvedPath + '/index.ts' // Handle directory imports
           ];
             
           let foundImportPath = '';
           for (const p of possibleFiles) {
             if (findFile(p, files)) {
               foundImportPath = p;
               break;
             }
           }
             
           if (foundImportPath) {
             // INLINING MODE
             const importedContent = await processJsFile(foundImportPath, visited);
             jsContent = jsContent.replace(fullMatch, `/* Inlined: ${importPath} */\n${importedContent}`);
           } else {
             // EXTERNAL / MISSING MODE -> Shim with require
             if (importPath === 'react' || importPath === 'react-dom' || importPath === 'react/jsx-runtime') {
               jsContent = jsContent.replace(fullMatch, `// ${fullMatch} (Used global)`);
             } else {
                // Generate valid CommonJS require
                let replacement = '';
                if (importClause) {
                   // Normalize "import * as X" -> "const X"
                   if (importClause.includes(' as ')) {
                      if (importClause.startsWith('* as ')) {
                         const varName = importClause.replace('* as ', '').trim();
                         replacement = `const ${varName} = window.require('${importPath}');`;
                      } else {
                         replacement = `const ${importClause} = window.require('${importPath}');`;
                      }
                   } 
                   // Handle mixed imports: "React, { useState }" -> "const React = ...; const { useState } = ..."
                   else if (importClause.includes(',')) {
                      const parts = importClause.split(/,\s*(?={)/); // Split before the brace part
                      if (parts.length > 1) {
                         const defaultPart = parts[0].trim();
                         const namedPart = parts[1].trim();
                         replacement = `const ${defaultPart} = window.require('${importPath}'); const ${namedPart} = window.require('${importPath}');`;
                      } else {
                         replacement = `const ${importClause} = window.require('${importPath}');`;
                      }
                   }
                   else {
                      replacement = `const ${importClause} = window.require('${importPath}');`;
                   }
                } else {
                   // Side-effect import: import 'lib';
                   replacement = `window.require('${importPath}');`;
                }
                
                jsContent = jsContent.replace(fullMatch, `${replacement} /* Shimmed */`);
             }
           }
        }
        return jsContent;
      };

      // Inline CSS Links (Handle both rel="stylesheet" and href ending in .css)
      const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"], link[href$=".css"]'));
      for (const link of links) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('//')) {
          const cssPath = findFile(href, files);
          if (cssPath) {
            const cssContent = files[cssPath].content;
            const style = doc.createElement('style');
            style.textContent = `/* ${href} */\n${cssContent}`;
            link.replaceWith(style);
          } else {
             console.warn('Removing missing CSS:', href);
             link.remove();
          }
        }
      }

      // Remove Preload/Prefetch links to avoid ghost requests
      const preloads = Array.from(doc.querySelectorAll('link[rel="preload"], link[rel="modulepreload"], link[rel="prefetch"]'));
      for (const link of preloads) {
         link.remove();
      }

      // Inline Scripts
      const scripts = Array.from(doc.querySelectorAll('script[src]'));
      for (const script of scripts) {
        const src = script.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('//')) {
          const jsPath = findFile(src, files);
          if (jsPath) {
            const jsContent = await processJsFile(jsPath);
            script.removeAttribute('src');
            script.textContent = `/* Inlined from ${src} */\n${jsContent}`;
            
            // Convert module to text/babel for browser execution if needed
            if (script.getAttribute('type') === 'module' || jsPath.endsWith('.tsx') || jsPath.endsWith('.jsx')) {
               script.setAttribute('type', 'text/babel');
               script.setAttribute('data-presets', 'env,react');
            }
          } else {
            // Remove missing scripts to prevent net errors
            console.warn('Removing missing script:', src);
            script.remove();
          }
        }
      }

      // Inline Images
      const images = Array.from(doc.querySelectorAll('img[src]'));
      for (const img of images) {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
           const imgPath = findFile(src, files);
           if (imgPath) {
              const file = files[imgPath];
              // Use content directly (assuming it might be data URI from ZIP import)
              img.setAttribute('src', file.content);
           }
        }
      }

      // Inject Runtime Shim if needed (using DOM manipulation)
        if (!doc.querySelector('script[data-systemic-shim]')) {
           
           // 1. Inject React & ReactDOM FIRST (Sync)
           const react = doc.createElement('script');
           react.src = 'https://unpkg.com/react@18/umd/react.development.js';
           react.async = false;
           doc.head.appendChild(react);

           const reactDom = doc.createElement('script');
           reactDom.src = 'https://unpkg.com/react-dom@18/umd/react-dom.development.js';
           reactDom.async = false;
           doc.head.appendChild(reactDom);

           // 2. Inject Shim immediately after ReactDOM
           const shimScript = doc.createElement('script');
           shimScript.setAttribute('data-systemic-shim', 'true');
           shimScript.textContent = `
             (function() {
               // Robust Shim running AFTER React loads but BEFORE App code
                // 1. Patch createRoot
                if (window.ReactDOM && window.ReactDOM.createRoot) {
                   const originalCreateRoot = window.ReactDOM.createRoot;
                   window.ReactDOM.createRoot = function(container, options) {
                     // Scorched Earth Policy: Always give createRoot a fresh container
                     // This fixes the "already passed to createRoot" warning in all cases (Hot Reload, StrictMode, etc)
                     if (container) {
                        try {
                           // 1. Try to scrub React 18 internal markers
                           Object.keys(container).forEach(key => {
                              if (key.startsWith('__reactContainer') || key.startsWith('_reactRootContainer')) {
                                 delete container[key];
                              }
                           });
                           
                           // 2. If attached to DOM, replace with a fresh clone to be 100% sure
                           if (container.parentNode) {
                              const newContainer = container.cloneNode(false);
                              container.parentNode.replaceChild(newContainer, container);
                              return originalCreateRoot(newContainer, options);
                           }
                        } catch (e) {
                           console.warn('ProBuilder Shim: Cleanup failed', e);
                        }
                     }
                     return originalCreateRoot(container, options);
                   };
                   console.log('ProBuilder: Patched createRoot successfully.');
                } else {
                  console.warn('ProBuilder: ReactDOM not found during shim execution.');
               }

               // 2. Shim require/process/os for compatibility
               window.process = { env: { NODE_ENV: 'development' } };
               window.exports = {};
               
               // Node.js 'os' shim
               const osShim = {
                 platform: () => 'browser',
                 type: () => 'Browser',
                 release: () => '1.0.0',
                 arch: () => 'javascript',
                 cpus: () => [],
                 totalmem: () => 0,
                 freemem: () => 0,
                 networkInterfaces: () => ({}),
                 homedir: () => '/',
                 userInfo: () => ({ username: 'user' }),
                 EOL: '\\n'
               };

               const requireFn = function(mod) {
                 if (mod === 'react') return window.React;
                 if (mod === 'react-dom') return window.ReactDOM;
                 if (mod === 'react-dom/client') return window.ReactDOM;
                 if (mod === 'react/jsx-runtime') return window.React;
                 
                 // Return OS shim if requested
                 if (mod === 'os') return osShim;
                 
                 // Warn but don't crash immediately - return a Proxy that traps access
                 console.warn('Systemic: require not implemented for ' + mod);
                 
                 return new Proxy({}, {
                    get: function(target, prop) {
                       console.warn('Systemic: Tying to access property "' + String(prop) + '" on missing module "' + mod + '"');
                       return undefined;
                    }
                 });
               };
               
               window.require = requireFn;
               window.require = requireFn; // Expose global require for Babel output
             })();
           `;
           doc.head.appendChild(shimScript);

           // 3. Inject Babel (Sync)
           const babel = doc.createElement('script');
           babel.src = 'https://unpkg.com/@babel/standalone/babel.min.js';
           babel.async = false;
           doc.head.appendChild(babel);
        }

      setCompiledCode(doc.documentElement.outerHTML);
    } catch (err) {
      console.error('Compilation failed', err);
      setCompiledCode(`<h1>Build Error</h1><pre>${JSON.stringify(err, null, 2)}</pre>`);
    } finally {
      setIsCompiling(false);
    }
  }, [files, findFile]);

  // Auto-compile when files change (debounce)
  useEffect(() => {
    const timer = setTimeout(compileProject, 500);
    return () => clearTimeout(timer);
  }, [files, compileProject]);

  const handleAutoFix = useCallback(async (errorMsg: string) => {
    // Prevent infinite loops: check if same error occurred recently (< 5s)
    if (lastErrorRef.current && lastErrorRef.current.msg === errorMsg && Date.now() - lastErrorRef.current.time < 5000) {
       console.warn('Skipping repeated auto-fix for:', errorMsg);
       return;
    }

    if (isFixing) return;
    
    // Update last error tracking
    lastErrorRef.current = { msg: errorMsg, time: Date.now() };

    setIsFixing(true);
    
    // Determine provider based on available keys (Mock for now or rely on store if implemented)
    // const { apiKeys } = useStore(); // Assuming store hook exists but avoiding dependency if not
    const apiKeys = { openai: '', anthropic: '', gemini: '' }; // Placeholder

    let provider = 'openai';
    let key = apiKeys.openai;
    
    if (!key && apiKeys.anthropic) {
       provider = 'anthropic';
       key = apiKeys.anthropic;
    } else if (!key && apiKeys.gemini) {
       provider = 'gemini';
       key = apiKeys.gemini;
    }

    try {
       const response = await fetch('/api/ai/fix-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             files,
             error: errorMsg,
             apiKey: key,
             provider: provider
          })
       });
       
       const data = await response.json();
       if (data.files) {
          setFiles(prev => ({ ...prev, ...data.files }));
          setMessages(prev => [...prev, { role: 'assistant', content: '✅ Auto-fixed error.' }]);
       }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFixing(false);
    }
  }, [files, isFixing]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PREVIEW_ERROR') {
        const errorMsg = e.data.message;
        // Filter out benign errors
        if (errorMsg.includes('ResizeObserver')) return;
        
        console.log('Preview Error Captured:', errorMsg);
        handleAutoFix(errorMsg);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handleAutoFix]);


  // --- Actions ---

  // Trae-like Streaming AI Call
  const streamAI = async (systemPrompt: string, userPrompt: string): Promise<string> => {
    abortControllerRef.current = new AbortController();
    
    const response = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        apiKeys
      }),
      signal: abortControllerRef.current.signal
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AI request failed');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    if (!reader) throw new Error('No reader available');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

      for (const line of lines) {
        const data = line.replace('data: ', '').trim();
        if (data === '[DONE]') continue;

        try {
          const json = JSON.parse(data);
          if (json.content) {
            fullContent += json.content;
            setWorkflow(prev => ({ ...prev, streamedContent: fullContent }));
          }
          if (json.error) {
            throw new Error(json.error);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    return fullContent;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    setWorkflow(prev => ({ ...prev, currentStep: 'analyzing', isStreaming: true, streamedContent: '' }));

    try {
      // ===== STEP 1: Analyze Requirements =====
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '🔍 **الخطوة 1/4: تحليل المتطلبات...**',
        type: 'workflow'
      }]);

      const analysisPrompt = `You are a requirements analyst. Analyze the following user request and identify:
1. Main objective
2. Key features needed
3. Technical requirements
4. User interface elements
5. Any potential challenges

User Request: ${userMsg}

Provide a brief, structured analysis in Arabic. Be concise.`;

      const analysis = await streamAI(analysisPrompt, userMsg);
      setWorkflow(prev => ({ ...prev, analysis, currentStep: 'prd', streamedContent: '' }));
      
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { 
          role: 'assistant', 
          content: `✅ **تحليل المتطلبات:**\n\n${analysis}`,
          type: 'workflow'
        };
        return newMsgs;
      });

      // ===== STEP 2: Generate PRD =====
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '📋 **الخطوة 2/4: إنشاء وثيقة المتطلبات (PRD)...**',
        type: 'workflow'
      }]);

      const prdPrompt = `Based on the analysis, create a brief Product Requirements Document (PRD) with:
1. Project Name
2. Description (2-3 sentences)
3. Core Features (bullet points)
4. Technical Stack (React, Tailwind, etc.)
5. File Structure

Analysis: ${analysis}

Write in Arabic. Be concise and practical.`;

      const prd = await streamAI(prdPrompt, userMsg);
      setWorkflow(prev => ({ ...prev, prd, currentStep: 'coding', streamedContent: '' }));
      
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { 
          role: 'assistant', 
          content: `✅ **وثيقة المتطلبات:**\n\n${prd}`,
          type: 'workflow'
        };
        return newMsgs;
      });

      // ===== STEP 3: Generate Code =====
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '💻 **الخطوة 3/4: كتابة الكود...**',
        type: 'workflow'
      }]);

      const codePrompt = `You are an expert web developer. Generate a complete, working web application.

Requirements:
${prd}

IMPORTANT RULES:
1. Output ONLY a JSON array of file objects: [{ "path": "filename", "content": "code" }, ...]
2. ALWAYS include index.html as the entry point
3. Use React 18 with JSX (include via CDN in index.html)
4. Use Tailwind CSS (include via CDN)
5. Make it visually appealing with modern design
6. All code must be self-contained and working
7. Include Babel for JSX transformation
8. Add comments in Arabic where helpful

Current project files: ${Object.keys(files).join(', ')}

Generate the complete project files now. Output ONLY the JSON array, nothing else.`;

      const codeResponse = await streamAI(codePrompt, prd);
      setWorkflow(prev => ({ ...prev, currentStep: 'preview', streamedContent: '' }));

      // Parse the generated code
      let newFiles: FileSystem = {};
      let fileCount = 0;

      try {
        // Find JSON array in the response
        const jsonMatch = codeResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          if (Array.isArray(parsed)) {
            parsed.forEach((f: any) => {
              if (f.path && f.content) {
                // Normalize path
                const path = f.path.startsWith('/') ? f.path : '/' + f.path;
                newFiles[path] = { type: 'file', content: f.content };
                fileCount++;
              }
            });
          }
        }
      } catch (e) {
        console.error('Failed to parse code JSON:', e);
        throw new Error('فشل في تحليل الكود المُنشأ. حاول مرة أخرى.');
      }

      if (fileCount === 0) {
        throw new Error('لم يتم إنشاء أي ملفات. حاول وصف طلبك بشكل مختلف.');
      }

      // Update files
      setFiles(prev => ({ ...prev, ...newFiles }));
      
      // Select main file
      const mainFile = Object.keys(newFiles).find(f => 
        f.includes('index.html') || f.includes('App')
      ) || Object.keys(newFiles)[0];
      if (mainFile) setActiveFile(mainFile);

      // ===== STEP 4: Preview =====
      setWorkflow(prev => ({ ...prev, currentStep: 'complete' }));
      
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { 
          role: 'assistant', 
          content: `✅ **تم إنشاء ${fileCount} ملف:**\n\n${Object.keys(newFiles).map(f => `📄 ${f}`).join('\n')}\n\n🎉 **المشروع جاهز للمعاينة!** يمكنك رؤية النتيجة على اليمين.`,
          type: 'workflow'
        };
        return newMsgs;
      });

      // Auto-show code
      setShowCode(true);

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ **خطأ:** ${error.message || 'حدث خطأ غير متوقع'}\n\nتأكد من إضافة مفاتيح API في الإعدادات.` 
      }]);
      setWorkflow(prev => ({ ...prev, currentStep: 'idle' }));
    } finally {
      setIsLoading(false);
      setWorkflow(prev => ({ ...prev, isStreaming: false }));
      abortControllerRef.current = null;
    }
  };

  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setMessages(prev => [...prev, { role: 'assistant', content: '📦 Unpacking ZIP archive...' }]);
      setIsLoading(true);

      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(file);
      
      const newFiles: FileSystem = {};
      
      // Extract all files
      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir) {
          // Identify text files we can edit/preview
          const isText = /\.(html|css|js|jsx|ts|tsx|json|md|txt)$/i.test(relativePath);
          
          if (isText) {
            const content = await zipEntry.async('string');
            newFiles[relativePath] = { type: 'file', content };
          } else {
            // Binary files (images) - convert to base64 data URL for "virtual hosting"
            const base64 = await zipEntry.async('base64');
            const ext = relativePath.split('.').pop()?.toLowerCase();
            const mime = ext === 'png' ? 'image/png' : ext === 'jpg' ? 'image/jpeg' : 'application/octet-stream';
            newFiles[relativePath] = { type: 'file', content: `data:${mime};base64,${base64}` }; 
          }
        }
      }

      setFiles(newFiles);
      setMessages(prev => [...prev, { role: 'assistant', content: `✅ Imported ${Object.keys(newFiles).length} files. Project structure loaded.` }]);
      
      // Find a good file to show
      const mainFile = Object.keys(newFiles).find(f => f.endsWith('App.tsx') || f.endsWith('index.html')) || Object.keys(newFiles)[0];
      if (mainFile) setActiveFile(mainFile);

    } catch (err: any) {
      console.error(err);
      let msg = '❌ Failed to read ZIP file';
      if (err.message && err.message.includes('Encrypted zip are not supported')) {
         msg = '🔒 Encrypted ZIPs are not supported. Please upload an unencrypted ZIP.';
      }
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Render ---

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      {/* LEFT: Sidebar / Chat / Files */}
      <div className="w-[400px] flex flex-col border-r border-white/10 bg-[#111]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#111] to-[#161616]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">مساعد البناء الذكي</h1>
              <p className="text-xs text-gray-500">AI Builder • نظام Trae</p>
            </div>
          </div>
          <div className="flex gap-1">
             <button onClick={() => setShowTemplates(true)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="القوالب">
               <Layout className="w-4 h-4" />
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="استيراد ZIP">
               <Upload className="w-4 h-4" />
             </button>
             <button onClick={() => setShowFileExplorer(!showFileExplorer)} className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${showFileExplorer ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400'}`} title="الملفات">
               <Folder className="w-4 h-4" />
             </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".zip" onChange={handleImportZip} className="hidden" />
        </div>

        {/* File Explorer (Toggleable) */}
        {showFileExplorer && (
          <div className="h-1/3 border-b border-white/10 overflow-y-auto p-2 bg-[#0d0d0d]">
            <div className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">Project Files</div>
            {Object.keys(files).sort().map(path => (
              <div 
                key={path}
                onClick={() => setActiveFile(path)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${activeFile === path ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <FileCode className="w-4 h-4 opacity-70" />
                <span className="truncate">{path}</span>
              </div>
            ))}
          </div>
        )}

        {/* Workflow Progress Indicator */}
        {workflow.currentStep !== 'idle' && workflow.currentStep !== 'complete' && (
          <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="text-xs font-semibold text-blue-400">وضع البناء الذكي</span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { step: 'analyzing', label: 'تحليل', icon: FileSearch },
                { step: 'prd', label: 'PRD', icon: ClipboardList },
                { step: 'coding', label: 'كود', icon: Code },
                { step: 'preview', label: 'معاينة', icon: Eye },
              ].map(({ step, label, icon: Icon }, idx) => (
                <React.Fragment key={step}>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    workflow.currentStep === step 
                      ? 'bg-blue-500 text-white' 
                      : ['analyzing', 'prd', 'coding', 'preview'].indexOf(workflow.currentStep) > idx
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/5 text-gray-500'
                  }`}>
                    {['analyzing', 'prd', 'coding', 'preview'].indexOf(workflow.currentStep) > idx ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : workflow.currentStep === step ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Circle className="w-3 h-3" />
                    )}
                    <span>{label}</span>
                  </div>
                  {idx < 3 && <ChevronRight className="w-3 h-3 text-gray-600" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : m.type === 'workflow'
                    ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 text-gray-200 border border-blue-500/30'
                    : 'bg-white/5 text-gray-200 border border-white/10'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          
          {/* Streaming Content Display */}
          {workflow.isStreaming && workflow.streamedContent && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-gradient-to-br from-blue-900/30 to-purple-900/30 text-gray-200 border border-blue-500/30">
                {workflow.streamedContent}
                <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />
              </div>
            </div>
          )}
          
          {isLoading && !workflow.streamedContent && (
            <div className="flex justify-start">
              <div className="bg-white/5 rounded-2xl px-4 py-3 border border-white/10 flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                <span className="text-sm text-gray-400">جاري التحليل...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-gradient-to-r from-[#111] to-[#0d0d0d]">
          <div className="relative">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="صِف تطبيقك... مثال: أنشئ لي تطبيق قائمة مهام جميل"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 resize-none h-[60px] transition-all"
              dir="rtl"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute left-2 bottom-2 p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg disabled:opacity-50 hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-2 text-center">
            اضغط Enter للإرسال • Shift+Enter لسطر جديد
          </p>
        </div>
      </div>

      {/* RIGHT: Workspace (Code/Preview) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
        
        {/* Toolbar */}
        <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-[#111]">
          <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded-lg">
             <button onClick={() => setPreviewMode('desktop')} className={`p-1.5 rounded ${previewMode === 'desktop' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Monitor className="w-4 h-4" /></button>
             <button onClick={() => setPreviewMode('tablet')} className={`p-1.5 rounded ${previewMode === 'tablet' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Tablet className="w-4 h-4" /></button>
             <button onClick={() => setPreviewMode('mobile')} className={`p-1.5 rounded ${previewMode === 'mobile' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Smartphone className="w-4 h-4" /></button>
          </div>

          <div className="flex items-center gap-4">
             {isCompiling && <span className="text-xs text-blue-400 flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin" /> Compiling...</span>}
             <button onClick={() => setShowCode(!showCode)} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${showCode ? 'bg-white text-black border-white' : 'border-white/20 hover:border-white/40'}`}>
               <Code className="w-3 h-3" />
               {showCode ? 'Hide Code' : 'Show Code'}
             </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden flex">
          
          {/* Code Editor (Simple Read-only for now) */}
          {showCode && (
            <div className="w-1/2 border-r border-white/10 bg-[#0d0d0d] overflow-auto">
               <div className="sticky top-0 bg-[#1a1a1a] text-xs text-gray-400 px-4 py-2 border-b border-white/10 flex justify-between">
                 <span>{activeFile}</span>
                 <span>{files[activeFile]?.content.length} chars</span>
               </div>
               <pre className="p-4 text-sm font-mono text-gray-300 whitespace-pre-wrap">
                 {files[activeFile]?.content || '// Select a file to view content'}
               </pre>
            </div>
          )}

          {/* Preview Iframe */}
          <div className={`flex-1 flex flex-col items-center justify-center bg-[#1a1a1a] p-4 transition-all duration-300 ${showCode ? 'w-1/2' : 'w-full'}`}>
            <div className={`relative bg-white shadow-2xl transition-all duration-300 overflow-hidden ${
              previewMode === 'mobile' ? 'w-[375px] h-[667px] rounded-[30px] border-8 border-gray-800' :
              previewMode === 'tablet' ? 'w-[768px] h-[1024px] rounded-xl border-4 border-gray-800' :
              'w-full h-full rounded-lg border border-white/10'
            }`}>
              <iframe 
                ref={iframeRef}
                srcDoc={compiledCode}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"
                title="Preview"
                src="about:blank"
              />
              {/* Overlay for "No Content" state */}
              {!compiledCode && !isCompiling && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] text-gray-500">
                  <Package className="w-12 h-12 mb-4 opacity-20" />
                  <p>Ready to build</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Template Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#161616]">
              <div>
                 <h2 className="text-2xl font-bold flex items-center gap-3">
                   <Layout className="w-6 h-6 text-blue-400" />
                   New Project
                 </h2>
                 <p className="text-gray-400 text-sm mt-1">Choose a template to get started</p>
              </div>
              <button onClick={() => setShowTemplates(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a]">
              <div className="flex flex-col gap-10">
                {TEMPLATE_CATEGORIES.map(cat => (
                  <div key={cat.id} className="animate-in slide-in-from-bottom-4 duration-500 fade-in fill-mode-backwards" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center gap-3 mb-6 pb-2 border-b border-white/5">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <cat.icon className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        {cat.name}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {cat.templates.map(t => (
                        <button 
                          key={t.id}
                          onClick={() => handleLoadTemplate(t)}
                          className="group relative flex flex-col gap-4 p-5 rounded-xl border border-white/10 bg-[#111] hover:border-blue-500/50 hover:bg-[#161616] hover:shadow-xl hover:shadow-blue-900/10 transition-all duration-300 text-left overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          <div className="flex items-start justify-between w-full relative z-10">
                            <div className="p-3 bg-gray-800/50 group-hover:bg-blue-500/20 rounded-xl text-gray-300 group-hover:text-blue-400 transition-colors">
                              {t.icon ? <t.icon className="w-6 h-6" /> : <cat.icon className="w-6 h-6" />}
                            </div>
                            {Object.keys(t.files).length > 1 && (
                                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/5 rounded text-gray-500 border border-white/5">
                                  System
                                </div>
                            )}
                          </div>
                          
                          <div className="relative z-10">
                            <div className="font-bold text-lg text-white mb-2 group-hover:text-blue-400 transition-colors">{t.name}</div>
                            <div className="text-sm text-gray-400 leading-relaxed">{t.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}