// ============================================
// 🗃️ ZUSTAND STORE - Global State Management
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';

// ================== FALLBACK STORAGE (works when localStorage disabled) ==================

const memoryStorage: Record<string, string> = {};

const createFallbackStorage = (): StateStorage => {
  return {
    getItem: (name: string): string | null => {
      try {
        return localStorage.getItem(name);
      } catch {
        try {
          return sessionStorage.getItem(name);
        } catch {
          return memoryStorage[name] || null;
        }
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        localStorage.setItem(name, value);
      } catch {
        try {
          sessionStorage.setItem(name, value);
        } catch {
          memoryStorage[name] = value;
        }
      }
    },
    removeItem: (name: string): void => {
      try {
        localStorage.removeItem(name);
      } catch {
        try {
          sessionStorage.removeItem(name);
        } catch {
          delete memoryStorage[name];
        }
      }
    },
  };
};

const fallbackStorage = createFallbackStorage();

// ================== TYPES ==================

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  avatarUrl?: string;
  isDemo?: boolean; // Demo mode flag
}

interface Conversation {
  id: string;
  title: string;
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  isArchived: boolean;
}

interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    model?: string;
    provider?: string;
    tokens?: number;
    latencyMs?: number;
  };
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
  createdAt: Date;
}

interface VoiceConfig {
  inputDevice?: string;
  outputDevice?: string;
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
  language: 'ar' | 'en' | 'auto';
}

interface AIConfig {
  thinkingDepth: 'fast' | 'balanced' | 'deep' | 'unlimited';
  creativityLevel: number;
  temperature: number;
  maxTokens: number;
  showThinking: boolean;
}

// AI Memory - What the AI remembers about the user
interface AIMemory {
  userName?: string;
  preferences: Record<string, string>;      // User preferences AI learned
  facts: string[];                          // Facts about user
  importantDates: Record<string, string>;   // Birthdays, deadlines, etc.
  lastTopics: string[];                     // Recent conversation topics
  customInstructions?: string;              // User's custom instructions
  autoLearn: boolean;                       // Auto-learn from conversations
}

interface Store {
  // Auth
  user: User | null;
  isLoading: boolean;
  
  // UI
  theme: string;
  language: 'ar' | 'en';
  sidebarCollapsed: boolean;
  conversationSidebarOpen: boolean;  // NEW: Sliding conversation sidebar
  
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Map<string, Message[]>;
  
  // Voice
  voiceConfig: VoiceConfig;
  isInVoiceCall: boolean;
  
  // AI Settings
  aiConfig: AIConfig;
  
  // AI Memory - persisted across sessions
  aiMemory: AIMemory;
  
  // Provider stats
  providerStats: {
    groq: { used: number; limit: number };
    gemini: { used: number; limit: number };
    openrouter: { used: number; limit: number };
  };
  
  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: 'google' | 'github') => Promise<void>;
  loginAsDemo: () => void;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  
  setTheme: (theme: string) => void;
  setLanguage: (language: 'ar' | 'en') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setConversationSidebarOpen: (open: boolean) => void;  // NEW
  
  createConversation: (title?: string, agentId?: string) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'createdAt'>) => Message;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  getMessages: (conversationId: string) => Message[];
  
  setVoiceConfig: (config: Partial<VoiceConfig>) => void;
  setIsInVoiceCall: (inCall: boolean) => void;
  
  setAIConfig: (config: Partial<AIConfig>) => void;
  setUser: (user: User | null) => void;
  
  // AI Memory actions
  updateAIMemory: (updates: Partial<AIMemory>) => void;
  addMemoryFact: (fact: string) => void;
  addMemoryPreference: (key: string, value: string) => void;
  clearAIMemory: () => void;
  getMemoryContext: () => string;  // Returns memory as context for AI
  
  updateProviderStats: () => Promise<void>;
}

// ================== DEFAULT VALUES ==================

const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  voice: 'en-US-Neural2-A',
  speed: 1.0,
  pitch: 1.0,
  volume: 1.0,
  language: 'auto',
};

const DEFAULT_AI_CONFIG: AIConfig = {
  thinkingDepth: 'deep',
  creativityLevel: 0.8,
  temperature: 0.7,
  maxTokens: 4096,
  showThinking: false,
};

const DEFAULT_AI_MEMORY: AIMemory = {
  preferences: {},
  facts: [],
  importantDates: {},
  lastTopics: [],
  autoLearn: true,  // AI auto-learns by default
};

// ================== HELPER: Check Supabase ==================

const getSupabase = async () => {
  try {
    const { supabase } = await import('../lib/supabase');
    // Check if supabase is properly configured
    if (!supabase || !supabase.auth) {
      return null;
    }
    return supabase;
  } catch {
    return null;
  }
};

// ================== STORE ==================

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // Initial state - NOT loading by default for demo mode
      user: null,
      isLoading: false, // Changed to false!
      theme: 'dark',  // Three themes: 'dark' | 'light' | 'pink'
      language: 'en',
      sidebarCollapsed: false,
      conversationSidebarOpen: false,  // NEW
      conversations: [],
      activeConversationId: null,
      messages: new Map(),
      voiceConfig: DEFAULT_VOICE_CONFIG,
      isInVoiceCall: false,
      aiConfig: DEFAULT_AI_CONFIG,
      aiMemory: DEFAULT_AI_MEMORY,  // NEW
      providerStats: {
        groq: { used: 0, limit: 14400 },
        gemini: { used: 0, limit: 1500 },
        openrouter: { used: 0, limit: 200 },
      },
      
      // Actions
      initialize: async () => {
        set({ isLoading: true });
        try {
          const supabase = await getSupabase();
          if (!supabase) {
            console.log('Supabase not configured, running in demo mode');
            set({ isLoading: false });
            return;
          }

          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();
            
            set({
              user: {
                id: user.id,
                email: user.email!,
                name: profile?.name,
                avatarUrl: profile?.avatar_url,
              },
              theme: profile?.theme || 'pink',
              language: profile?.language || 'en',
            });
            
            // Load conversations
            const { data: conversations } = await supabase
              .from('conversations')
              .select('*')
              .eq('user_id', user.id)
              .order('updated_at', { ascending: false });
            
            if (conversations) {
              set({
                conversations: conversations.map(c => ({
                  id: c.id,
                  title: c.title || 'New conversation',
                  agentId: c.agent_id,
                  createdAt: new Date(c.created_at),
                  updatedAt: new Date(c.updated_at),
                  isPinned: c.is_pinned,
                  isArchived: c.is_archived,
                })),
              });
            }
          }
        } catch (error) {
          console.error('Init error:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      login: async (email, password) => {
        const supabase = await getSupabase();
        if (!supabase) {
          // Demo mode fallback
          get().loginAsDemo();
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        await get().initialize();
      },
      
      loginWithProvider: async (provider) => {
        const supabase = await getSupabase();
        if (!supabase) {
          get().loginAsDemo();
          return;
        }
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
      },
      
      // NEW: Demo mode login
      loginAsDemo: () => {
        const demoUser: User = {
          id: 'demo-user-' + Date.now(),
          email: 'demo@try-it.app',
          name: 'Demo User',
          isDemo: true,
        };
        
        // Create a welcome conversation
        const welcomeConversation: Conversation = {
          id: 'welcome-' + Date.now(),
          title: '👋 مرحباً بك في Try-It!',
          agentId: 'default',
          createdAt: new Date(),
          updatedAt: new Date(),
          isPinned: true,
          isArchived: false,
        };
        
        set({
          user: demoUser,
          conversations: [welcomeConversation],
          activeConversationId: welcomeConversation.id,
          isLoading: false,
        });
      },
      
      register: async (email, password, name) => {
        const supabase = await getSupabase();
        if (!supabase) {
          get().loginAsDemo();
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });
        if (error) throw error;
        await get().initialize();
      },
      
      logout: async () => {
        try {
          const supabase = await getSupabase();
          if (supabase) {
            await supabase.auth.signOut();
          }
        } catch (e) {
          // Ignore errors
        }
        set({
          user: null,
          conversations: [],
          activeConversationId: null,
          messages: new Map(),
        });
      },
      
      setTheme: (theme) => {
        set({ theme });
        // Only sync to Supabase if not in demo mode
        const user = get().user;
        if (user && !user.isDemo) {
          getSupabase().then(supabase => {
            if (supabase) {
              supabase.from('users').update({ theme }).eq('id', user.id);
            }
          });
        }
      },
      
      setLanguage: (language) => {
        set({ language });
        const user = get().user;
        if (user && !user.isDemo) {
          getSupabase().then(supabase => {
            if (supabase) {
              supabase.from('users').update({ language }).eq('id', user.id);
            }
          });
        }
      },
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setConversationSidebarOpen: (open) => set({ conversationSidebarOpen: open }),
      
      createConversation: async (title, agentId = 'default') => {
        const user = get().user;
        if (!user) throw new Error('Not authenticated');
        
        const conversation: Conversation = {
          id: crypto.randomUUID(),
          title: title || 'محادثة جديدة',
          agentId: agentId,
          createdAt: new Date(),
          updatedAt: new Date(),
          isPinned: false,
          isArchived: false,
        };
        
        // Save to Supabase if not demo
        if (!user.isDemo) {
          try {
            const supabase = await getSupabase();
            if (supabase) {
              const { data, error } = await supabase
                .from('conversations')
                .insert({
                  id: conversation.id,
                  user_id: user.id,
                  title: conversation.title,
                  agent_id: agentId,
                })
                .select()
                .single();
              
              if (!error && data) {
                conversation.id = data.id;
              }
            }
          } catch (e) {
            // Continue with local conversation
          }
        }
        
        set({
          conversations: [conversation, ...get().conversations],
          activeConversationId: conversation.id,
        });
        
        return conversation;
      },
      
      deleteConversation: async (id) => {
        const user = get().user;
        if (user && !user.isDemo) {
          try {
            const supabase = await getSupabase();
            if (supabase) {
              await supabase.from('conversations').delete().eq('id', id);
            }
          } catch (e) {
            // Continue
          }
        }
        
        const messages = new Map(get().messages);
        messages.delete(id);
        
        set({
          conversations: get().conversations.filter(c => c.id !== id),
          messages,
          activeConversationId: get().activeConversationId === id ? null : get().activeConversationId,
        });
      },
      
      setActiveConversation: (id) => set({ activeConversationId: id }),
      
      updateConversation: async (id, updates) => {
        const user = get().user;
        if (user && !user.isDemo) {
          try {
            const supabase = await getSupabase();
            if (supabase) {
              await supabase.from('conversations').update({
                title: updates.title,
                is_pinned: updates.isPinned,
                is_archived: updates.isArchived,
              }).eq('id', id);
            }
          } catch (e) {
            // Continue
          }
        }
        
        set({
          conversations: get().conversations.map(c =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
        });
      },
      
      addMessage: (conversationId, message) => {
        const newMessage: Message = {
          ...message,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };
        
        const messages = new Map(get().messages);
        const existing = messages.get(conversationId) || [];
        messages.set(conversationId, [...existing, newMessage]);
        
        set({ messages });
        
        // Save to database if not demo
        const user = get().user;
        if (user && !user.isDemo) {
          getSupabase().then(supabase => {
            if (supabase) {
              supabase.from('messages').insert({
                id: newMessage.id,
                conversation_id: conversationId,
                role: newMessage.role,
                content: newMessage.content,
                metadata: newMessage.metadata,
                attachments: newMessage.attachments,
              });
            }
          });
        }
        
        return newMessage;
      },
      
      updateMessage: (conversationId, messageId, updates) => {
        const messages = new Map(get().messages);
        const existing = messages.get(conversationId) || [];
        
        messages.set(conversationId, existing.map(m =>
          m.id === messageId ? { ...m, ...updates } : m
        ));
        
        set({ messages });
      },
      
      getMessages: (conversationId) => {
        return get().messages.get(conversationId) || [];
      },
      
      setVoiceConfig: (config) => {
        set({ voiceConfig: { ...get().voiceConfig, ...config } });
      },
      
      setIsInVoiceCall: (inCall) => set({ isInVoiceCall: inCall }),
      
      setAIConfig: (config) => {
        set({ aiConfig: { ...get().aiConfig, ...config } });
      },
      
      setUser: (user) => set({ user }),
      
      // ========== AI MEMORY ACTIONS ==========
      
      updateAIMemory: (updates) => {
        set({ aiMemory: { ...get().aiMemory, ...updates } });
      },
      
      addMemoryFact: (fact) => {
        const memory = get().aiMemory;
        // Don't add duplicates
        if (!memory.facts.includes(fact)) {
          set({ 
            aiMemory: { 
              ...memory, 
              facts: [...memory.facts.slice(-49), fact]  // Keep last 50 facts
            } 
          });
        }
      },
      
      addMemoryPreference: (key, value) => {
        const memory = get().aiMemory;
        set({ 
          aiMemory: { 
            ...memory, 
            preferences: { ...memory.preferences, [key]: value }
          } 
        });
      },
      
      clearAIMemory: () => {
        set({ aiMemory: DEFAULT_AI_MEMORY });
      },
      
      // Generate context string for AI from memory
      getMemoryContext: () => {
        const memory = get().aiMemory;
        const parts: string[] = [];
        
        if (memory.userName) {
          parts.push(`User's name: ${memory.userName}`);
        }
        
        if (memory.customInstructions) {
          parts.push(`Custom instructions: ${memory.customInstructions}`);
        }
        
        if (Object.keys(memory.preferences).length > 0) {
          parts.push(`Preferences: ${Object.entries(memory.preferences).map(([k,v]) => `${k}: ${v}`).join(', ')}`);
        }
        
        if (memory.facts.length > 0) {
          parts.push(`Known facts about user: ${memory.facts.slice(-10).join('; ')}`);
        }
        
        if (Object.keys(memory.importantDates).length > 0) {
          parts.push(`Important dates: ${Object.entries(memory.importantDates).map(([k,v]) => `${k}: ${v}`).join(', ')}`);
        }
        
        if (memory.lastTopics.length > 0) {
          parts.push(`Recent topics: ${memory.lastTopics.slice(-5).join(', ')}`);
        }
        
        return parts.length > 0 ? `[MEMORY]\n${parts.join('\n')}\n[/MEMORY]\n\n` : '';
      },
      
      updateProviderStats: async () => {
        try {
          const response = await fetch('/api/chat/stats');
          const stats = await response.json();
          set({ providerStats: stats });
        } catch (error) {
          console.error('Failed to update provider stats:', error);
        }
      },
    }),
    {
      name: 'try-it-storage',
      storage: createJSONStorage(() => fallbackStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
        voiceConfig: state.voiceConfig,
        aiConfig: state.aiConfig,
        aiMemory: state.aiMemory,  // Persist AI memory!
        // Also persist user and conversations for demo mode
        user: state.user,
        conversations: state.conversations,
      }),
    }
  )
);

export default useStore;
