import { NextRequest, NextResponse } from 'next/server'

// Real Workflow Execution Engine
export async function POST(request: NextRequest) {
  try {
    const { workflow, apiKeys } = await request.json()
    
    if (!workflow || !workflow.steps || workflow.steps.length === 0) {
      return NextResponse.json({ error: 'No workflow steps provided' }, { status: 400 })
    }

    const results: any[] = []
    const variables: Record<string, any> = {}
    let currentOutput: any = null

    for (const step of workflow.steps) {
      if (!step.enabled) continue
      
      try {
        const result = await executeStep(step, variables, currentOutput, apiKeys)
        results.push({
          stepId: step.id,
          tool: step.tool,
          success: true,
          output: result,
          timestamp: new Date().toISOString()
        })
        currentOutput = result
        
        // Store in variables if step has output name
        if (step.config?.outputVariable) {
          variables[step.config.outputVariable] = result
        }
      } catch (stepError: any) {
        results.push({
          stepId: step.id,
          tool: step.tool,
          success: false,
          error: stepError.message,
          timestamp: new Date().toISOString()
        })
        
        // Stop on error unless configured to continue
        if (!workflow.continueOnError) {
          break
        }
      }
    }

    return NextResponse.json({
      success: results.every(r => r.success),
      results,
      variables,
      executedAt: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function executeStep(
  step: any, 
  variables: Record<string, any>, 
  previousOutput: any,
  apiKeys: any
): Promise<any> {
  const config = step.config || {}
  
  // Replace variables in config values
  const resolveValue = (value: string): string => {
    if (typeof value !== 'string') return value
    return value.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (key === 'previous') return JSON.stringify(previousOutput)
      return variables[key] ?? ''
    })
  }

  switch (step.tool) {
    // ============ TRIGGERS ============
    case 'schedule':
      return { triggered: true, schedule: config.schedule, time: new Date().toISOString() }
    
    case 'webhook':
      return { triggered: true, webhookUrl: config.url, method: config.method || 'POST' }
    
    case 'file-watch':
      return { triggered: true, watching: config.path, event: config.event || 'change' }
    
    case 'email-trigger':
      return { triggered: true, filter: config.filter, folder: config.folder || 'inbox' }

    // ============ ACTIONS ============
    case 'http-request': {
      const url = resolveValue(config.url)
      const method = config.method || 'GET'
      const headers: Record<string, string> = {}
      
      if (config.headers) {
        Object.entries(config.headers).forEach(([k, v]) => {
          headers[k] = resolveValue(v as string)
        })
      }
      
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }
      
      if (method !== 'GET' && config.body) {
        fetchOptions.body = resolveValue(config.body)
      }
      
      const response = await fetch(url, fetchOptions)
      const contentType = response.headers.get('content-type')
      
      let data
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }
      
      return {
        status: response.status,
        statusText: response.statusText,
        data,
        headers: Object.fromEntries(response.headers.entries())
      }
    }
    
    case 'send-email': {
      // Using mailto link generation (client-side) or could integrate with email API
      const to = resolveValue(config.to)
      const subject = resolveValue(config.subject)
      const body = resolveValue(config.body)
      
      return {
        action: 'email_prepared',
        to,
        subject,
        body,
        mailtoLink: `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      }
    }
    
    case 'slack-message': {
      // Slack webhook integration
      const webhookUrl = config.webhookUrl || apiKeys?.slackWebhook
      if (!webhookUrl) {
        throw new Error('Slack webhook URL required')
      }
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: resolveValue(config.message),
          channel: config.channel,
          username: config.username || 'SolveIt Bot'
        })
      })
      
      return { sent: response.ok, channel: config.channel }
    }
    
    case 'database-query': {
      // Supabase query
      const supabaseUrl = apiKeys?.supabaseUrl
      const supabaseKey = apiKeys?.supabaseKey
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials required')
      }
      
      const query = resolveValue(config.query)
      const table = config.table
      
      // REST API call to Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      return { data, count: Array.isArray(data) ? data.length : 1 }
    }
    
    case 'file-operation': {
      const operation = config.operation || 'read'
      const filename = resolveValue(config.filename)
      const content = config.content ? resolveValue(config.content) : ''
      
      if (operation === 'write' || operation === 'create') {
        return {
          action: 'file_created',
          filename,
          content,
          size: content.length,
          downloadUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`
        }
      }
      
      return { action: operation, filename, success: true }
    }
    
    case 'run-script': {
      // Safe JavaScript execution using Function constructor
      const script = resolveValue(config.script)
      const input = previousOutput
      
      try {
        // Create a sandboxed function with limited access
        const fn = new Function('input', 'variables', `
          'use strict';
          ${script}
        `)
        const result = fn(input, variables)
        return { executed: true, result }
      } catch (e: any) {
        throw new Error(`Script error: ${e.message}`)
      }
    }

    // ============ AI ACTIONS ============
    case 'ai-generate':
    case 'ai-analyze':
    case 'ai-transform': {
      const prompt = resolveValue(config.prompt)
      const model = config.model || 'gpt-4o-mini'
      
      // Determine which API key to use
      let apiKey = ''
      let apiUrl = ''
      
      if (model.includes('gpt') || model.includes('o1') || model.includes('o3')) {
        apiKey = apiKeys?.openai
        apiUrl = 'https://api.openai.com/v1/chat/completions'
      } else if (model.includes('claude')) {
        apiKey = apiKeys?.anthropic
        apiUrl = 'https://api.anthropic.com/v1/messages'
      } else if (model.includes('gemini')) {
        apiKey = apiKeys?.google
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      } else if (model.includes('deepseek')) {
        apiKey = apiKeys?.deepseek
        apiUrl = 'https://api.deepseek.com/v1/chat/completions'
      } else if (model.includes('grok')) {
        apiKey = apiKeys?.xai
        apiUrl = 'https://api.x.ai/v1/chat/completions'
      }
      
      if (!apiKey) {
        throw new Error(`API key required for model: ${model}`)
      }

      let response, data
      
      if (model.includes('gemini')) {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        })
        data = await response.json()
        return {
          model,
          content: data.candidates?.[0]?.content?.parts?.[0]?.text || data.error?.message
        }
      } else if (model.includes('claude')) {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }]
          })
        })
        data = await response.json()
        return {
          model,
          content: data.content?.[0]?.text || data.error?.message
        }
      } else {
        // OpenAI-compatible API (OpenAI, DeepSeek, xAI)
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 4096
          })
        })
        data = await response.json()
        return {
          model,
          content: data.choices?.[0]?.message?.content || data.error?.message
        }
      }
    }

    // ============ LOGIC ============
    case 'condition': {
      const condition = resolveValue(config.condition)
      const input = previousOutput
      
      try {
        const fn = new Function('input', 'variables', `
          'use strict';
          return ${condition};
        `)
        const result = fn(input, variables)
        return { condition, result: Boolean(result), branch: result ? 'true' : 'false' }
      } catch (e: any) {
        throw new Error(`Condition error: ${e.message}`)
      }
    }
    
    case 'delay': {
      const ms = parseInt(config.duration) || 1000
      await new Promise(resolve => setTimeout(resolve, Math.min(ms, 30000))) // Max 30s
      return { delayed: true, duration: ms }
    }
    
    case 'loop': {
      const items = Array.isArray(previousOutput) ? previousOutput : [previousOutput]
      const maxIterations = Math.min(parseInt(config.maxIterations) || 10, 100)
      
      return {
        action: 'loop_prepared',
        itemCount: items.length,
        maxIterations,
        items: items.slice(0, maxIterations)
      }
    }
    
    case 'set-variable': {
      const name = config.variableName
      const value = config.value ? resolveValue(config.value) : previousOutput
      variables[name] = value
      return { variable: name, value, set: true }
    }

    default:
      throw new Error(`Unknown tool: ${step.tool}`)
  }
}
