// ============================================
// 3. ADVANCED WORKFLOW ENGINE
// ============================================

export interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'loop' | 'parallel' | 'delay' | 'ai' | 'http' | 'transform'
  name: string
  config: Record<string, any>
  inputs: string[]  // IDs of nodes that feed into this
  outputs: string[] // IDs of nodes this feeds into
  position: { x: number; y: number }
}

export interface Workflow {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  variables: Record<string, any>
  isActive: boolean
  schedule?: string // Cron expression
  createdAt: string
  updatedAt: string
}

export interface ExecutionContext {
  workflowId: string
  executionId: string
  variables: Record<string, any>
  nodeResults: Map<string, any>
  logs: Array<{ timestamp: Date; nodeId: string; message: string; level: 'info' | 'warn' | 'error' }>
  status: 'running' | 'completed' | 'failed' | 'paused'
  startTime: Date
  endTime?: Date
}

// Node Executors
const nodeExecutors: Record<string, (node: WorkflowNode, ctx: ExecutionContext) => Promise<any>> = {
  // Trigger node - starts the workflow
  trigger: async (node, ctx) => {
    ctx.logs.push({ timestamp: new Date(), nodeId: node.id, message: 'Workflow triggered', level: 'info' })
    return node.config.initialData || {}
  },

  // AI Processing node
  ai: async (node, ctx) => {
    const { provider, apiKey, prompt, model } = node.config
    const resolvedPrompt = resolveTemplate(prompt, ctx.variables)
    
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, prompt: resolvedPrompt, model })
    })
    
    const data = await response.json()
    ctx.logs.push({ timestamp: new Date(), nodeId: node.id, message: `AI response received`, level: 'info' })
    return data.result
  },

  // HTTP Request node
  http: async (node, ctx) => {
    const { url, method, headers, body } = node.config
    const resolvedUrl = resolveTemplate(url, ctx.variables)
    const resolvedBody = body ? JSON.parse(resolveTemplate(JSON.stringify(body), ctx.variables)) : undefined

    const response = await fetch(resolvedUrl, {
      method: method || 'GET',
      headers: headers || {},
      body: resolvedBody ? JSON.stringify(resolvedBody) : undefined
    })

    const data = await response.json()
    ctx.logs.push({ timestamp: new Date(), nodeId: node.id, message: `HTTP ${method} ${resolvedUrl} - ${response.status}`, level: 'info' })
    return data
  },

  // Condition node - branching
  condition: async (node, ctx) => {
    const { expression, trueOutput, falseOutput } = node.config
    const result = evaluateExpression(expression, ctx.variables)
    ctx.logs.push({ timestamp: new Date(), nodeId: node.id, message: `Condition evaluated: ${result}`, level: 'info' })
    return { result, nextNodeId: result ? trueOutput : falseOutput }
  },

  // Loop node - iterate over arrays
  loop: async (node, ctx) => {
    const { arrayPath, itemVariable, bodyNodes } = node.config
    const array = getValueByPath(ctx.variables, arrayPath) || []
    const results = []

    for (let i = 0; i < array.length; i++) {
      ctx.variables[itemVariable] = array[i]
      ctx.variables[`${itemVariable}_index`] = i
      
      // Execute body nodes for each iteration
      for (const bodyNodeId of bodyNodes) {
        const bodyNode = ctx.nodeResults.get('__workflow__')?.nodes.find((n: WorkflowNode) => n.id === bodyNodeId)
        if (bodyNode) {
          const result = await nodeExecutors[bodyNode.type]?.(bodyNode, ctx)
          results.push(result)
        }
      }
    }
    
    ctx.logs.push({ timestamp: new Date(), nodeId: node.id, message: `Loop completed: ${array.length} iterations`, level: 'info' })
    return results
  },

  // Parallel execution node
  parallel: async (node, ctx) => {
    const { parallelNodes } = node.config
    const workflow = ctx.nodeResults.get('__workflow__')
    
    const promises = parallelNodes.map(async (nodeId: string) => {
      const parallelNode = workflow?.nodes.find((n: WorkflowNode) => n.id === nodeId)
      if (parallelNode) {
        return nodeExecutors[parallelNode.type]?.(parallelNode, ctx)
      }
    })

    const results = await Promise.all(promises)
    ctx.logs.push({ timestamp: new Date(), nodeId: node.id, message: `Parallel execution completed: ${parallelNodes.length} branches`, level: 'info' })
    return results
  },

  // Delay node
  delay: async (node, ctx) => {
    const { duration } = node.config // in milliseconds
    ctx.logs.push({ timestamp: new Date(), nodeId: node.id, message: `Waiting ${duration}ms`, level: 'info' })
    await new Promise(resolve => setTimeout(resolve, duration))
    return { waited: duration }
  },

  // Data transformation node
  transform: async (node, ctx) => {
    const { transformFn, inputPath, outputVariable } = node.config
    const input = getValueByPath(ctx.variables, inputPath)
    
    // Safe evaluation of transform function
    const fn = new Function('data', 'ctx', transformFn)
    const result = fn(input, ctx.variables)
    
    if (outputVariable) {
      ctx.variables[outputVariable] = result
    }
    
    ctx.logs.push({ timestamp: new Date(), nodeId: node.id, message: `Transform completed`, level: 'info' })
    return result
  },

  // Action node - generic action execution
  action: async (node, ctx) => {
    const { actionType, params } = node.config
    ctx.logs.push({ timestamp: new Date(), nodeId: node.id, message: `Executing action: ${actionType}`, level: 'info' })
    
    // Execute action based on type
    switch (actionType) {
      case 'setVariable':
        ctx.variables[params.name] = resolveTemplate(params.value, ctx.variables)
        break
      case 'sendEmail':
        // Integrate with email service
        break
      case 'saveToDb':
        // Save to database
        break
    }
    
    return { actionType, success: true }
  }
}

// Workflow Engine
export class WorkflowEngine {
  private workflow: Workflow
  private context: ExecutionContext

  constructor(workflow: Workflow) {
    this.workflow = workflow
    this.context = {
      workflowId: workflow.id,
      executionId: crypto.randomUUID(),
      variables: { ...workflow.variables },
      nodeResults: new Map(),
      logs: [],
      status: 'running',
      startTime: new Date()
    }
    this.context.nodeResults.set('__workflow__', workflow)
  }

  async execute(): Promise<ExecutionContext> {
    try {
      // Find trigger node
      const triggerNode = this.workflow.nodes.find(n => n.type === 'trigger')
      if (!triggerNode) throw new Error('No trigger node found')

      // Execute workflow starting from trigger
      await this.executeNode(triggerNode)

      this.context.status = 'completed'
    } catch (error) {
      this.context.status = 'failed'
      this.context.logs.push({
        timestamp: new Date(),
        nodeId: 'engine',
        message: `Workflow failed: ${(error as Error).message}`,
        level: 'error'
      })
    }

    this.context.endTime = new Date()
    return this.context
  }

  private async executeNode(node: WorkflowNode): Promise<void> {
    const executor = nodeExecutors[node.type]
    if (!executor) throw new Error(`Unknown node type: ${node.type}`)

    const result = await executor(node, this.context)
    this.context.nodeResults.set(node.id, result)
    this.context.variables[`node_${node.id}_result`] = result

    // Handle condition branching
    if (node.type === 'condition' && result.nextNodeId) {
      const nextNode = this.workflow.nodes.find(n => n.id === result.nextNodeId)
      if (nextNode) await this.executeNode(nextNode)
      return
    }

    // Execute output nodes
    for (const outputId of node.outputs) {
      const outputNode = this.workflow.nodes.find(n => n.id === outputId)
      if (outputNode) await this.executeNode(outputNode)
    }
  }
}

// Helper functions
function resolveTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '')
}

function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

function evaluateExpression(expression: string, variables: Record<string, any>): boolean {
  const fn = new Function(...Object.keys(variables), `return ${expression}`)
  return fn(...Object.values(variables))
}

export default WorkflowEngine
