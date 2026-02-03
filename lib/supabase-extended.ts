// ============================================
// EXTENDED SUPABASE DATABASE METHODS
// ============================================
// Import and extend from lib/supabase.ts
import { db } from './supabase'
import { supabase } from './supabase'
import type { SearchResult, MediaGeneration, UserPlugin, WorkflowExecution, Deployment } from './supabase'

// 🔍 SEARCH HISTORY
export const searchDB = {
  async save(userId: string, query: string, results: any[]) {
    const { data, error } = await supabase.from('search_results').insert({
      user_id: userId,
      query,
      results,
      saved_at: new Date().toISOString()
    }).select().single()
    if (error) throw error
    return data as SearchResult
  },
  async list(userId: string, limit: number = 20) {
    const { data, error } = await supabase.from('search_results')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data as SearchResult[]
  },
  async delete(searchId: string) {
    await supabase.from('search_results').delete().eq('id', searchId)
  }
}

// 🎨 MEDIA GENERATIONS
export const mediaDB = {
  async save(userId: string, type: 'image' | 'video', provider: string, prompt: string, url: string, metadata: any = {}) {
    const { data, error } = await supabase.from('media_generations').insert({
      user_id: userId,
      type,
      provider,
      prompt,
      url,
      metadata,
      created_at: new Date().toISOString()
    }).select().single()
    if (error) throw error
    return data as MediaGeneration
  },
  async list(userId: string, type?: 'image' | 'video', limit: number = 50) {
    let query = supabase.from('media_generations').select('*').eq('user_id', userId)
    if (type) query = query.eq('type', type)
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data as MediaGeneration[]
  },
  async delete(mediaId: string) {
    await supabase.from('media_generations').delete().eq('id', mediaId)
  }
}

// 🔌 PLUGINS
export const pluginDB = {
  async enable(userId: string, pluginId: string, settings: any = {}) {
    const { data, error } = await supabase.from('user_plugins')
      .upsert({ user_id: userId, plugin_id: pluginId, is_enabled: true, settings })
      .select().single()
    if (error) throw error
    return data as UserPlugin
  },
  async disable(userId: string, pluginId: string) {
    const { data, error } = await supabase.from('user_plugins')
      .update({ is_enabled: false })
      .eq('user_id', userId)
      .eq('plugin_id', pluginId)
      .select().single()
    if (error) throw error
    return data as UserPlugin
  },
  async list(userId: string, onlyEnabled: boolean = true) {
    let query = supabase.from('user_plugins').select('*').eq('user_id', userId)
    if (onlyEnabled) query = query.eq('is_enabled', true)
    const { data, error } = await query
    if (error) throw error
    return data as UserPlugin[]
  },
  async updateSettings(userId: string, pluginId: string, settings: any) {
    const { data, error } = await supabase.from('user_plugins')
      .update({ settings })
      .eq('user_id', userId)
      .eq('plugin_id', pluginId)
      .select().single()
    if (error) throw error
    return data as UserPlugin
  }
}

// 📊 WORKFLOWS
export const workflowDB = {
  async logExecution(workflowId: string, userId: string, status: string, variables: any = {}, logs: any = []) {
    const { data, error } = await supabase.from('workflow_executions').insert({
      workflow_id: workflowId,
      user_id: userId,
      status,
      variables,
      logs,
      started_at: new Date().toISOString()
    }).select().single()
    if (error) throw error
    return data as WorkflowExecution
  },
  async updateExecution(executionId: string, updates: Partial<WorkflowExecution>) {
    const { data, error } = await supabase.from('workflow_executions')
      .update(updates)
      .eq('id', executionId)
      .select().single()
    if (error) throw error
    return data as WorkflowExecution
  },
  async listExecutions(workflowId: string, limit: number = 50) {
    const { data, error } = await supabase.from('workflow_executions')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('started_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data as WorkflowExecution[]
  }
}

// 🚀 DEPLOYMENTS
export const deploymentDB = {
  async create(userId: string, projectId: string, provider: string) {
    const { data, error } = await supabase.from('deployments').insert({
      user_id: userId,
      project_id: projectId,
      provider,
      status: 'pending',
      url: '',
      logs: [],
      deployed_at: new Date().toISOString()
    }).select().single()
    if (error) throw error
    return data as Deployment
  },
  async update(deploymentId: string, updates: Partial<Deployment>) {
    const { data, error } = await supabase.from('deployments')
      .update(updates)
      .eq('id', deploymentId)
      .select().single()
    if (error) throw error
    return data as Deployment
  },
  async list(projectId: string, limit: number = 20) {
    const { data, error } = await supabase.from('deployments')
      .select('*')
      .eq('project_id', projectId)
      .order('deployed_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data as Deployment[]
  }
}

export { db }
