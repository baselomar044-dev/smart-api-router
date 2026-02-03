// ============================================
// 6. PLUGIN SYSTEM
// ============================================

export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  icon?: string
  category: 'ai' | 'tools' | 'ui' | 'export' | 'integration' | 'workflow'
  
  // Lifecycle hooks
  onLoad?: () => Promise<void>
  onUnload?: () => Promise<void>
  
  // Feature extensions
  components?: Record<string, React.ComponentType<any>>
  actions?: Record<string, PluginAction>
  aiProviders?: AIProviderExtension[]
  exportFormats?: ExportFormatExtension[]
  workflowNodes?: WorkflowNodeExtension[]
  
  // Settings
  settings?: PluginSetting[]
  
  // Dependencies
  dependencies?: string[]
}

export interface PluginAction {
  name: string
  description: string
  icon?: string
  handler: (params: any, context: PluginContext) => Promise<any>
}

export interface AIProviderExtension {
  id: string
  name: string
  models: string[]
  generate: (prompt: string, options: any) => Promise<string>
  stream?: (prompt: string, options: any) => AsyncIterable<string>
}

export interface ExportFormatExtension {
  id: string
  name: string
  extension: string
  mimeType: string
  export: (project: any, options: any) => Promise<Blob | string>
}

export interface WorkflowNodeExtension {
  type: string
  name: string
  description: string
  icon?: string
  inputs: { name: string; type: string }[]
  outputs: { name: string; type: string }[]
  execute: (inputs: any, context: PluginContext) => Promise<any>
  configComponent?: React.ComponentType<any>
}

export interface PluginSetting {
  key: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'password'
  default?: any
  options?: { label: string; value: any }[]
  required?: boolean
}

export interface PluginContext {
  api: {
    showNotification: (message: string, type: 'success' | 'error' | 'info') => void
    openModal: (component: React.ComponentType, props?: any) => void
    closeModal: () => void
    getSettings: () => Record<string, any>
    saveSettings: (settings: Record<string, any>) => void
  }
  store: {
    get: (key: string) => any
    set: (key: string, value: any) => void
  }
  ai: {
    generate: (prompt: string, provider?: string) => Promise<string>
    stream: (prompt: string, provider?: string) => AsyncIterable<string>
  }
}

// Plugin Manager
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map()
  private loadedPlugins: Set<string> = new Set()
  private context: PluginContext

  constructor(context: PluginContext) {
    this.context = context
  }

  // Register a plugin
  async register(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already registered`)
    }

    // Check dependencies
    for (const dep of plugin.dependencies || []) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Missing dependency: ${dep}`)
      }
    }

    this.plugins.set(plugin.id, plugin)
  }

  // Load a plugin
  async load(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`)
    if (this.loadedPlugins.has(pluginId)) return

    // Load dependencies first
    for (const dep of plugin.dependencies || []) {
      await this.load(dep)
    }

    await plugin.onLoad?.()
    this.loadedPlugins.add(pluginId)
  }

  // Unload a plugin
  async unload(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin || !this.loadedPlugins.has(pluginId)) return

    await plugin.onUnload?.()
    this.loadedPlugins.delete(pluginId)
  }

  // Get all registered plugins
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  // Get loaded plugins
  getLoadedPlugins(): Plugin[] {
    return Array.from(this.loadedPlugins).map(id => this.plugins.get(id)!)
  }

  // Get plugin by ID
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)
  }

  // Execute a plugin action
  async executeAction(pluginId: string, actionName: string, params: any): Promise<any> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`)
    
    const action = plugin.actions?.[actionName]
    if (!action) throw new Error(`Action ${actionName} not found in plugin ${pluginId}`)

    return action.handler(params, this.context)
  }

  // Get all AI providers from plugins
  getAIProviders(): AIProviderExtension[] {
    const providers: AIProviderExtension[] = []
    for (const plugin of this.getLoadedPlugins()) {
      if (plugin.aiProviders) {
        providers.push(...plugin.aiProviders)
      }
    }
    return providers
  }

  // Get all export formats from plugins
  getExportFormats(): ExportFormatExtension[] {
    const formats: ExportFormatExtension[] = []
    for (const plugin of this.getLoadedPlugins()) {
      if (plugin.exportFormats) {
        formats.push(...plugin.exportFormats)
      }
    }
    return formats
  }

  // Get all workflow nodes from plugins
  getWorkflowNodes(): WorkflowNodeExtension[] {
    const nodes: WorkflowNodeExtension[] = []
    for (const plugin of this.getLoadedPlugins()) {
      if (plugin.workflowNodes) {
        nodes.push(...plugin.workflowNodes)
      }
    }
    return nodes
  }
}

// Built-in Plugins
export const builtInPlugins: Plugin[] = [
  {
    id: 'solveit-export-html',
    name: 'HTML Export',
    version: '1.0.0',
    description: 'Export projects as HTML files',
    author: 'SolveIt',
    category: 'export',
    exportFormats: [{
      id: 'html',
      name: 'HTML',
      extension: 'html',
      mimeType: 'text/html',
      export: async (project) => project.content
    }]
  },
  {
    id: 'solveit-export-react',
    name: 'React Export',
    version: '1.0.0',
    description: 'Export projects as React components',
    author: 'SolveIt',
    category: 'export',
    exportFormats: [{
      id: 'react',
      name: 'React Component',
      extension: 'tsx',
      mimeType: 'text/plain',
      export: async (project) => convertToReact(project.content)
    }]
  }
]

function convertToReact(html: string): string {
  return `import React from 'react'

export default function Component() {
  return (
    <>
      ${html}
    </>
  )
}`
}


