// ============================================
// WORKFLOW EXECUTOR - Full Implementation
// ============================================

import { supabase } from './supabase'
import { chat } from './ai/providers'
import type { APIKeysConfig, ChatMessage } from './ai/types'
import type { Workflow, WorkflowStep, Agent, Tool } from './types'

interface WorkflowContext {
  variables: Record<string, any>
  stepResults: Record<string, any>
  logs: string[]
  startTime: number
}

export interface ExecutionResult {
  success: boolean
  result?: any
  error?: string
  context: WorkflowContext
  executionTime: number
  executionId?: string
}

export class WorkflowExecutor {
  private context: WorkflowContext
  private executionId?: string

  constructor(initialVariables: Record<string, any> = {}) {
    this.context = {
      variables: initialVariables,
      stepResults: {},
      logs: [],
      startTime: Date.now()
    }
  }

  /**
   * Execute a complete workflow
   */
  async execute(
    workflow: Workflow,
    agents: Agent[],
    tools: Tool[],
    apiKeys: APIKeysConfig,
    userId: string
  ): Promise<ExecutionResult> {
    try {
      // Log workflow start in database
      const dbExecution = await this.logToDatabase({
        workflowId: workflow.id,
        userId,
        status: 'running',
        variables: this.context.variables
      })
      this.executionId = dbExecution?.id

      this.log(`🚀 Starting workflow: ${workflow.name}`)

      // Execute all steps
      for (const step of workflow.steps) {
        try {
          this.log(`📍 Executing step: ${step.name}`)
          const result = await this.executeStep(step, agents, tools, apiKeys)
          this.context.stepResults[step.id] = result
          this.context.variables['lastResult'] = result
          this.log(`✅ Completed step: ${step.name}`)
        } catch (error: any) {
          this.log(`❌ Step failed: ${step.name} - ${error.message}`)

          // Handle error step if defined
          if (step.onErrorStepId) {
            const errorStep = workflow.steps.find(s => s.id === step.onErrorStepId)
            if (errorStep) {
              this.log(`🔄 Executing error handler: ${errorStep.name}`)
              try {
                const errorResult = await this.executeStep(errorStep, agents, tools, apiKeys)
                this.context.stepResults[errorStep.id] = errorResult
              } catch (errorHandlerError: any) {
                this.log(`❌ Error handler failed: ${errorHandlerError.message}`)
                throw new Error(`Step and error handler both failed: ${error.message}`)
              }
            }
          } else {
            throw error
          }
        }
      }

      this.log(`🎉 Workflow completed successfully!`)

      // Update database with success
      if (this.executionId) {
        await this.updateDatabase(this.executionId, {
          status: 'completed',
          variables: this.context.variables,
          logs: this.context.logs
        })
      }

      return {
        success: true,
        result: this.context.variables['lastResult'],
        context: this.context,
        executionTime: Date.now() - this.context.startTime,
        executionId: this.executionId
      }
    } catch (error: any) {
      this.log(`💥 Workflow error: ${error.message}`)

      // Update database with failure
      if (this.executionId) {
        await this.updateDatabase(this.executionId, {
          status: 'failed',
          variables: this.context.variables,
          logs: this.context.logs,
          error: error.message
        })
      }

      return {
        success: false,
        error: error.message,
        context: this.context,
        executionTime: Date.now() - this.context.startTime,
        executionId: this.executionId
      }
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    agents: Agent[],
    tools: Tool[],
    apiKeys: APIKeysConfig
  ): Promise<any> {
    switch (step.type) {
      case 'agent':
        return this.executeAgentStep(step, agents, apiKeys)
      case 'tool':
        return this.executeToolStep(step, tools)
      case 'condition':
        return this.executeConditionStep(step)
      case 'loop':
        return this.executeLoopStep(step, agents, tools, apiKeys)
      case 'transform':
        return this.executeTransformStep(step)
      default:
        throw new Error(`Unsupported step type: ${step.type}`)
    }
  }

  /**
   * Execute agent-based step
   */
  private async executeAgentStep(
    step: WorkflowStep,
    agents: Agent[],
    apiKeys: APIKeysConfig
  ): Promise<any> {
    const agent = agents.find(a => a.id === step.config.agentId)
    if (!agent) {
      throw new Error(`Agent not found: ${step.config.agentId}`)
    }

    // Substitute variables in prompt
    let prompt = step.config.prompt || ''
    prompt = this.substituteVariables(prompt)

    const messages: ChatMessage[] = [
      ...agent.memory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt }
    ]

    const response = await chat(messages, apiKeys, {
      systemPrompt: agent.systemPrompt,
      forceProvider: agent.preferredProvider as any
    })

    return response.content
  }

  /**
   * Execute tool-based step
   */
  private async executeToolStep(step: WorkflowStep, tools: Tool[]): Promise<any> {
    const tool = tools.find(t => t.id === step.config.toolId)
    if (!tool) {
      throw new Error(`Tool not found: ${step.config.toolId}`)
    }

    // Build parameters with variable substitution
    const parameters: Record<string, any> = {}
    if (step.config.inputMapping) {
      for (const [paramName, varName] of Object.entries(step.config.inputMapping)) {
        const value = varName.startsWith('{{') 
          ? this.context.variables[varName.slice(2, -2)]
          : varName
        parameters[paramName] = value
      }
    }

    // Call tool endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/tools/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: tool.id, parameters })
    })

    if (!response.ok) {
      throw new Error(`Tool execution failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result.result || result
  }

  /**
   * Execute conditional step
   */
  private async executeConditionStep(step: WorkflowStep): Promise<boolean> {
    const condition = step.config.condition || 'true'
    
    try {
      const evalContext = { ...this.context.variables, ...this.context.stepResults }
      const fn = new Function(...Object.keys(evalContext), `return ${condition}`)
      const result = fn(...Object.values(evalContext))
      
      if (result) {
        this.log(`✓ Condition true: ${condition}`)
      } else {
        this.log(`✗ Condition false: ${condition}`)
      }
      
      return result
    } catch (error) {
      throw new Error(`Condition evaluation failed: ${condition}`)
    }
  }

  /**
   * Execute loop step
   */
  private async executeLoopStep(
    step: WorkflowStep,
    agents: Agent[],
    tools: Tool[],
    apiKeys: APIKeysConfig
  ): Promise<any[]> {
    const items = this.context.variables[step.config.iterableVar] || []
    const results: any[] = []

    if (!Array.isArray(items)) {
      throw new Error(`Loop variable is not an array: ${step.config.iterableVar}`)
    }

    for (let i = 0; i < items.length; i++) {
      this.context.variables['loopIndex'] = i
      this.context.variables['loopItem'] = items[i]
      this.log(`🔄 Loop iteration ${i + 1}/${items.length}`)

      // Execute nested steps if defined
      if (step.config.nestedSteps) {
        for (const nestedStep of step.config.nestedSteps) {
          const result = await this.executeStep(nestedStep, agents, tools, apiKeys)
          results.push(result)
        }
      } else {
        results.push(items[i])
      }
    }

    return results
  }

  /**
   * Execute data transformation step
   */
  private async executeTransformStep(step: WorkflowStep): Promise<any> {
    const input = this.context.variables[step.config.inputVar]
    const transform = step.config.transform || 'input'

    try {
      const fn = new Function('input', `return ${transform}`)
      return fn(input)
    } catch (error) {
      throw new Error(`Transform failed: ${step.config.transform}`)
    }
  }

  /**
   * Substitute {{variable}} in text
   */
  private substituteVariables(text: string): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return String(this.context.variables[key] || `{{${key}}}`)
    })
  }

  /**
   * Log message to console and context
   */
  private log(message: string): void {
    console.log(`[Workflow] ${message}`)
    this.context.logs.push(message)
  }

  /**
   * Log to database
   */
  private async logToDatabase(data: any) {
    try {
      const { data: result, error } = await supabase
        .from('workflow_executions')
        .insert(data)
        .select()
        .single()

      if (error) {
        console.error('Database log error:', error)
        return null
      }
      return result
    } catch (error) {
      console.error('Failed to log to database:', error)
      return null
    }
  }

  /**
   * Update execution in database
   */
  private async updateDatabase(executionId: string, data: any) {
    try {
      const { error } = await supabase
        .from('workflow_executions')
        .update(data)
        .eq('id', executionId)

      if (error) {
        console.error('Database update error:', error)
      }
    } catch (error) {
      console.error('Failed to update database:', error)
    }
  }
}

export default WorkflowExecutor
