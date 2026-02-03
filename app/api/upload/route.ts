// ============================================
// FILE UPLOAD API ROUTE
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import AttachmentManager from '@/lib/attachment-manager'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const userId = formData.get('userId') as string
    const projectId = formData.get('projectId') as string | undefined
    const description = formData.get('description') as string | undefined
    const tags = formData.get('tags') as string | undefined

    // Validate input
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const manager = new AttachmentManager()

    // Parse metadata
    const metadata: any = {}
    if (description) metadata.description = description
    if (tags) {
      try {
        metadata.tags = JSON.parse(tags)
      } catch {
        metadata.tags = tags.split(',').map(t => t.trim())
      }
    }

    // Handle single file
    if (files.length === 1) {
      try {
        const attachment = await manager.uploadFile(
          files[0],
          userId,
          projectId,
          metadata
        )

        return NextResponse.json({
          success: true,
          attachment,
          message: 'File uploaded successfully'
        })
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    // Handle multiple files
    try {
      const attachments = await manager.uploadFiles(files, userId, projectId)

      return NextResponse.json({
        success: true,
        attachments,
        count: attachments.length,
        message: `${attachments.length} files uploaded successfully`
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}

// GET endpoint for listing attachments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const projectId = searchParams.get('projectId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const manager = new AttachmentManager()
    const result = await manager.listAttachments(userId, projectId, limit, offset)

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE endpoint for removing attachments
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get('id')
    const ids = searchParams.getAll('ids')

    if (!attachmentId && ids.length === 0) {
      return NextResponse.json(
        { error: 'Attachment ID or IDs are required' },
        { status: 400 }
      )
    }

    const manager = new AttachmentManager()

    // Single delete
    if (attachmentId) {
      try {
        await manager.deleteAttachment(attachmentId)
        return NextResponse.json({ success: true, message: 'Attachment deleted' })
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    // Bulk delete
    try {
      const result = await manager.deleteAttachments(ids)
      return NextResponse.json({
        success: true,
        ...result,
        message: `Deleted ${result.success.length} attachments`
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Delete failed' },
      { status: 500 }
    )
  }
}

// PATCH endpoint for updating metadata
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { attachmentId, metadata, action, tags } = body

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Attachment ID is required' },
        { status: 400 }
      )
    }

    const manager = new AttachmentManager()

    // Update metadata
    if (action === 'update-metadata' && metadata) {
      const updated = await manager.updateAttachmentMetadata(attachmentId, metadata)
      return NextResponse.json({ success: true, attachment: updated })
    }

    // Add tags
    if (action === 'add-tags' && tags && Array.isArray(tags)) {
      const updated = await manager.addTags(attachmentId, tags)
      return NextResponse.json({ success: true, attachment: updated })
    }

    // Remove tags
    if (action === 'remove-tags' && tags && Array.isArray(tags)) {
      const updated = await manager.removeTags(attachmentId, tags)
      return NextResponse.json({ success: true, attachment: updated })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Update error:', error)
    return NextResponse.json(
      { error: error.message || 'Update failed' },
      { status: 500 }
    )
  }
}
