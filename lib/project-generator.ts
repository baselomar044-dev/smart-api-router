// Professional Project Generator System
// Generates complete multi-file projects with database integration

export interface ProjectFile {
  path: string;
  content: string;
  type: 'page' | 'component' | 'api' | 'lib' | 'config' | 'style' | 'type';
}

export interface ProjectStructure {
  name: string;
  description: string;
  files: ProjectFile[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  supabaseSchema?: string;
  envVariables: string[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'saas' | 'ecommerce' | 'dashboard' | 'blog' | 'portfolio' | 'custom';
  complexity: 'simple' | 'medium' | 'complex';
  features: string[];
  estimatedFiles: number;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'saas-starter',
    name: 'SaaS Starter',
    description: 'Full SaaS with auth, dashboard, billing',
    icon: '🚀',
    category: 'saas',
    complexity: 'complex',
    features: ['Authentication', 'Dashboard', 'Billing', 'API', 'Database'],
    estimatedFiles: 25
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Store',
    description: 'Online store with cart, checkout, products',
    icon: '🛒',
    category: 'ecommerce',
    complexity: 'complex',
    features: ['Products', 'Cart', 'Checkout', 'Orders', 'Admin'],
    estimatedFiles: 30
  },
  {
    id: 'admin-dashboard',
    name: 'Admin Dashboard',
    description: 'Analytics dashboard with charts and tables',
    icon: '📊',
    category: 'dashboard',
    complexity: 'medium',
    features: ['Charts', 'Tables', 'Users', 'Settings', 'Reports'],
    estimatedFiles: 20
  },
  {
    id: 'blog-cms',
    name: 'Blog & CMS',
    description: 'Blog with markdown, categories, comments',
    icon: '📝',
    category: 'blog',
    complexity: 'medium',
    features: ['Posts', 'Categories', 'Comments', 'Search', 'RSS'],
    estimatedFiles: 18
  },
  {
    id: 'portfolio-pro',
    name: 'Portfolio Pro',
    description: 'Professional portfolio with projects and contact',
    icon: '🎨',
    category: 'portfolio',
    complexity: 'simple',
    features: ['Projects', 'About', 'Contact', 'Blog', 'Resume'],
    estimatedFiles: 12
  },
  {
    id: 'custom',
    name: 'Custom Project',
    description: 'Build anything from your description',
    icon: '✨',
    category: 'custom',
    complexity: 'complex',
    features: ['AI Generated', 'Custom Features', 'Your Vision'],
    estimatedFiles: 15
  }
];

export const BASE_DEPENDENCIES = {
  "next": "14.0.4",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@supabase/supabase-js": "^2.39.0",
  "zustand": "^4.4.7",
  "lucide-react": "^0.303.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.2.0"
};

export const BASE_DEV_DEPENDENCIES = {
  "typescript": "^5.3.3",
  "@types/node": "^20.10.5",
  "@types/react": "^18.2.45",
  "@types/react-dom": "^18.2.18",
  "tailwindcss": "^3.4.0",
  "postcss": "^8.4.32",
  "autoprefixer": "^10.4.16"
};

// Generate package.json
export function generatePackageJson(project: ProjectStructure): string {
  return JSON.stringify({
    name: project.name.toLowerCase().replace(/\s+/g, '-'),
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint"
    },
    dependencies: { ...BASE_DEPENDENCIES, ...project.dependencies },
    devDependencies: { ...BASE_DEV_DEPENDENCIES, ...project.devDependencies }
  }, null, 2);
}

// Generate .env.local template
export function generateEnvFile(project: ProjectStructure): string {
  const lines = [
    '# Environment Variables',
    '# Copy this file to .env.local and fill in your values',
    '',
    '# Supabase',
    'NEXT_PUBLIC_SUPABASE_URL=your_supabase_url',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key',
    'SUPABASE_SERVICE_ROLE_KEY=your_service_role_key',
    ''
  ];
  
  project.envVariables.forEach(v => {
    lines.push(`${v}=`);
  });
  
  return lines.join('\n');
}

// Generate Supabase client
export function generateSupabaseClient(): string {
  return `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Auth helpers
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
`;
}

// Generate Next.js config
export function generateNextConfig(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'avatars.githubusercontent.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
`;
}

// Generate Tailwind config
export function generateTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
};
`;
}

// Generate PostCSS config
export function generatePostCSSConfig(): string {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

// Generate global styles
export function generateGlobalStyles(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 255, 255, 255;
  --background-end-rgb: 245, 245, 245;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 17, 24, 39;
    --background-end-rgb: 31, 41, 55;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors;
  }
  
  .card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6;
  }
  
  .input {
    @apply w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }
}
`;
}

// Generate TypeScript config
export function generateTSConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: "es5",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: {
        "@/*": ["./*"]
      }
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"]
  }, null, 2);
}

// Generate README
export function generateReadme(project: ProjectStructure): string {
  return `# ${project.name}

${project.description}

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

3. Fill in your Supabase credentials in \`.env.local\`

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

Run the following SQL in your Supabase SQL editor:

\`\`\`sql
${project.supabaseSchema || '-- No schema defined'}
\`\`\`

## 📁 Project Structure

\`\`\`
${project.files.map(f => f.path).join('\n')}
\`\`\`

## 🛠️ Built With

- [Next.js 14](https://nextjs.org/)
- [React 18](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)
- [TypeScript](https://www.typescriptlang.org/)

## 📄 License

MIT License - feel free to use this project for anything!

---

Built with ❤️ using SolveIt Pro Builder
`;
}
