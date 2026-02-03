'use client';

import { useState, useEffect } from 'react';
import { safeStorage } from '@/lib/safeStorage';

interface DeploymentPanelProps {
  projectName?: string;
  files?: { path: string; content: string }[];
  onClose?: () => void;
  isModal?: boolean;
}

export default function DeploymentPanel({ 
  projectName: initialProjectName = '', 
  files: initialFiles = [], 
  onClose,
  isModal = false 
}: DeploymentPanelProps) {
  const [step, setStep] = useState<1 | 2 | 3>(initialFiles.length > 0 ? 2 : 1);
  const [codeInput, setCodeInput] = useState('');
  const [projectName, setProjectName] = useState(initialProjectName || 'my-project');
  const [vercelToken, setVercelToken] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<{ path: string; content: string }[]>(initialFiles);

  // Load saved token
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedToken = safeStorage.getItem('solveit_vercel_token');
        if (savedToken) setVercelToken(savedToken);
      }
    } catch {}
  }, []);

  // Try to import from LiveEditor
  const importFromLiveEditor = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storage = safeStorage.getItem('solveit-storage');
        if (storage) {
          const data = JSON.parse(storage);
          const code = data.state?.liveEditorCode;
          if (code) {
            setCodeInput(code);
            return;
          }
        }
        const savedCode = safeStorage.getItem('solveit_live_editor_code');
        if (savedCode) {
          setCodeInput(savedCode);
          return;
        }
      }
      setError('No code found in Live Editor');
    } catch {
      setError('No code found in Live Editor');
    }
  };

  // Prepare code for deployment
  const prepareCode = () => {
    const code = codeInput.trim();
    if (!code) {
      setError('Please paste some code first');
      return;
    }

    const isHtml = code.includes('<!DOCTYPE') || code.includes('<html') || code.startsWith('<');
    const isReact = code.includes('import React') || code.includes('export default') || code.includes('useState');
    
    let preparedFiles: { path: string; content: string }[] = [];
    const safeName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    if (isHtml) {
      preparedFiles = [{ path: 'index.html', content: code }];
    } else if (isReact) {
      preparedFiles = [
        { path: 'app/page.tsx', content: code },
        { path: 'package.json', content: JSON.stringify({
          name: safeName,
          version: '1.0.0',
          scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
          dependencies: { next: '^14.0.0', react: '^18.2.0', 'react-dom': '^18.2.0' },
          devDependencies: { typescript: '^5.0.0', '@types/react': '^18.2.0' }
        }, null, 2) },
        { path: 'next.config.js', content: 'module.exports = {}' }
      ];
    } else {
      preparedFiles = [{ path: 'index.js', content: code }];
    }

    setFiles(preparedFiles);
    setError(null);
    setStep(2);
  };

  // Deploy to Vercel
  const deploy = async () => {
    if (!vercelToken) {
      setError('Please enter your Vercel token');
      return;
    }

    safeStorage.setItem('solveit_vercel_token', vercelToken);
    setDeploying(true);
    setError(null);

    try {
      const response = await fetch('/api/deploy/vercel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: vercelToken,
          projectName: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          files,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        setDeployUrl(data.url);
        setStep(3);
      } else {
        setError(data.error || 'Deployment failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className={`${isModal ? '' : 'h-full'} flex flex-col bg-gray-900 text-white`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          🚀 Quick Deploy
        </h2>
        {isModal && onClose && (
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl">×</button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center p-4 border-b border-gray-800">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              step >= s ? 'bg-purple-600' : 'bg-gray-700'
            }`}>
              {s === 3 && step === 3 ? '✓' : s}
            </div>
            {s < 3 && <div className={`w-12 h-1 ${step > s ? 'bg-purple-600' : 'bg-gray-700'}`} />}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Step 1: Paste Code */}
        {step === 1 && (
          <div className="space-y-4 max-w-lg mx-auto">
            <h3 className="text-lg font-semibold text-center">📝 Step 1: Add Your Code</h3>
            
            <button
              onClick={importFromLiveEditor}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors"
            >
              ✨ Import from Live Editor
            </button>

            <div className="text-center text-gray-500">or paste below</div>

            <textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Paste your HTML, React, or JS code here..."
              className="w-full h-48 bg-gray-800 border border-gray-700 rounded-lg p-3 font-mono text-sm resize-none focus:border-purple-500 outline-none"
            />

            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-purple-500 outline-none"
            />

            {error && <div className="text-red-400 text-sm text-center">{error}</div>}

            <button
              onClick={prepareCode}
              disabled={!codeInput.trim()}
              className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* Step 2: Connect & Deploy */}
        {step === 2 && (
          <div className="space-y-4 max-w-lg mx-auto">
            <h3 className="text-lg font-semibold text-center">▲ Step 2: Deploy to Vercel</h3>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">Ready to deploy:</div>
              <div className="font-medium">{projectName}</div>
              <div className="text-xs text-gray-500 mt-1">{files.length} file(s)</div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Vercel Token</label>
              <input
                type="password"
                value={vercelToken}
                onChange={(e) => setVercelToken(e.target.value)}
                placeholder="Enter your Vercel token"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-purple-500 outline-none"
              />
              <a 
                href="https://vercel.com/account/tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:underline mt-1 inline-block"
              >
                Get a token from Vercel →
              </a>
            </div>

            {error && <div className="text-red-400 text-sm text-center">{error}</div>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={deploy}
                disabled={deploying || !vercelToken}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {deploying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deploying...
                  </>
                ) : (
                  '🚀 Deploy'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="space-y-6 max-w-lg mx-auto text-center">
            <div className="text-6xl">🎉</div>
            <h3 className="text-2xl font-bold text-green-400">Deployed!</h3>
            
            <a
              href={deployUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4 hover:opacity-90 transition-opacity"
            >
              <div className="text-sm text-white/70">Your site is live at:</div>
              <div className="font-mono text-lg break-all">{deployUrl}</div>
            </a>

            <button
              onClick={() => {
                setStep(1);
                setCodeInput('');
                setFiles([]);
                setDeployUrl(null);
              }}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Deploy Another Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
