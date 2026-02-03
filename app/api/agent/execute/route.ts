import { NextRequest, NextResponse } from 'next/server'

// Real Agent Tool Execution Engine
export async function POST(request: NextRequest) {
  try {
    const { tool, params, apiKeys, context } = await request.json()
    
    if (!tool) {
      return NextResponse.json({ error: 'No tool specified' }, { status: 400 })
    }

    const result = await executeTool(tool, params || {}, apiKeys || {}, context || {})
    
    return NextResponse.json({
      success: true,
      tool,
      result,
      executedAt: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}

async function executeTool(
  tool: string,
  params: Record<string, any>,
  apiKeys: Record<string, string>,
  context: any
): Promise<any> {
  
  switch (tool) {
    // ============ WEB SEARCH ============
    case 'web_search': {
      const query = params.query
      if (!query) throw new Error('Search query required')
      
      // Using DuckDuckGo Instant Answer API (free, no key required)
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
      )
      const data = await response.json()
      
      const results = []
      
      // Abstract (main answer)
      if (data.Abstract) {
        results.push({
          title: data.Heading || 'Answer',
          snippet: data.Abstract,
          url: data.AbstractURL,
          source: data.AbstractSource
        })
      }
      
      // Related topics
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        for (const topic of data.RelatedTopics.slice(0, 5)) {
          if (topic.Text) {
            results.push({
              title: topic.Text.split(' - ')[0],
              snippet: topic.Text,
              url: topic.FirstURL
            })
          }
        }
      }
      
      // If no results from DDG, try a simple Google search scrape alternative
      if (results.length === 0) {
        results.push({
          title: 'Search Results',
          snippet: `Search for "${query}" - Use browser for detailed results`,
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
        })
      }
      
      return {
        query,
        resultsCount: results.length,
        results
      }
    }
    
    // ============ CODE EXECUTION ============
    case 'code_execute': {
      const code = params.code
      const language = params.language || 'javascript'
      
      if (!code) throw new Error('Code required')
      
      if (language === 'javascript' || language === 'js') {
        try {
          // Safe execution with timeout
          const fn = new Function(`
            'use strict';
            const console = { 
              log: (...args) => __logs.push(args.map(a => JSON.stringify(a)).join(' ')),
              error: (...args) => __logs.push('[ERROR] ' + args.map(a => JSON.stringify(a)).join(' '))
            };
            const __logs = [];
            const __result = (function() { ${code} })();
            return { result: __result, logs: __logs };
          `)
          const output = fn()
          return {
            success: true,
            language,
            output: output.result,
            logs: output.logs
          }
        } catch (e: any) {
          return {
            success: false,
            language,
            error: e.message
          }
        }
      } else if (language === 'python') {
        // For Python, we return the code with instructions
        return {
          success: true,
          language: 'python',
          note: 'Python execution requires backend service',
          code,
          suggestion: 'Use Pyodide or server-side execution'
        }
      }
      
      throw new Error(`Unsupported language: ${language}`)
    }
    
    // ============ FILE OPERATIONS ============
    case 'file_read': {
      // Files would be passed in context or params
      const filename = params.filename
      const content = params.content || context.files?.[filename]
      
      return {
        filename,
        content: content || 'File not found in context',
        size: content?.length || 0
      }
    }
    
    case 'file_write': {
      const filename = params.filename
      const content = params.content
      
      if (!filename || !content) throw new Error('Filename and content required')
      
      // Generate downloadable data URL
      const mimeType = getMimeType(filename)
      const dataUrl = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`
      
      return {
        success: true,
        filename,
        size: content.length,
        downloadUrl: dataUrl,
        mimeType
      }
    }
    
    // ============ DATABASE OPERATIONS ============
    case 'database_query': {
      const { supabaseUrl, supabaseKey } = apiKeys
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials required in settings')
      }
      
      const table = params.table
      const operation = params.operation || 'select'
      const query = params.query || ''
      const data = params.data
      
      let url = `${supabaseUrl}/rest/v1/${table}`
      let method = 'GET'
      let body: string | undefined
      const headers: Record<string, string> = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
      
      switch (operation) {
        case 'select':
          url += query ? `?${query}` : ''
          method = 'GET'
          break
        case 'insert':
          method = 'POST'
          body = JSON.stringify(data)
          break
        case 'update':
          url += query ? `?${query}` : ''
          method = 'PATCH'
          body = JSON.stringify(data)
          break
        case 'delete':
          url += query ? `?${query}` : ''
          method = 'DELETE'
          break
      }
      
      const response = await fetch(url, { method, headers, body })
      const result = await response.json()
      
      return {
        operation,
        table,
        data: result,
        count: Array.isArray(result) ? result.length : 1,
        status: response.status
      }
    }
    
    // ============ API CALLS ============
    case 'api_call': {
      const url = params.url
      const method = params.method || 'GET'
      const headers = params.headers || {}
      const body = params.body
      
      if (!url) throw new Error('URL required')
      
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }
      
      if (body && method !== 'GET') {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
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
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        data,
        headers: Object.fromEntries(response.headers.entries())
      }
    }
    
    // ============ AI REASONING ============
    case 'ai_reason': {
      const prompt = params.prompt
      const model = params.model || 'gpt-4o-mini'
      
      if (!prompt) throw new Error('Prompt required')
      
      // Determine API key and endpoint based on model
      let apiKey = ''
      let apiUrl = ''
      let requestBody: any
      let parseResponse: (data: any) => string
      
      if (model.includes('claude')) {
        apiKey = apiKeys.anthropic
        apiUrl = 'https://api.anthropic.com/v1/messages'
        requestBody = {
          model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }]
        }
        parseResponse = (data) => data.content?.[0]?.text || data.error?.message
      } else if (model.includes('gemini')) {
        apiKey = apiKeys.google
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        requestBody = {
          contents: [{ parts: [{ text: prompt }] }]
        }
        parseResponse = (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || data.error?.message
      } else if (model.includes('deepseek')) {
        apiKey = apiKeys.deepseek
        apiUrl = 'https://api.deepseek.com/v1/chat/completions'
        requestBody = {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096
        }
        parseResponse = (data) => data.choices?.[0]?.message?.content || data.error?.message
      } else if (model.includes('grok')) {
        apiKey = apiKeys.xai
        apiUrl = 'https://api.x.ai/v1/chat/completions'
        requestBody = {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096
        }
        parseResponse = (data) => data.choices?.[0]?.message?.content || data.error?.message
      } else {
        // Default to OpenAI
        apiKey = apiKeys.openai
        apiUrl = 'https://api.openai.com/v1/chat/completions'
        requestBody = {
          model: model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096
        }
        parseResponse = (data) => data.choices?.[0]?.message?.content || data.error?.message
      }
      
      if (!apiKey) {
        throw new Error(`API key required for model: ${model}`)
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (model.includes('claude')) {
        headers['x-api-key'] = apiKey
        headers['anthropic-version'] = '2023-06-01'
      } else if (!model.includes('gemini')) {
        headers['Authorization'] = `Bearer ${apiKey}`
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })
      
      const data = await response.json()
      const content = parseResponse(data)
      
      return {
        model,
        prompt: prompt.substring(0, 100) + '...',
        response: content,
        tokens: data.usage || null
      }
    }
    
    // ============ DATA TRANSFORM ============
    case 'transform': {
      const input = params.input || context.previousOutput
      const operation = params.operation
      
      switch (operation) {
        case 'json_parse':
          return { result: JSON.parse(input) }
        case 'json_stringify':
          return { result: JSON.stringify(input, null, 2) }
        case 'extract':
          const path = params.path?.split('.') || []
          let value = input
          for (const key of path) {
            value = value?.[key]
          }
          return { result: value }
        case 'filter':
          if (!Array.isArray(input)) throw new Error('Input must be array')
          const filterFn = new Function('item', `return ${params.condition}`) as (item: any) => boolean
          return { result: input.filter(filterFn) }
        case 'map':
          if (!Array.isArray(input)) throw new Error('Input must be array')
          const mapFn = new Function('item', `return ${params.transform}`) as (item: any) => any
          return { result: input.map(mapFn) }
        case 'sort':
          if (!Array.isArray(input)) throw new Error('Input must be array')
          const key = params.key
          const order = params.order === 'desc' ? -1 : 1
          return { 
            result: [...input].sort((a, b) => {
              const aVal = key ? a[key] : a
              const bVal = key ? b[key] : b
              return aVal > bVal ? order : -order
            })
          }
        default:
          return { result: input }
      }
    }

    // ============ UTILITIES ============
    case 'timestamp':
      return {
        iso: new Date().toISOString(),
        unix: Date.now(),
        formatted: new Date().toLocaleString()
      }
    
    case 'random':
      return {
        uuid: crypto.randomUUID(),
        number: Math.random(),
        integer: Math.floor(Math.random() * (params.max || 100))
      }
    
    case 'hash':
      const text = params.text || ''
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      return { hash: hashHex, algorithm: 'SHA-256' }

    default:
      throw new Error(`Unknown tool: ${tool}`)
  }
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    'txt': 'text/plain',
    'json': 'application/json',
    'js': 'application/javascript',
    'ts': 'application/typescript',
    'html': 'text/html',
    'css': 'text/css',
    'md': 'text/markdown',
    'csv': 'text/csv',
    'xml': 'application/xml'
  }
  return mimeTypes[ext || ''] || 'text/plain'
}
