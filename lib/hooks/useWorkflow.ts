"use client"
// ============================================
// USEEFFECTS HOOK FOR WORKFLOWS
// ============================================

'use client'

import { useState, useCallback } from 'react'
import type { Workflow, Agent, Tool } from '@/lib/types'
import type { APIKeysConfig } from '@/lib/ai/types'

interface UseWorkflowState {
  loading: boolean
  error: string | null
  result: any
  logs: string[]
  executionId: string | null
  progress: number
}

export function useWorkflow() {
  const [state, setState] = useState<UseWorkflowState>({
    loading: false,
    error: null,
    result: null,
    logs: [],
    executionId: null,
    progress: 0
  })

  const execute = useCallback(
    async (
      workflow: Workflow,
      agents: Agent[],
      tools: Tool[],
      apiKeys: APIKeysConfig,
      userId: string,
      initialVariables?: Record<string, any>
    ) => {
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
        logs: [],
        result: null
      }))

      try {
        const response = await fetch('/api/workflows/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflow,
            agents,
            tools,
            apiKeys,
            initialVariables,
            userId
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Workflow execution failed')
        }

        const data = await response.json()

        setState(prev => ({
          ...prev,
          loading: false,
          result: data.result,
          logs: data.context?.logs || [],
          executionId: data.executionId,
          progress: 100
        }))

        return data
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to execute workflow'
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          logs: [...prev.logs, `❌ Error: ${errorMessage}`]
        }))
        throw error
      }
    },
    []
  )

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      result: null,
      logs: [],
      executionId: null,
      progress: 0
    })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}
