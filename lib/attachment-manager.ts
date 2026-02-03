// ============================================
// ATTACHMENT MANAGER - Full Implementation
// ============================================

import { supabase } from './supabase'

export interface AttachmentMetadata {
  mimeType: string
  size: number
  uploadedAt: string
  uploadedBy: string
  projectId?: string
  workflowId?: string
  tags?: string[]
  description?: string
}

export interface Attachment {
  id: string
  userId: string
  filename: string
  path: string
  url: string
  metadata: AttachmentMetadata
  createdAt: string
  updatedAt: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
  status: 'pending' | 'uploading' | 'completed' | 'failed'
}

export class AttachmentManager {
  private bucketName = 'attachments'
  private maxFileSize = 100 * 1024 * 1024 // 100MB
  private allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
    'application/zip',
    'application/x-rar-compressed',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]

  /**
   * Upload a file
   */
  async uploadFile(
    file: File,
    userId: string,
    projectId?: string,
    metadata: Partial<AttachmentMetadata> = {}
  ): Promise<Attachment> {
    // Validate file
    this.validateFile(file)

    try {
      const filePath = this.generateFilePath(userId, file.name)
      const fileBuffer = await file.arrayBuffer()

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, new Blob([fileBuffer], { type: file.type }), {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath)

      // Create database record
      const attachmentRecord = {
        user_id: userId,
        filename: file.name,
        path: filePath,
        url: publicUrlData.publicUrl,
        metadata: {
          mimeType: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          uploadedBy: userId,
          projectId,
          ...metadata
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: dbData, error: dbError } = await supabase
        .from('attachments')
        .insert(attachmentRecord)
        .select()
        .single()

      if (dbError) {
        // Clean up storage if database insert fails
        await supabase.storage.from(this.bucketName).remove([filePath])
        throw new Error(`Database error: ${dbError.message}`)
      }

      return dbData as Attachment
    } catch (error: any) {
      throw new Error(`Failed to upload attachment: ${error.message}`)
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    userId: string,
    projectId?: string
  ): Promise<Attachment[]> {
    const results: Attachment[] = []
    const errors: { file: string; error: string }[] = []

    for (const file of files) {
      try {
        const attachment = await this.uploadFile(file, userId, projectId)
        results.push(attachment)
      } catch (error: any) {
        errors.push({ file: file.name, error: error.message })
      }
    }

    if (errors.length > 0) {
      console.warn('Some files failed to upload:', errors)
    }

    return results
  }

  /**
   * Get attachment details
   */
  async getAttachment(attachmentId: string): Promise<Attachment> {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', attachmentId)
      .single()

    if (error) {
      throw new Error(`Attachment not found: ${error.message}`)
    }

    return data as Attachment
  }

  /**
   * List user's attachments
   */
  async listAttachments(
    userId: string,
    projectId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ items: Attachment[]; total: number }> {
    let query = supabase
      .from('attachments')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    if (projectId) {
      query = query.eq("metadata->>'projectId'", projectId)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to list attachments: ${error.message}`)
    }

    return {
      items: data as Attachment[],
      total: count || 0
    }
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      // Get attachment details
      const attachment = await this.getAttachment(attachmentId)

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.bucketName)
        .remove([attachment.path])

      if (storageError) {
        console.warn('Storage deletion warning:', storageError)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId)

      if (dbError) {
        throw new Error(`Database deletion failed: ${dbError.message}`)
      }
    } catch (error: any) {
      throw new Error(`Failed to delete attachment: ${error.message}`)
    }
  }

  /**
   * Delete multiple attachments
   */
  async deleteAttachments(attachmentIds: string[]): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
    const success: string[] = []
    const failed: { id: string; error: string }[] = []

    for (const id of attachmentIds) {
      try {
        await this.deleteAttachment(id)
        success.push(id)
      } catch (error: any) {
        failed.push({ id, error: error.message })
      }
    }

    return { success, failed }
  }

  /**
   * Get attachment content as text
   */
  async getAttachmentContent(attachmentId: string): Promise<string> {
    try {
      const attachment = await this.getAttachment(attachmentId)

      // Only allow text-like files
      const textMimeTypes = ['text/plain', 'application/json', 'text/csv']
      if (!textMimeTypes.includes(attachment.metadata.mimeType)) {
        throw new Error('Can only read text-based files')
      }

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(attachment.path)

      if (error) {
        throw new Error(`Failed to download: ${error.message}`)
      }

      return await data.text()
    } catch (error: any) {
      throw new Error(`Failed to get content: ${error.message}`)
    }
  }

  /**
   * Share attachment via temporary signed URL
   */
  async getSignedUrl(attachmentId: string, expiresIn: number = 3600): Promise<string> {
    try {
      const attachment = await this.getAttachment(attachmentId)

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(attachment.path, expiresIn)

      if (error) {
        throw new Error(`Failed to create signed URL: ${error.message}`)
      }

      return data.signedUrl
    } catch (error: any) {
      throw new Error(`Failed to get signed URL: ${error.message}`)
    }
  }

  /**
   * Bulk update attachment metadata
   */
  async updateAttachmentMetadata(
    attachmentId: string,
    metadata: Partial<AttachmentMetadata>
  ): Promise<Attachment> {
    try {
      const attachment = await this.getAttachment(attachmentId)
      const updatedMetadata = { ...attachment.metadata, ...metadata }

      const { data, error } = await supabase
        .from('attachments')
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', attachmentId)
        .select()
        .single()

      if (error) {
        throw new Error(`Update failed: ${error.message}`)
      }

      return data as Attachment
    } catch (error: any) {
      throw new Error(`Failed to update metadata: ${error.message}`)
    }
  }

  /**
   * Add tags to attachment
   */
  async addTags(attachmentId: string, tags: string[]): Promise<Attachment> {
    const attachment = await this.getAttachment(attachmentId)
    const existingTags = attachment.metadata.tags || []
    const updatedTags = Array.from(new Set([...existingTags, ...tags]))

    return this.updateAttachmentMetadata(attachmentId, { tags: updatedTags })
  }

  /**
   * Remove tags from attachment
   */
  async removeTags(attachmentId: string, tags: string[]): Promise<Attachment> {
    const attachment = await this.getAttachment(attachmentId)
    const existingTags = attachment.metadata.tags || []
    const updatedTags = existingTags.filter(t => !tags.includes(t))

    return this.updateAttachmentMetadata(attachmentId, { tags: updatedTags })
  }

  /**
   * Search attachments by tag
   */
  async searchByTag(userId: string, tag: string): Promise<Attachment[]> {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('user_id', userId)
      .contains('metadata->tags', [tag])

    if (error) {
      throw new Error(`Search failed: ${error.message}`)
    }

    return data as Attachment[]
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds limit: ${this.maxFileSize / 1024 / 1024}MB`)
    }

    if (!this.allowedMimeTypes.includes(file.type)) {
      throw new Error(`File type not allowed: ${file.type}`)
    }

    if (!file.name || file.name.trim() === '') {
      throw new Error('File must have a name')
    }
  }

  /**
   * Generate unique file path
   */
  private generateFilePath(userId: string, filename: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const ext = filename.split('.').pop()
    const name = filename.substring(0, filename.lastIndexOf('.'))
    const sanitized = name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase()

    return `${userId}/${timestamp}_${random}_${sanitized}.${ext}`
  }
}

export default AttachmentManager
