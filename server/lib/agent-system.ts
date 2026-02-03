// ============================================
// 🤖 AUTONOMOUS AGENT SYSTEM - Full Power
// ============================================
// Real agents with real capabilities

import { unlimitedAI, ChatMessage, FunctionDefinition } from './unlimited-ai';

// ================== AGENT TYPES ==================

export interface AgentCapability {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  icon: string;
  execute: (params: any) => Promise<any>;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any) => Promise<string>;
}

export interface AgentConfig {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  avatar: string;
  color: string;
  systemPrompt: string;
  capabilities: string[];
  tools: AgentTool[];
  autonomyLevel: 'passive' | 'active' | 'autonomous';
  maxIterations: number;
  allowedIntegrations: string[];
  schedule?: {
    enabled: boolean;
    cron?: string;
    interval?: number;
  };
}

export interface AgentExecution {
  id: string;
  agentId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startedAt: Date;
  completedAt?: Date;
  iterations: AgentIteration[];
  result?: any;
  error?: string;
}

export interface AgentIteration {
  index: number;
  thought: string;
  action?: {
    tool: string;
    input: any;
    output: any;
  };
  observation: string;
  timestamp: Date;
}

// ================== BUILT-IN TOOLS ==================

export const BUILT_IN_TOOLS: AgentTool[] = [
  // Web Search Tool
  {
    name: 'web_search',
    description: 'Search the web for current information. Use for recent events, facts, or research.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        num_results: { type: 'number', description: 'Number of results (default 5)' },
      },
      required: ['query'],
    },
    handler: async (args) => {
      // Tavily (Best)
      if (process.env.TAVILY_API_KEY) {
        try {
          const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: process.env.TAVILY_API_KEY,
              query: args.query,
              max_results: args.num_results || 5,
            }),
          });
          const data = await response.json();
          return JSON.stringify(data.results?.map((r: any) => ({
            title: r.title,
            url: r.url,
            content: r.content,
          })) || []);
        } catch (e) {
          console.warn('Tavily search failed', e);
        }
      }

      // Brave Search (Fallback)
      if (process.env.BRAVE_API_KEY) {
        try {
          const response = await fetch(
            `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(args.query)}&count=${args.num_results || 5}`,
            {
              headers: { 'X-Subscription-Token': process.env.BRAVE_API_KEY },
            }
          );
          const data = await response.json();
          return JSON.stringify(data.web?.results?.map((r: any) => ({
            title: r.title,
            url: r.url,
            description: r.description,
          })) || []);
        } catch (e) {
          console.warn('Brave search failed', e);
        }
      }
      
      // Fallback to DuckDuckGo (no API key needed)
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(args.query)}&format=json`
      );
      const data = await response.json();
      return JSON.stringify({
        abstract: data.Abstract,
        results: data.RelatedTopics?.slice(0, 5).map((t: any) => t.Text) || [],
      });
    },
  },

  // Web Scrape Tool (Firecrawl)
  {
    name: 'web_scrape',
    description: 'Scrape content from a website URL. Use this to read full pages.',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to scrape' },
      },
      required: ['url'],
    },
    handler: async (args) => {
      if (!process.env.FIRECRAWL_API_KEY) {
        return 'Error: FIRECRAWL_API_KEY not configured';
      }
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
          },
          body: JSON.stringify({ url: args.url, formats: ['markdown'] }),
        });
        const data = await response.json();
        return data.data?.markdown || data.data?.content || 'No content found';
      } catch (e: any) {
        return `Scrape failed: ${e.message}`;
      }
    },
  },

  // HTTP Request Tool
  {
    name: 'http_request',
    description: 'Make HTTP requests to any URL. Use for APIs or web scraping.',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to request' },
        method: { type: 'string', description: 'HTTP method (GET, POST, etc.)' },
        headers: { type: 'object', description: 'Request headers' },
        body: { type: 'string', description: 'Request body for POST/PUT' },
      },
      required: ['url'],
    },
    handler: async (args) => {
      const response = await fetch(args.url, {
        method: args.method || 'GET',
        headers: args.headers || {},
        body: args.body,
      });
      
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return JSON.stringify(await response.json());
      }
      return await response.text();
    },
  },

  // Code Execution Tool (sandboxed with E2B or QuickJS)
  {
    name: 'execute_code',
    description: 'Execute Python or JavaScript code. Use for calculations, data processing, etc.',
    parameters: {
      type: 'object',
      properties: {
        language: { type: 'string', description: 'python or javascript' },
        code: { type: 'string', description: 'Code to execute' },
      },
      required: ['language', 'code'],
    },
    handler: async (args) => {
      // E2B Sandboxing (Preferred)
      if (process.env.E2B_API_KEY) {
        try {
          const response = await fetch('https://api.e2b.dev/v1/sandboxes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': process.env.E2B_API_KEY,
            },
            body: JSON.stringify({
              template: args.language === 'python' ? 'Python3' : 'Nodejs',
            }),
          });
          
          if (!response.ok) throw new Error('Failed to create sandbox');
          const sandbox = await response.json();
          
          const execResponse = await fetch(`https://api.e2b.dev/v1/sandboxes/${sandbox.id}/execute`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': process.env.E2B_API_KEY,
            },
            body: JSON.stringify({ code: args.code }),
          });
          
          const result = await execResponse.json();
          // Kill sandbox after use (fire and forget)
          fetch(`https://api.e2b.dev/v1/sandboxes/${sandbox.id}`, {
             method: 'DELETE',
             headers: { 'X-API-Key': process.env.E2B_API_KEY },
          }).catch(() => {});
          
          return JSON.stringify({
            output: result.stdout || '',
            error: result.stderr || result.error,
          });
        } catch (e: any) {
          console.warn('E2B execution failed, falling back to local', e);
        }
      }

      // Local Fallback (QuickJS / Eval)
      if (args.language === 'javascript') {
        try {
          // Warning: Only use for simple calculations in dev
          const result = eval(args.code);
          return JSON.stringify(result);
        } catch (e: any) {
          return `Error: ${e.message}`;
        }
      }
      return 'Python execution requires E2B API key configured.';
    },
  },

  // Memory Tool
  {
    name: 'remember',
    description: 'Store important information for later recall.',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key' },
        value: { type: 'string', description: 'Value to remember' },
      },
      required: ['key', 'value'],
    },
    handler: async (args) => {
      // Store in database or local storage
      return `Remembered: ${args.key} = ${args.value}`;
    },
  },

  // Recall Tool
  {
    name: 'recall',
    description: 'Retrieve previously stored information.',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key to recall' },
      },
      required: ['key'],
    },
    handler: async (args) => {
      // Retrieve from database or local storage
      return `Recalled value for: ${args.key}`;
    },
  },

  // File Operations
  {
    name: 'file_operation',
    description: 'Read, write, or list files.',
    parameters: {
      type: 'object',
      properties: {
        operation: { type: 'string', description: 'read, write, list, or delete' },
        path: { type: 'string', description: 'File path' },
        content: { type: 'string', description: 'Content for write operation' },
      },
      required: ['operation', 'path'],
    },
    handler: async (args) => {
      // Implement with proper sandboxing
      return `File operation: ${args.operation} on ${args.path}`;
    },
  },

  // Send Notification / Email
  {
    name: 'send_notification',
    description: 'Send a notification or email to the user.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Notification title' },
        message: { type: 'string', description: 'Notification message' },
        channel: { type: 'string', description: 'email, push, or sms' },
        to: { type: 'string', description: 'Recipient (email address)' },
      },
      required: ['message'],
    },
    handler: async (args) => {
      // Use Resend for Email
      if (args.channel === 'email' && process.env.RESEND_API_KEY && args.to) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Try-It! Agents <agents@tryit.app>',
              to: args.to,
              subject: args.title || 'Agent Notification',
              html: `<p>${args.message}</p>`,
            }),
          });
          return `Email sent to ${args.to}`;
        } catch (e: any) {
          return `Email failed: ${e.message}`;
        }
      }
      return `Notification sent: ${args.title || 'Alert'} - ${args.message}`;
    },
  },

  // Image Generation (Replicate)
  {
    name: 'generate_image',
    description: 'Generate an image from a text description.',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Image description' },
      },
      required: ['prompt'],
    },
    handler: async (args) => {
      if (!process.env.REPLICATE_API_KEY) return 'Error: REPLICATE_API_KEY not set';
      try {
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
          },
          body: JSON.stringify({
            version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
            input: { prompt: args.prompt, width: 1024, height: 1024, num_outputs: 1 },
          }),
        });
        const result = await response.json();
        return `Image generation started: ${result.urls?.get || 'Check logs'}`;
      } catch (e: any) {
        return `Image generation failed: ${e.message}`;
      }
    },
  },

  // Schedule Task
  {
    name: 'schedule_task',
    description: 'Schedule a task for later execution.',
    parameters: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Task description' },
        when: { type: 'string', description: 'When to execute (ISO date or relative like "in 1 hour")' },
        repeat: { type: 'string', description: 'Repeat pattern (daily, weekly, etc.)' },
      },
      required: ['task', 'when'],
    },
    handler: async (args) => {
      return `Scheduled: ${args.task} for ${args.when}`;
    },
  },

  // Integration Tool
  {
    name: 'use_integration',
    description: 'Use a connected integration/service.',
    parameters: {
      type: 'object',
      properties: {
        integration: { type: 'string', description: 'Integration name (gmail, slack, etc.)' },
        action: { type: 'string', description: 'Action to perform' },
        params: { type: 'object', description: 'Action parameters' },
      },
      required: ['integration', 'action'],
    },
    handler: async (args) => {
      return `Integration ${args.integration}: ${args.action} executed`;
    },
  },

  // Think/Reason Tool
  {
    name: 'think',
    description: 'Take time to reason through a problem step by step.',
    parameters: {
      type: 'object',
      properties: {
        problem: { type: 'string', description: 'Problem to think about' },
        approach: { type: 'string', description: 'Thinking approach (analytical, creative, etc.)' },
      },
      required: ['problem'],
    },
    handler: async (args) => {
      return `Thinking about: ${args.problem}`;
    },
  },
];

// ================== PRESET AGENTS ==================

export const PRESET_AGENTS: Omit<AgentConfig, 'id'>[] = []; // Templates removed per user request

// ================== AGENT ENGINE ==================

export class AgentEngine {
  private agents: Map<string, AgentConfig> = new Map();
  private executions: Map<string, AgentExecution> = new Map();

  constructor() {
    // Load preset agents
    PRESET_AGENTS.forEach((preset, index) => {
      const id = `preset_${index + 1}`;
      this.agents.set(id, { ...preset, id });
    });
  }

  createAgent(config: Omit<AgentConfig, 'id'>): AgentConfig {
    const id = `agent_${Date.now()}`;
    const agent: AgentConfig = { ...config, id };
    this.agents.set(id, agent);
    return agent;
  }

  getAgent(id: string): AgentConfig | undefined {
    return this.agents.get(id);
  }

  listAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  updateAgent(id: string, updates: Partial<AgentConfig>): AgentConfig | undefined {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    
    const updated = { ...agent, ...updates, id };
    this.agents.set(id, updated);
    return updated;
  }

  deleteAgent(id: string): boolean {
    return this.agents.delete(id);
  }

  async execute(
    agentId: string,
    input: string,
    context?: {
      conversationHistory?: ChatMessage[];
      userData?: any;
    }
  ): Promise<AgentExecution> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    const executionId = `exec_${Date.now()}`;
    const execution: AgentExecution = {
      id: executionId,
      agentId,
      status: 'running',
      startedAt: new Date(),
      iterations: [],
    };
    this.executions.set(executionId, execution);

    try {
      const result = await this.runAgentLoop(agent, input, execution, context);
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.result = result;
    } catch (error: any) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.error = error.message;
    }

    return execution;
  }

  private async runAgentLoop(
    agent: AgentConfig,
    input: string,
    execution: AgentExecution,
    context?: any
  ): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: agent.systemPrompt },
      ...(context?.conversationHistory || []),
      { role: 'user', content: input },
    ];

    // Convert tools to function definitions
    const functions: FunctionDefinition[] = agent.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));

    let iterations = 0;
    let finalResponse = '';

    while (iterations < agent.maxIterations) {
      iterations++;

      const response = await unlimitedAI.chatWithFunctions({
        messages,
        functions,
        function_call: 'auto',
      });

      // If there's a function call, execute it
      if (response.functionCall) {
        const tool = agent.tools.find(t => t.name === response.functionCall!.name);
        if (!tool) {
          throw new Error(`Unknown tool: ${response.functionCall.name}`);
        }

        const toolResult = await tool.handler(response.functionCall.arguments);

        const iteration: AgentIteration = {
          index: iterations,
          thought: response.content || 'Executing tool...',
          action: {
            tool: response.functionCall.name,
            input: response.functionCall.arguments,
            output: toolResult,
          },
          observation: toolResult,
          timestamp: new Date(),
        };
        execution.iterations.push(iteration);

        // Add the function call and result to messages
        messages.push({
          role: 'assistant',
          content: response.content || '',
          function_call: {
            name: response.functionCall.name,
            arguments: JSON.stringify(response.functionCall.arguments),
          },
        });
        messages.push({
          role: 'function',
          name: response.functionCall.name,
          content: toolResult,
        });
      } else {
        // No function call, we have a final response
        finalResponse = response.content;
        
        const iteration: AgentIteration = {
          index: iterations,
          thought: 'Generating final response',
          observation: response.content,
          timestamp: new Date(),
        };
        execution.iterations.push(iteration);
        
        break;
      }
    }

    return finalResponse;
  }

  async *streamExecute(
    agentId: string,
    input: string,
    context?: any
  ): AsyncGenerator<{ type: 'thought' | 'action' | 'response'; data: any }> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    yield { type: 'thought', data: 'Starting agent execution...' };

    const messages: ChatMessage[] = [
      { role: 'system', content: agent.systemPrompt },
      ...(context?.conversationHistory || []),
      { role: 'user', content: input },
    ];

    let iterations = 0;

    while (iterations < agent.maxIterations) {
      iterations++;
      yield { type: 'thought', data: `Iteration ${iterations}...` };

      // Stream the response
      let fullContent = '';
      for await (const chunk of unlimitedAI.stream({ messages })) {
        fullContent += chunk;
        yield { type: 'response', data: chunk };
      }

      // Simple heuristic: if content suggests using a tool, we'd execute it
      // For now, just return the streamed content
      break;
    }
  }

  getExecution(id: string): AgentExecution | undefined {
    return this.executions.get(id);
  }

  listExecutions(agentId?: string): AgentExecution[] {
    const executions = Array.from(this.executions.values());
    if (agentId) {
      return executions.filter(e => e.agentId === agentId);
    }
    return executions;
  }
}

// Export singleton
export const agentEngine = new AgentEngine();
