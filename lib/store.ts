// ============================================
// SOLVE IT! - Zustand Store
// State management with persistence
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Safe localStorage wrapper that handles security errors
const safeStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(name);
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(name, value);
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(name);
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  },
};
import type { 
  Project, 
  Conversation, 
  Agent, 
  AgentMemory,
  Tool, 
  Workflow, 
  Note,
  APIKeys 
} from './types';

// ============================================
// TYPES
// ============================================
export type ServiceType = 'dashboard' | 'builder' | 'probuilder' | 'liveeditor' | 'liveeditor-ai' | 'agents' | 'agents-enhanced' | 'tools' | 'tools-generator' | 'workflows' | 'workflows-enhanced' | 'library' | 'settings' | 'search' | 'media' | 'deploy' | 'prompts' | 'notes' | 'assistant';
export type Language = 'ar' | 'en';
export type Theme = 'light' | 'dark' | 'dark-blue' | 'pink';

interface BuilderHistory {
  pages: { name: string; content: string }[];
  currentPage: number;
}

interface AppState {
  // Auth
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;

  // UI
  currentService: ServiceType;
  setCurrentService: (service: ServiceType) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // API Keys
  apiKeys: APIKeys;
  setApiKeys: (keys: APIKeys) => void;

  // Projects
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Conversations
  conversations: Conversation[];
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;

  // Agents
  agents: Agent[];
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  addAgentMemory: (agentId: string, memory: AgentMemory) => void;
  clearAgentMemory: (agentId: string) => void;

  // Tools
  tools: Tool[];
  addTool: (tool: Tool) => void;
  updateTool: (id: string, updates: Partial<Tool>) => void;
  deleteTool: (id: string) => void;

  // Workflows
  workflows: Workflow[];
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;

  // Notes
  notes: Note[];
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // ⭐ Favorites
  favorites: { type: string; id: string }[];
  toggleFavorite: (type: string, id: string) => void;
  isFavorite: (type: string, id: string) => boolean;

  // 🔄 Builder Undo/Redo
  builderHistory: BuilderHistory[];
  builderHistoryIndex: number;
  pushBuilderHistory: (state: BuilderHistory) => void;
  undoBuilder: () => BuilderHistory | null;
  redoBuilder: () => BuilderHistory | null;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // 💾 Auto-save timestamp
  lastAutoSave: number;
  setLastAutoSave: (timestamp: number) => void;

  // 🔗 Shared Code (between ProBuilder & Live Editor)
  sharedCode: { html: string; css: string; js: string; name?: string } | null;
  setSharedCode: (code: { html: string; css: string; js: string; name?: string } | null) => void;

  // 🤖 Agent to Live Editor Connection
  agentCodeOutput: { html: string; css: string; js: string; agentName?: string; autoNavigate?: boolean } | null;
  setAgentCodeOutput: (code: { html: string; css: string; js: string; agentName?: string; autoNavigate?: boolean } | null) => void;
  sendCodeToLiveEditor: (code: { html: string; css: string; js: string }, agentName?: string) => void;
}

// ============================================
// STORE
// ============================================
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ==================
      // AUTH
      // ==================
      isAuthenticated: false,
      login: (password: string) => {
        if (password === '1606') {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthenticated: false }),

      // ==================
      // UI
      // ==================
      currentService: 'dashboard',
      setCurrentService: (service) => set({ currentService: service }),
      language: 'ar',
      setLanguage: (lang) => set({ language: lang }),
      theme: 'dark',
      setTheme: (theme) => set({ theme: theme }),
      
      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // ==================
      // API KEYS
      // ==================
      apiKeys: {
        groq: '',
        gemini: '',
        deepseek: '',
        openai: '',
        anthropic: '',
        claude: '', // alias for anthropic
        tavily: '',
        stability: '', // Stability AI for images
        replicate: '', // Replicate for Flux models
        runway: '', // Runway for video generation
      },
      setApiKeys: (keys) => set({ apiKeys: keys }),

      // ==================
      // PROJECTS
      // ==================
      projects: [],
      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),
      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),

      // ==================
      // CONVERSATIONS
      // ==================
      conversations: [],
      addConversation: (conversation) =>
        set((state) => ({ conversations: [...state.conversations, conversation] })),
      updateConversation: (id, updates) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
        })),

      // ==================
      // AGENTS
      // ==================
      agents: [],
      addAgent: (agent) =>
        set((state) => ({ agents: [...state.agents, agent] })),
      updateAgent: (id, updates) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),
      deleteAgent: (id) =>
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
        })),
      addAgentMemory: (agentId, memory) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? { ...a, memory: [...a.memory, memory], updatedAt: new Date().toISOString() }
              : a
          ),
        })),
      clearAgentMemory: (agentId) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? { ...a, memory: [], updatedAt: new Date().toISOString() }
              : a
          ),
        })),

      // ==================
      // TOOLS
      // ==================
      tools: [],
      addTool: (tool) =>
        set((state) => ({ tools: [...state.tools, tool] })),
      updateTool: (id, updates) =>
        set((state) => ({
          tools: state.tools.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      deleteTool: (id) =>
        set((state) => ({
          tools: state.tools.filter((t) => t.id !== id),
        })),

      // ==================
      // WORKFLOWS
      // ==================
      workflows: [],
      addWorkflow: (workflow) =>
        set((state) => ({ workflows: [...state.workflows, workflow] })),
      updateWorkflow: (id, updates) =>
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        })),
      deleteWorkflow: (id) =>
        set((state) => ({
          workflows: state.workflows.filter((w) => w.id !== id),
        })),

      // ==================
      // NOTES
      // ==================
      notes: [],
      addNote: (note) =>
        set((state) => ({ notes: [...state.notes, note] })),
      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        })),
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        })),

      // ==================
      // ⭐ FAVORITES
      // ==================
      favorites: [],
      toggleFavorite: (type, id) =>
        set((state) => {
          const exists = state.favorites.some(
            (f) => f.type === type && f.id === id
          );
          if (exists) {
            return {
              favorites: state.favorites.filter(
                (f) => !(f.type === type && f.id === id)
              ),
            };
          }
          return { favorites: [...state.favorites, { type, id }] };
        }),
      isFavorite: (type, id) => {
        return get().favorites.some((f) => f.type === type && f.id === id);
      },

      // ==================
      // 🔄 UNDO/REDO
      // ==================
      builderHistory: [],
      builderHistoryIndex: -1,
      pushBuilderHistory: (state) =>
        set((s) => {
          // Remove any redo states
          const newHistory = s.builderHistory.slice(0, s.builderHistoryIndex + 1);
          // Limit history to 50 states
          if (newHistory.length >= 50) {
            newHistory.shift();
          }
          return {
            builderHistory: [...newHistory, state],
            builderHistoryIndex: newHistory.length,
          };
        }),
      undoBuilder: () => {
        const state = get();
        if (state.builderHistoryIndex > 0) {
          const newIndex = state.builderHistoryIndex - 1;
          set({ builderHistoryIndex: newIndex });
          return state.builderHistory[newIndex];
        }
        return null;
      },
      redoBuilder: () => {
        const state = get();
        if (state.builderHistoryIndex < state.builderHistory.length - 1) {
          const newIndex = state.builderHistoryIndex + 1;
          set({ builderHistoryIndex: newIndex });
          return state.builderHistory[newIndex];
        }
        return null;
      },
      canUndo: () => get().builderHistoryIndex > 0,
      canRedo: () => get().builderHistoryIndex < get().builderHistory.length - 1,

      // ==================
      // 💾 AUTO-SAVE
      // ==================
      lastAutoSave: 0,
      setLastAutoSave: (timestamp) => set({ lastAutoSave: timestamp }),

      // ==================
      // SHARED CODE
      // ==================
      sharedCode: null,
      setSharedCode: (code) => set({ sharedCode: code }),

      // ==================
      // 🤖 AGENT TO LIVE EDITOR
      // ==================
      agentCodeOutput: null,
      setAgentCodeOutput: (code) => set({ agentCodeOutput: code }),
      sendCodeToLiveEditor: (code, agentName) => set({ 
        sharedCode: { ...code, name: agentName ? `من الوكيل: ${agentName}` : 'Agent Generated' },
        currentService: 'liveeditor-ai' as ServiceType
      }),
    }),
    {
      name: 'solveit-storage',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);

// Alias for backwards compatibility
export const useStore = useAppStore;
