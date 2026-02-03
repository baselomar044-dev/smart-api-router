import { NextRequest, NextResponse } from 'next/server';

const PROVIDER_CONFIGS: Record<string, { url: string; modelKey: string; models: Record<string, string> }> = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    modelKey: 'model',
    models: {
      default: 'llama-3.3-70b-versatile',
      fast: 'llama-3.1-8b-instant'
    }
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    modelKey: 'model',
    models: {
      default: 'gemini-1.5-pro'
    }
  },
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    modelKey: 'model',
    models: {
      default: 'deepseek-coder',
      chat: 'deepseek-chat'
    }
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    modelKey: 'model',
    models: {
      default: 'gpt-4-turbo-preview',
      fast: 'gpt-3.5-turbo'
    }
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    modelKey: 'model',
    models: {
      default: 'claude-3-sonnet-20240229',
      best: 'claude-3-opus-20240229'
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, projectName, projectDescription, template, tables, endpoints, includeAuth, includeDatabase, apiKey, provider } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const config = PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.groq;
    
    // Build comprehensive prompt for project generation
    const systemPrompt = `You are an expert full-stack developer. Generate a complete Next.js 14 project with the App Router.

IMPORTANT RULES:
1. Return ONLY valid JSON array of files
2. Each file must have "path" and "content" keys
3. Use proper TypeScript/TSX syntax
4. Include ALL necessary files for a working project
5. Use Tailwind CSS for styling
6. Follow Next.js 14 App Router conventions

The JSON format must be:
[
  { "path": "/app/page.tsx", "content": "..." },
  { "path": "/app/layout.tsx", "content": "..." },
  ...
]`;

    const userPrompt = `Generate a complete Next.js 14 project with the following specifications:

PROJECT NAME: ${projectName || 'My Project'}
DESCRIPTION: ${projectDescription || 'A modern web application'}
TEMPLATE: ${template?.name || 'Custom'}

REQUIREMENTS:
- Authentication: ${includeAuth ? 'Yes (use Supabase Auth)' : 'No'}
- Database: ${includeDatabase ? 'Yes (use Supabase)' : 'No'}

${tables && tables.length > 0 ? `
DATABASE TABLES:
${tables.map((t: any) => `
Table: ${t.name}
Columns: ${t.columns.map((c: any) => `${c.name} (${c.type})`).join(', ')}
RLS: ${t.enableRLS ? 'Enabled' : 'Disabled'}
`).join('\n')}
` : ''}

${endpoints && endpoints.length > 0 ? `
API ENDPOINTS:
${endpoints.map((e: any) => `
${e.path}: ${e.methods.join(', ')} - ${e.description}
Auth Required: ${e.requiresAuth}
Table: ${e.tableName}
`).join('\n')}
` : ''}

REQUIRED FILES:
1. /app/page.tsx - Home page
2. /app/layout.tsx - Root layout with providers
3. /app/globals.css - Global styles with Tailwind
4. /lib/supabase.ts - Supabase client configuration
5. /package.json - Dependencies
6. /tailwind.config.js - Tailwind configuration
7. /next.config.js - Next.js configuration
8. /tsconfig.json - TypeScript configuration
${includeAuth ? `
9. /app/login/page.tsx - Login page
10. /app/register/page.tsx - Register page
11. /contexts/AuthContext.tsx - Auth context provider
12. /app/dashboard/page.tsx - Protected dashboard
` : ''}
${tables && tables.length > 0 ? `
13. /lib/schema.sql - Database schema
14. API routes for each table
` : ''}

Generate a COMPLETE, PRODUCTION-READY project. Return only the JSON array, no explanations.`;

    let files;

    if (provider === 'gemini') {
      // Gemini API format
      const response = await fetch(`${config.url}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: systemPrompt + '\n\n' + userPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 32000
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${error}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      files = extractJsonFromText(text);

    } else if (provider === 'anthropic') {
      // Anthropic API format
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: config.models.default,
          max_tokens: 32000,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: userPrompt
          }]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${error}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      files = extractJsonFromText(text);

    } else {
      // OpenAI-compatible API format (Groq, OpenAI, DeepSeek)
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: config.models.default,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 32000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${provider} API error: ${error}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      files = extractJsonFromText(text);
    }

    if (!files || files.length === 0) {
      // Generate basic fallback structure
      files = generateFallbackProject(projectName, projectDescription, includeAuth, includeDatabase, tables);
    }

    return NextResponse.json({ files, success: true });

  } catch (error: any) {
    console.error('Project generation error:', error);
    return NextResponse.json({ 
      error: error.message,
      files: [] 
    }, { status: 500 });
  }
}

function extractJsonFromText(text: string): any[] {
  try {
    // Try to find JSON array in the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Try parsing the whole text as JSON
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse JSON from response:', e);
    return [];
  }
}

function generateFallbackProject(
  projectName: string,
  description: string,
  includeAuth: boolean,
  includeDatabase: boolean,
  tables: any[]
): any[] {
  const files = [
    {
      path: '/package.json',
      content: JSON.stringify({
        name: (projectName || 'my-project').toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start'
        },
        dependencies: {
          next: '14.0.4',
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          '@supabase/supabase-js': '^2.39.0',
          'lucide-react': '^0.303.0'
        },
        devDependencies: {
          typescript: '^5.3.3',
          '@types/node': '^20.10.5',
          '@types/react': '^18.2.45',
          tailwindcss: '^3.4.0',
          postcss: '^8.4.32',
          autoprefixer: '^10.4.16'
        }
      }, null, 2)
    },
    {
      path: '/next.config.js',
      content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};
module.exports = nextConfig;`
    },
    {
      path: '/tailwind.config.js',
      content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [],
};`
    },
    {
      path: '/tsconfig.json',
      content: JSON.stringify({
        compilerOptions: {
          target: 'es5',
          lib: ['dom', 'dom.iterable', 'esnext'],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'preserve',
          incremental: true,
          plugins: [{ name: 'next' }],
          paths: { '@/*': ['./*'] }
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
        exclude: ['node_modules']
      }, null, 2)
    },
    {
      path: '/app/globals.css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-900 text-white min-h-screen;
}

.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors;
}

.card {
  @apply bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700 p-6;
}

.input {
  @apply w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500;
}`
    },
    {
      path: '/app/layout.tsx',
      content: `import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${projectName || 'My App'}',
  description: '${description || 'Built with SolveIt Pro Builder'}',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`
    },
    {
      path: '/app/page.tsx',
      content: `export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">${projectName || 'Welcome'}</h1>
        <p className="text-xl text-gray-300 mb-8">${description || 'Your project starts here'}</p>
        <div className="flex gap-4 justify-center">
          ${includeAuth ? `<a href="/login" className="btn-primary">Sign In</a>
          <a href="/register" className="btn-primary bg-gray-700">Get Started</a>` : 
          `<a href="/dashboard" className="btn-primary">Get Started</a>`}
        </div>
      </div>
    </main>
  );
}`
    }
  ];

  if (includeDatabase) {
    files.push({
      path: '/lib/supabase.ts',
      content: `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  return await supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}`
    });

    files.push({
      path: '/.env.example',
      content: `# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`
    });
  }

  if (includeAuth) {
    files.push({
      path: '/app/login/page.tsx',
      content: `'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
${includeDatabase ? "import { signIn } from '@/lib/supabase';" : ''}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    ${includeDatabase ? `
    const { error } = await signIn(email, password);
    if (!error) router.push('/dashboard');
    ` : 'router.push("/dashboard");'}
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8">Welcome back</h1>
        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required />
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary py-3">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-center text-gray-400">
            Don't have an account? <Link href="/register" className="text-blue-400">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}`
    });

    files.push({
      path: '/app/register/page.tsx',
      content: `'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
${includeDatabase ? "import { signUp } from '@/lib/supabase';" : ''}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    ${includeDatabase ? `
    const { error } = await signUp(email, password);
    if (!error) router.push('/dashboard');
    ` : 'router.push("/dashboard");'}
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8">Create account</h1>
        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" minLength={6} required />
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary py-3">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
          <p className="text-center text-gray-400">
            Already have an account? <Link href="/login" className="text-blue-400">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}`
    });

    files.push({
      path: '/app/dashboard/page.tsx',
      content: `'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
${includeDatabase ? "import { getCurrentUser, signOut } from '@/lib/supabase';" : ''}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    ${includeDatabase ? `
    getCurrentUser().then(u => {
      if (!u) router.push('/login');
      else setUser(u);
    });
    ` : 'setUser({ email: "user@example.com" });'}
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <nav className="border-b border-gray-700 bg-gray-800/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">${projectName || 'Dashboard'}</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{user?.email}</span>
            <button onClick={() => ${includeDatabase ? 'signOut().then(() => router.push("/"))' : 'router.push("/")'}} className="btn-primary bg-gray-700">
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Welcome back!</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card"><h3 className="font-semibold mb-2">Stats</h3><p className="text-gray-400">Overview</p></div>
          <div className="card"><h3 className="font-semibold mb-2">Activity</h3><p className="text-gray-400">Recent</p></div>
          <div className="card"><h3 className="font-semibold mb-2">Actions</h3><p className="text-gray-400">Quick</p></div>
        </div>
      </main>
    </div>
  );
}`
    });
  }

  // Generate database schema and API routes for tables
  if (tables && tables.length > 0) {
    let schema = `-- Database Schema for ${projectName || 'My Project'}\n-- Run this in Supabase SQL Editor\n\nCREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;
    
    tables.forEach((table: any) => {
      schema += `CREATE TABLE IF NOT EXISTS ${table.name} (\n  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,\n`;
      table.columns.forEach((col: any) => {
        schema += `  ${col.name} ${col.type.toUpperCase()}${col.nullable ? '' : ' NOT NULL'},\n`;
      });
      schema += `  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n`;
      
      if (table.enableRLS) {
        schema += `ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY;\n\n`;
      }

      // Add API route for table
      files.push({
        path: `/app/api/${table.name}/route.ts`,
        content: `import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { data, error } = await supabase.from('${table.name}').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const body = await request.json();
  const { data, error } = await supabase.from('${table.name}').insert([body]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const supabase = createServerClient();
  const body = await request.json();
  const { id, ...updateData } = body;
  const { data, error } = await supabase.from('${table.name}').update(updateData).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const { error } = await supabase.from('${table.name}').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}`
      });
    });

    files.push({
      path: '/lib/schema.sql',
      content: schema
    });
  }

  files.push({
    path: '/README.md',
    content: `# ${projectName || 'My Project'}

${description || 'Built with SolveIt Pro Builder'}

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000)

${includeDatabase ? `
## Database Setup

Run the SQL in \`/lib/schema.sql\` in your Supabase SQL Editor.
` : ''}

## Built With

- Next.js 14
- React 18
- Tailwind CSS
${includeDatabase ? '- Supabase' : ''}
- TypeScript

---
Built with ❤️ using SolveIt Pro Builder`
  });

  return files;
}
