// ============================================
// 9. DEPLOYMENT SYSTEM (Local & Vercel)
// ============================================

export interface DeploymentConfig {
  projectName: string
  projectType: 'static' | 'nextjs' | 'react'
  files: { path: string; content: string }[]
  env?: Record<string, string>
  buildCommand?: string
  outputDir?: string
}

export interface DeploymentResult {
  success: boolean
  url?: string
  deploymentId?: string
  logs: string[]
  error?: string
}

// Project Templates
const projectTemplates = {
  static: {
    'package.json': (name: string) => JSON.stringify({
      name: name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      scripts: {
        dev: 'npx serve .',
        build: 'echo \"Static site - no build needed\"',
        start: 'npx serve .'
      }
    }, null, 2),
    'vercel.json': () => JSON.stringify({
      buildCommand: '',
      outputDirectory: '.',
      routes: [{ src: '/(.*)', dest: '/$1' }]
    }, null, 2)
  },

  nextjs: {
    'package.json': (name: string) => JSON.stringify({
      name: name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint'
      },
      dependencies: {
        next: '^14.0.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0'
      },
      devDependencies: {
        '@types/node': '^20',
        '@types/react': '^18',
        '@types/react-dom': '^18',
        typescript: '^5'
      }
    }, null, 2),
    'next.config.js': () => `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone'
}
module.exports = nextConfig`,
    'tsconfig.json': () => JSON.stringify({
      compilerOptions: {
        target: 'es5',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'node',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        paths: { '@/*': ['./*'] }
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
      exclude: ['node_modules']
    }, null, 2)
  },

  react: {
    'package.json': (name: string) => JSON.stringify({
      name: name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0'
      },
      devDependencies: {
        '@types/react': '^18',
        '@types/react-dom': '^18',
        '@vitejs/plugin-react': '^4',
        typescript: '^5',
        vite: '^5'
      }
    }, null, 2),
    'vite.config.ts': () => `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()]
})`,
    'index.html': (name: string) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
  }
}

// Deployment Manager
export class DeploymentManager {
  
  // Generate deployment package
  generatePackage(config: DeploymentConfig): { path: string; content: string }[] {
    const files: { path: string; content: string }[] = []
    const template = projectTemplates[config.projectType]

    // Add template files
    for (const [filename, generator] of Object.entries(template)) {
      files.push({
        path: filename,
        content: typeof generator === 'function' ? generator(config.projectName) : generator
      })
    }

    // Add project files
    files.push(...config.files)

    // Add .gitignore
    files.push({
      path: '.gitignore',
      content: `node_modules/\n.next/\ndist/\n.env.local\n.vercel\n`
    })

    // Add environment variables template
    if (config.env) {
      files.push({
        path: '.env.example',
        content: Object.keys(config.env).map(k => `${k}=`).join('\n')
      })
    }

    return files
  }

  // Create downloadable ZIP
  async createZip(config: DeploymentConfig): Promise<Blob> {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    const files = this.generatePackage(config)
    
    for (const file of files) {
      zip.file(file.path, file.content)
    }

    return zip.generateAsync({ type: 'blob' })
  }

  // Deploy to Vercel
  async deployToVercel(config: DeploymentConfig, vercelToken: string): Promise<DeploymentResult> {
    const logs: string[] = []
    
    try {
      logs.push('📦 Preparing deployment package...')
      const files = this.generatePackage(config)
      
      // Convert files to Vercel format
      const vercelFiles = files.map(f => ({
        file: f.path,
        data: btoa(unescape(encodeURIComponent(f.content)))
      }))

      logs.push('🚀 Creating Vercel deployment...')
      
      // Create deployment
      const deployResponse = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: config.projectName.toLowerCase().replace(/\s+/g, '-'),
          files: vercelFiles,
          projectSettings: {
            framework: config.projectType === 'nextjs' ? 'nextjs' : 
                       config.projectType === 'react' ? 'vite' : null,
            buildCommand: config.buildCommand,
            outputDirectory: config.outputDir
          },
          target: 'production'
        })
      })

      if (!deployResponse.ok) {
        const error = await deployResponse.json()
        throw new Error(error.error?.message || 'Deployment failed')
      }

      const deployment = await deployResponse.json()
      logs.push(`✅ Deployment created: ${deployment.id}`)

      // Wait for deployment to be ready
      logs.push('⏳ Waiting for deployment to complete...')
      
      let status = deployment
      while (status.readyState !== 'READY' && status.readyState !== 'ERROR') {
        await new Promise(r => setTimeout(r, 3000))
        
        const statusResponse = await fetch(
          `https://api.vercel.com/v13/deployments/${deployment.id}`,
          { headers: { 'Authorization': `Bearer ${vercelToken}` } }
        )
        status = await statusResponse.json()
        logs.push(`   Status: ${status.readyState}`)
      }

      if (status.readyState === 'ERROR') {
        throw new Error('Deployment failed')
      }

      const url = `https://${status.url}`
      logs.push(`🎉 Deployed successfully: ${url}`)

      return {
        success: true,
        url,
        deploymentId: deployment.id,
        logs
      }

    } catch (error) {
      logs.push(`❌ Error: ${(error as Error).message}`)
      return {
        success: false,
        logs,
        error: (error as Error).message
      }
    }
  }

  // Generate local run instructions
  getLocalRunInstructions(config: DeploymentConfig): string {
    const projectDir = config.projectName.toLowerCase().replace(/\s+/g, '-')
    
    const instructions = {
      static: `
# 🚀 Local Deployment Instructions

1. Extract the ZIP file
2. Open terminal in the project folder
3. Run:
   \`\`\`bash
   npx serve .
   \`\`\`
4. Open http://localhost:3000 in your browser
`,
      nextjs: `
# 🚀 Local Deployment Instructions

1. Extract the ZIP file
2. Open terminal in the project folder
3. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
4. Run development server:
   \`\`\`bash
   npm run dev
   \`\`\`
5. Open http://localhost:3000 in your browser

## Production Build
\`\`\`bash
npm run build
npm start
\`\`\`
`,
      react: `
# 🚀 Local Deployment Instructions

1. Extract the ZIP file
2. Open terminal in the project folder
3. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
4. Run development server:
   \`\`\`bash
   npm run dev
   \`\`\`
5. Open http://localhost:5173 in your browser

## Production Build
\`\`\`bash
npm run build
npm run preview
\`\`\`
`
    }

    return instructions[config.projectType]
  }

  // One-click Docker deployment
  generateDockerfile(config: DeploymentConfig): string {
    const dockerfiles = {
      static: `FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`,

      nextjs: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]`,

      react: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`
    }

    return dockerfiles[config.projectType]
  }

  // Generate docker-compose.yml
  generateDockerCompose(config: DeploymentConfig): string {
    const name = config.projectName.toLowerCase().replace(/\s+/g, '-')
    return `version: '3.8'

services:
  ${name}:
    build: .
    ports:
      - "3000:${config.projectType === 'react' || config.projectType === 'static' ? '80' : '3000'}"
    restart: unless-stopped
${config.env ? `    environment:\n${Object.entries(config.env).map(([k, v]) => `      - ${k}=${v}`).join('\n')}` : ''}
`
  }
}

