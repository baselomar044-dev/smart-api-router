// ============================================
// 7. FILE ATTACHMENTS & IMPORT SYSTEM
// ============================================

export interface FileAttachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  thumbnail?: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface ImportResult {
  success: boolean
  files: FileAttachment[]
  errors: string[]
  projectData?: any
}

// Supported import formats
const SUPPORTED_IMPORTS = {
  // Code files
  code: ['.html', '.css', '.js', '.ts', '.tsx', '.jsx', '.json', '.md'],
  // Design files
  design: ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico'],
  // Documents
  documents: ['.pdf', '.txt', '.doc', '.docx'],
  // Archives (for project import)
  archives: ['.zip', '.tar', '.gz'],
  // Data
  data: ['.csv', '.xlsx', '.xml']
}

// File Manager Class
export class FileManager {
  private files: Map<string, FileAttachment> = new Map()
  private maxFileSize = 10 * 1024 * 1024 // 10MB default

  // Upload single file
  async uploadFile(file: File, projectId?: string): Promise<FileAttachment> {
    if (file.size > this.maxFileSize) {
      throw new Error(`File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`)
    }

    const id = crypto.randomUUID()
    const isImage = file.type.startsWith('image/')
    
    // Create URL (in production, upload to Supabase/S3)
    const url = URL.createObjectURL(file)
    
    // Generate thumbnail for images
    let thumbnail: string | undefined
    if (isImage) {
      thumbnail = await this.generateThumbnail(file)
    }

    const attachment: FileAttachment = {
      id,
      name: file.name,
      type: file.type,
      size: file.size,
      url,
      thumbnail,
      metadata: { projectId },
      createdAt: new Date().toISOString()
    }

    this.files.set(id, attachment)
    return attachment
  }

  // Upload multiple files
  async uploadFiles(files: FileList | File[]): Promise<FileAttachment[]> {
    const results: FileAttachment[] = []
    for (const file of Array.from(files)) {
      try {
        const attachment = await this.uploadFile(file)
        results.push(attachment)
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
      }
    }
    return results
  }

  // Import project from ZIP
  async importProject(file: File): Promise<ImportResult> {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(file)
    
    const files: FileAttachment[] = []
    const errors: string[] = []
    let projectData: any = null

    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue

      try {
        const content = await zipEntry.async('blob')
        const fileObj = new File([content], filename, { type: getMimeType(filename) })
        
        // Check for project.json or solveit.json
        if (filename === 'project.json' || filename === 'solveit.json') {
          const text = await zipEntry.async('text')
          projectData = JSON.parse(text)
        } else {
          const attachment = await this.uploadFile(fileObj)
          files.push(attachment)
        }
      } catch (error) {
        errors.push(`Failed to import ${filename}: ${(error as Error).message}`)
      }
    }

    return { success: errors.length === 0, files, errors, projectData }
  }

  // Import from URL
  async importFromUrl(url: string): Promise<FileAttachment> {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch file')
    
    const blob = await response.blob()
    const filename = url.split('/').pop() || 'imported-file'
    const file = new File([blob], filename, { type: blob.type })
    
    return this.uploadFile(file)
  }

  // Import code from GitHub
  async importFromGitHub(repoUrl: string, branch = 'main'): Promise<ImportResult> {
    const [, owner, repo] = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/) || []
    if (!owner || !repo) throw new Error('Invalid GitHub URL')

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`
    const response = await fetch(apiUrl)
    if (!response.ok) throw new Error('Failed to fetch repository')
    
    const blob = await response.blob()
    const file = new File([blob], `${repo}.zip`, { type: 'application/zip' })
    
    return this.importProject(file)
  }

  // Get file by ID
  getFile(id: string): FileAttachment | undefined {
    return this.files.get(id)
  }

  // Get all files
  getAllFiles(): FileAttachment[] {
    return Array.from(this.files.values())
  }

  // Delete file
  deleteFile(id: string): boolean {
    const file = this.files.get(id)
    if (file) {
      URL.revokeObjectURL(file.url)
      if (file.thumbnail) URL.revokeObjectURL(file.thumbnail)
      this.files.delete(id)
      return true
    }
    return false
  }

  // Generate thumbnail for images
  private async generateThumbnail(file: File, maxSize = 200): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // Read file content
  async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
  }

  // Export files as ZIP
  async exportAsZip(fileIds: string[], projectData?: any): Promise<Blob> {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    // Add project data
    if (projectData) {
      zip.file('project.json', JSON.stringify(projectData, null, 2))
    }

    // Add files
    for (const id of fileIds) {
      const file = this.files.get(id)
      if (file) {
        const response = await fetch(file.url)
        const blob = await response.blob()
        zip.file(file.name, blob)
      }
    }

    return zip.generateAsync({ type: 'blob' })
  }
}

// Helper function to get MIME type from filename
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    html: 'text/html', css: 'text/css', js: 'text/javascript',
    ts: 'text/typescript', tsx: 'text/typescript', jsx: 'text/javascript',
    json: 'application/json', md: 'text/markdown',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
    pdf: 'application/pdf', txt: 'text/plain',
    zip: 'application/zip', csv: 'text/csv'
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

