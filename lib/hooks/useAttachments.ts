"use client"
// ============================================
// USEATTACHMENTS HOOK FOR FILE MANAGEMENT
// ============================================

'use client'

import { useState, useCallback } from 'react'
import type { Attachment, AttachmentMetadata } from '@/lib/attachment-manager'

interface UseAttachmentsState {
  loading: boolean
  error: string | null
  attachments: Attachment[]
  total: number
  uploadProgress: Record<string, number>
}

export function useAttachments() {
  const [state, setState] = useState<UseAttachmentsState>({
    loading: false,
    error: null,
    attachments: [],
    total: 0,
    uploadProgress: {}
  })

  /**
   * Upload file(s)
   */
  const upload = useCallback(
    async (
      files: File | File[],
      userId: string,
      projectId?: string,
      metadata?: Partial<AttachmentMetadata>
    ) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const formData = new FormData()
        const fileArray = Array.isArray(files) ? files : [files]

        for (const file of fileArray) {
          formData.append('files', file)
        }

        formData.append('userId', userId)
        if (projectId) formData.append('projectId', projectId)
        if (metadata?.description) formData.append('description', metadata.description)
        if (metadata?.tags) formData.append('tags', JSON.stringify(metadata.tags))

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Upload failed')
        }

        const data = await response.json()
        const newAttachments = data.attachment ? [data.attachment] : data.attachments || []

        setState(prev => ({
          ...prev,
          loading: false,
          attachments: [...prev.attachments, ...newAttachments]
        }))

        return newAttachments
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Upload failed'
        }))
        throw error
      }
    },
    []
  )

  /**
   * List attachments
   */
  const list = useCallback(
    async (userId: string, projectId?: string, limit = 50, offset = 0) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const params = new URLSearchParams({
          userId,
          limit: String(limit),
          offset: String(offset)
        })

        if (projectId) params.append('projectId', projectId)

        const response = await fetch(`/api/upload?${params}`, { method: 'GET' })

        if (!response.ok) {
          throw new Error('Failed to list attachments')
        }

        const data = await response.json()

        setState(prev => ({
          ...prev,
          loading: false,
          attachments: data.items || [],
          total: data.total || 0
        }))

        return data
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }))
        throw error
      }
    },
    []
  )

  /**
   * Delete attachment
   */
  const delete_ = useCallback(async (attachmentId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(`/api/upload?id=${attachmentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete attachment')
      }

      setState(prev => ({
        ...prev,
        loading: false,
        attachments: prev.attachments.filter(a => a.id !== attachmentId)
      }))

      return true
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
      throw error
    }
  }, [])

  /**
   * Delete multiple attachments
   */
  const deleteMultiple = useCallback(
    async (attachmentIds: string[]) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const params = new URLSearchParams()
        attachmentIds.forEach(id => params.append('ids', id))

        const response = await fetch(`/api/upload?${params}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Failed to delete attachments')
        }

        setState(prev => ({
          ...prev,
          loading: false,
          attachments: prev.attachments.filter(
            a => !attachmentIds.includes(a.id)
          )
        }))

        return true
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }))
        throw error
      }
    },
    []
  )

  /**
   * Update metadata
   */
  const updateMetadata = useCallback(
    async (
      attachmentId: string,
      metadata: Partial<AttachmentMetadata>
    ) => {
      try {
        const response = await fetch('/api/upload', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attachmentId,
            action: 'update-metadata',
            metadata
          })
        })

        if (!response.ok) {
          throw new Error('Failed to update metadata')
        }

        const data = await response.json()

        setState(prev => ({
          ...prev,
          attachments: prev.attachments.map(a =>
            a.id === attachmentId ? data.attachment : a
          )
        }))

        return data.attachment
      } catch (error: any) {
        setState(prev => ({ ...prev, error: error.message }))
        throw error
      }
    },
    []
  )

  /**
   * Add tags
   */
  const addTags = useCallback(
    async (attachmentId: string, tags: string[]) => {
      try {
        const response = await fetch('/api/upload', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attachmentId,
            action: 'add-tags',
            tags
          })
        })

        if (!response.ok) {
          throw new Error('Failed to add tags')
        }

        const data = await response.json()

        setState(prev => ({
          ...prev,
          attachments: prev.attachments.map(a =>
            a.id === attachmentId ? data.attachment : a
          )
        }))

        return data.attachment
      } catch (error: any) {
        setState(prev => ({ ...prev, error: error.message }))
        throw error
      }
    },
    []
  )

  /**
   * Remove tags
   */
  const removeTags = useCallback(
    async (attachmentId: string, tags: string[]) => {
      try {
        const response = await fetch('/api/upload', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attachmentId,
            action: 'remove-tags',
            tags
          })
        })

        if (!response.ok) {
          throw new Error('Failed to remove tags')
        }

        const data = await response.json()

        setState(prev => ({
          ...prev,
          attachments: prev.attachments.map(a =>
            a.id === attachmentId ? data.attachment : a
          )
        }))

        return data.attachment
      } catch (error: any) {
        setState(prev => ({ ...prev, error: error.message }))
        throw error
      }
    },
    []
  )

  /**
   * Clear errors
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      attachments: [],
      total: 0,
      uploadProgress: {}
    })
  }, [])

  return {
    ...state,
    upload,
    list,
    delete: delete_,
    deleteMultiple,
    updateMetadata,
    addTags,
    removeTags,
    clearError,
    reset
  }
}
