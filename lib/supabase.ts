// ============================================
// 1. SUPABASE DATABASE INTEGRATION
// ============================================
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Handle missing environment variables gracefully
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'

// Only create client if valid URL provided
let supabaseInstance: SupabaseClient | null = null

try {
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
} catch (e) {
  console.warn('Supabase client not initialized - missing configuration')
}

export const supabase = supabaseInstance || createClient(supabaseUrl, supabaseAnonKey)

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && !supabaseUrl.includes('placeholder') && supabaseAnonKey && !supabaseAnonKey.includes('placeholder')
}

// Database Types
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  api_keys: Record<string, string>
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  type: 'website' | 'agent' | 'tool' | 'workflow'
  content: any
  version: number
  is_public: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export interface ProjectVersion {
  id: string
  project_id: string
  version: number
  content: any
  message: string
  created_at: string
}

export interface Attachment {
  id: string
  user_id: string
  project_id?: string
  name: string
  type: string
  size: number
  url: string
  created_at: string
}

export interface SearchResult {
  id: string
  user_id: string
  query: string
  results: any[]
  saved_at: string
}

export interface MediaGeneration {
  id: string
  user_id: string
  type: 'image' | 'video'
  provider: string
  prompt: string
  url: string
  metadata: Record<string, any>
  created_at: string
}

export interface UserPlugin {
  id: string
  user_id: string
  plugin_id: string
  is_enabled: boolean
  settings: Record<string, any>
  created_at: string
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  user_id: string
  status: 'running' | 'completed' | 'failed' | 'paused'
  variables: Record<string, any>
  logs: any[]
  started_at: string
  completed_at?: string
}

export interface Deployment {
  id: string
  user_id: string
  project_id: string
  provider: string
  status: 'pending' | 'building' | 'success' | 'failed'
  url: string
  logs: string[]
  deployed_at: string
}

// Database Operations - with fallback handling
export const db = {
  users: {
    async get(userId: string) {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
      if (error) throw error
      return data as User
    },
    async update(userId: string, updates: Partial<User>) {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const { data, error } = await supabase.from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId).select().single()
      if (error) throw error
      return data as User
    }
  },

  projects: {
    async list(userId: string, type?: string) {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      let query = supabase.from('projects').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
      if (type) query = query.eq('type', type)
      const { data, error } = await query
      if (error) throw error
      return data as Project[]
    },
    async get(projectId: string) {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single()
      if (error) throw error
      return data as Project
    },
    async create(project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'version'>) {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const { data, error } = await supabase.from('projects').insert({ ...project, version: 1 }).select().single()
      if (error) throw error
      return data as Project
    },
    async update(projectId: string, updates: Partial<Project>) {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const { data, error } = await supabase.from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', projectId).select().single()
      if (error) throw error
      return data as Project
    },
    async delete(projectId: string) {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      await supabase.from('projects').delete().eq('id', projectId)
    },
    async saveVersion(projectId: string, content: any, message: string) {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const project = await this.get(projectId)
      const newVersion = project.version + 1
      await supabase.from('project_versions').insert({ project_id: projectId, version: newVersion, content, message })
      return this.update(projectId, { content, version: newVersion })
    },
    async getVersions(projectId: string) {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const { data, error } = await supabase.from('project_versions').select('*').eq('project_id', projectId).order('version', { ascending: false })
      if (error) throw error
      return data as ProjectVersion[]
    },
    async restoreVersion(projectId: string, versionId: string) {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const { data: version } = await supabase.from('project_versions').select('content').eq('id', versionId).single()
      if (version) return this.saveVersion(projectId, version.content, 'Restored from version')
    }
  },

  attachments: {
    async upload(userId: string, file: File, projectId?: string) {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const fileName = `${userId}/${Date.now()}-${file.name}`
      await supabase.storage.from('attachments').upload(fileName, file)
      const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(fileName)
      const { data, error } = await supabase.from('attachments')
        .insert({ user_id: userId, project_id: projectId, name: file.name, type: file.type, size: file.size, url: publicUrl })
        .select().single()
      if (error) throw error
      return data as Attachment
    },
    async list(userId: string, projectId?: string) {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      let query = supabase.from('attachments').select('*').eq('user_id', userId)
      if (projectId) query = query.eq('project_id', projectId)
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data as Attachment[]
    },
    async delete(attachmentId: string) {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      await supabase.from('attachments').delete().eq('id', attachmentId)
    }
  }
}

export default db
