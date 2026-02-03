'use client'

// IndexedDB Database - Works automatically, no setup needed!
const DB_NAME = 'solveit_pro_db'
const DB_VERSION = 1

interface DBSchema {
  projects: any[]
  agents: any[]
  tools: any[]
  workflows: any[]
  notes: any[]
  conversations: any[]
  prompts: any[]
  history: any[]
  settings: any
}

class SolveItDatabase {
  private db: IDBDatabase | null = null
  private isReady: boolean = false
  private readyPromise: Promise<void>

  constructor() {
    this.readyPromise = this.init()
  }

  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve()
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('Database error:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        this.isReady = true
        console.log('✅ Database ready!')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create all stores
        const stores = [
          'projects', 'agents', 'tools', 'workflows', 
          'notes', 'conversations', 'prompts', 'history', 'settings'
        ]

        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
            store.createIndex('createdAt', 'createdAt', { unique: false })
            store.createIndex('updatedAt', 'updatedAt', { unique: false })
            if (storeName !== 'settings') {
              store.createIndex('name', 'name', { unique: false })
            }
          }
        })

        console.log('✅ Database schema created!')
      }
    })
  }

  async ready(): Promise<void> {
    await this.readyPromise
  }

  // Generic CRUD operations
  async getAll<T>(storeName: string): Promise<T[]> {
    await this.ready()
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async getById<T>(storeName: string, id: string | number): Promise<T | null> {
    await this.ready()
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async add<T>(storeName: string, data: T): Promise<T> {
    await this.ready()
    if (!this.db) throw new Error('Database not ready')

    const item = {
      ...data,
      id: (data as any).id || crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(item)

      request.onsuccess = () => resolve(item)
      request.onerror = () => reject(request.error)
    })
  }

  async update<T>(storeName: string, id: string | number, data: Partial<T>): Promise<T> {
    await this.ready()
    if (!this.db) throw new Error('Database not ready')

    const existing = await this.getById<T>(storeName, id)
    if (!existing) throw new Error('Item not found')

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(updated)

      request.onsuccess = () => resolve(updated)
      request.onerror = () => reject(request.error)
    })
  }

  async delete(storeName: string, id: string | number): Promise<void> {
    await this.ready()
    if (!this.db) throw new Error('Database not ready')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(storeName: string): Promise<void> {
    await this.ready()
    if (!this.db) throw new Error('Database not ready')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async search<T>(storeName: string, query: string): Promise<T[]> {
    const all = await this.getAll<T>(storeName)
    const lowerQuery = query.toLowerCase()
    
    return all.filter(item => {
      const str = JSON.stringify(item).toLowerCase()
      return str.includes(lowerQuery)
    })
  }

  // Specific methods for each store
  async getProjects() { return this.getAll('projects') }
  async addProject(p: any) { return this.add('projects', p) }
  async updateProject(id: string, p: any) { return this.update('projects', id, p) }
  async deleteProject(id: string) { return this.delete('projects', id) }

  async getAgents() { return this.getAll('agents') }
  async addAgent(a: any) { return this.add('agents', a) }
  async updateAgent(id: string, a: any) { return this.update('agents', id, a) }
  async deleteAgent(id: string) { return this.delete('agents', id) }

  async getTools() { return this.getAll('tools') }
  async addTool(t: any) { return this.add('tools', t) }
  async updateTool(id: string, t: any) { return this.update('tools', id, t) }
  async deleteTool(id: string) { return this.delete('tools', id) }

  async getWorkflows() { return this.getAll('workflows') }
  async addWorkflow(w: any) { return this.add('workflows', w) }
  async updateWorkflow(id: string, w: any) { return this.update('workflows', id, w) }
  async deleteWorkflow(id: string) { return this.delete('workflows', id) }

  async getNotes() { return this.getAll('notes') }
  async addNote(n: any) { return this.add('notes', n) }
  async updateNote(id: string, n: any) { return this.update('notes', id, n) }
  async deleteNote(id: string) { return this.delete('notes', id) }

  async getConversations() { return this.getAll('conversations') }
  async addConversation(c: any) { return this.add('conversations', c) }
  async updateConversation(id: string, c: any) { return this.update('conversations', id, c) }
  async deleteConversation(id: string) { return this.delete('conversations', id) }

  async getPrompts() { return this.getAll('prompts') }
  async addPrompt(p: any) { return this.add('prompts', p) }
  async deletePrompt(id: string) { return this.delete('prompts', id) }

  async getHistory() { return this.getAll('history') }
  async addHistory(h: any) { return this.add('history', h) }
  async clearHistory() { return this.clear('history') }

  // Settings
  async getSettings() {
    const all = await this.getAll<any>('settings')
    return all[0] || null
  }

  async saveSettings(settings: any) {
    await this.clear('settings')
    return this.add('settings', { ...settings, id: 'main' })
  }

  // Export all data
  async exportAll(): Promise<DBSchema> {
    return {
      projects: await this.getProjects() as any[],
      agents: await this.getAgents() as any[],
      tools: await this.getTools() as any[],
      workflows: await this.getWorkflows() as any[],
      notes: await this.getNotes() as any[],
      conversations: await this.getConversations() as any[],
      prompts: await this.getPrompts() as any[],
      history: await this.getHistory() as any[],
      settings: await this.getSettings()
    }
  }

  // Import all data
  async importAll(data: Partial<DBSchema>): Promise<void> {
    if (data.projects) {
      await this.clear('projects')
      for (const p of data.projects) await this.add('projects', p)
    }
    if (data.agents) {
      await this.clear('agents')
      for (const a of data.agents) await this.add('agents', a)
    }
    if (data.tools) {
      await this.clear('tools')
      for (const t of data.tools) await this.add('tools', t)
    }
    if (data.workflows) {
      await this.clear('workflows')
      for (const w of data.workflows) await this.add('workflows', w)
    }
    if (data.notes) {
      await this.clear('notes')
      for (const n of data.notes) await this.add('notes', n)
    }
    if (data.conversations) {
      await this.clear('conversations')
      for (const c of data.conversations) await this.add('conversations', c)
    }
    if (data.prompts) {
      await this.clear('prompts')
      for (const p of data.prompts) await this.add('prompts', p)
    }
    if (data.history) {
      await this.clear('history')
      for (const h of data.history) await this.add('history', h)
    }
    if (data.settings) {
      await this.saveSettings(data.settings)
    }
  }

  // Wipe everything
  async wipeAll(): Promise<void> {
    const stores = ['projects', 'agents', 'tools', 'workflows', 'notes', 'conversations', 'prompts', 'history', 'settings']
    for (const store of stores) {
      await this.clear(store)
    }
  }
}

// Singleton instance
export const db = new SolveItDatabase()
export default db
