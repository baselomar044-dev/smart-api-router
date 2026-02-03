// ============================================
// SOLVE IT! - App Type Definitions
// ============================================

import { APIKeysConfig } from './ai/types';

// Re-export APIKeysConfig as APIKeys for backwards compatibility
export type APIKeys = APIKeysConfig;

export type ServiceType = 'dashboard' | 'builder' | 'probuilder' | 'agents' | 'agents-enhanced' | 'tools' | 'tools-generator' | 'workflows' | 'workflows-enhanced' | 'settings' | 'library' | 'search' | 'media' | 'deploy' | 'plugins' | 'versions' | 'notes' | 'assistant' | 'prompts';

// PageData for export templates
export interface PageData {
  name: string;
  content: string;
}
export type Language = 'ar' | 'en';

// Project types
export interface ProjectPage {
  id: string;
  name: string;
  content: string;
}

export interface ProjectFile {
  id?: string;
  path?: string;
  name: string;
  content?: string;
  type: 'html' | 'css' | 'js' | 'json' | 'md' | 'ts' | 'tsx' | 'file' | 'folder';
  language?: string;
  children?: ProjectFile[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  files: ProjectFile[];
  pages?: ProjectPage[];
  createdAt: string;
  updatedAt: string;
}

// Conversation types (for Builder)
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  projectId?: string;
  projectName?: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

// Note types
export type NoteCategory = 'general' | 'idea' | 'todo' | 'reference' | 'bug' | 'feature';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Agent types
export interface AgentAttachment {
  name: string;
  type: string;
  size: number;
}

export interface AgentMemory {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: AgentAttachment[];
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  preferredProvider?: string;
  customApiKey?: string;
  memory: AgentMemory[];
  createdAt: string;
  updatedAt: string;
}

// Tool types
export type ToolType = 'http' | 'function';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  description: string;
  required: boolean;
  default?: any;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  type: ToolType;
  // For HTTP tools
  url?: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  // For function tools
  code?: string;
  // Common
  parameters: ToolParameter[];
  createdAt: string;
  updatedAt: string;
}

// Workflow types
export type WorkflowStepType = 'agent' | 'tool' | 'condition' | 'loop' | 'foreach' | 'transform';

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  name: string;
  config: {
    agentId?: string;
    toolId?: string;
    prompt?: string;
    condition?: string;
    loopCount?: number;
    inputMapping?: Record<string, string>;
    outputMapping?: Record<string, string>;
    // Foreach step
    iterableVar?: string;
    nestedSteps?: WorkflowStep[];
    // Transform step
    inputVar?: string;
    transform?: string;
  };
  nextStepId?: string;
  onErrorStepId?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  variables: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// App State
export interface AppState {
  // Auth
  isAuthenticated: boolean;
  
  // UI
  currentService: ServiceType;
  language: Language;
  sidebarOpen: boolean;
  
  // API Keys
  apiKeys: APIKeysConfig;
  
  // Data
  projects: Project[];
  conversations: Conversation[];
  agents: Agent[];
  tools: Tool[];
  workflows: Workflow[];
  notes: Note[];
  
  // Actions
  setAuthenticated: (value: boolean) => void;
  setCurrentService: (service: ServiceType) => void;
  setLanguage: (lang: Language) => void;
  setSidebarOpen: (open: boolean) => void;
  setApiKeys: (keys: APIKeysConfig) => void;
  
  // Project actions
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Conversation actions
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, conversation: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  
  // Agent actions
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, agent: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  addAgentMemory: (agentId: string, memory: AgentMemory) => void;
  clearAgentMemory: (agentId: string) => void;
  
  // Tool actions
  addTool: (tool: Tool) => void;
  updateTool: (id: string, tool: Partial<Tool>) => void;
  deleteTool: (id: string) => void;
  
  // Workflow actions
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (id: string, workflow: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  
  // Note actions
  addNote: (note: Note) => void;
  updateNote: (id: string, note: Partial<Note>) => void;
  deleteNote: (id: string) => void;
}
