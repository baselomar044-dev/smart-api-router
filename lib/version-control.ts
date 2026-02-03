// ============================================
// 5. VERSION CONTROL SYSTEM
// ============================================

export interface Version {
  id: string
  projectId: string
  version: number
  content: any
  message: string
  author: string
  timestamp: string
  parentId?: string
  tags: string[]
  diff?: VersionDiff
}

export interface VersionDiff {
  added: string[]
  removed: string[]
  modified: string[]
  stats: { additions: number; deletions: number }
}

export interface Branch {
  name: string
  headVersionId: string
  createdAt: string
  updatedAt: string
}

// Diff calculation utilities
export function calculateDiff(oldContent: any, newContent: any): VersionDiff {
  const oldLines = JSON.stringify(oldContent, null, 2).split('\n')
  const newLines = JSON.stringify(newContent, null, 2).split('\n')
  
  const oldSet = new Set(oldLines)
  const newSet = new Set(newLines)
  
  const added = newLines.filter(line => !oldSet.has(line))
  const removed = oldLines.filter(line => !newSet.has(line))
  const modified = newLines.filter((line, i) => oldLines[i] !== line && oldSet.has(line))

  return {
    added,
    removed,
    modified,
    stats: { additions: added.length, deletions: removed.length }
  }
}

// Version Control Manager
export class VersionControlManager {
  private versions: Map<string, Version[]> = new Map()
  private branches: Map<string, Branch[]> = new Map()

  // Create a new version
  async createVersion(
    projectId: string,
    content: any,
    message: string,
    author: string,
    tags: string[] = []
  ): Promise<Version> {
    const projectVersions = this.versions.get(projectId) || []
    const lastVersion = projectVersions[projectVersions.length - 1]
    
    const newVersion: Version = {
      id: crypto.randomUUID(),
      projectId,
      version: (lastVersion?.version || 0) + 1,
      content,
      message,
      author,
      timestamp: new Date().toISOString(),
      parentId: lastVersion?.id,
      tags,
      diff: lastVersion ? calculateDiff(lastVersion.content, content) : undefined
    }

    projectVersions.push(newVersion)
    this.versions.set(projectId, projectVersions)
    
    return newVersion
  }

  // Get version history
  getHistory(projectId: string, limit?: number): Version[] {
    const versions = this.versions.get(projectId) || []
    return limit ? versions.slice(-limit).reverse() : [...versions].reverse()
  }

  // Get specific version
  getVersion(projectId: string, versionId: string): Version | undefined {
    const versions = this.versions.get(projectId) || []
    return versions.find(v => v.id === versionId)
  }

  // Get version by number
  getVersionByNumber(projectId: string, versionNumber: number): Version | undefined {
    const versions = this.versions.get(projectId) || []
    return versions.find(v => v.version === versionNumber)
  }

  // Restore to a previous version
  async restore(projectId: string, versionId: string, author: string): Promise<Version> {
    const targetVersion = this.getVersion(projectId, versionId)
    if (!targetVersion) throw new Error('Version not found')

    return this.createVersion(
      projectId,
      targetVersion.content,
      `Restored from v${targetVersion.version}: "${targetVersion.message}"`,
      author,
      ['restored']
    )
  }

  // Compare two versions
  compare(projectId: string, versionId1: string, versionId2: string): VersionDiff | null {
    const v1 = this.getVersion(projectId, versionId1)
    const v2 = this.getVersion(projectId, versionId2)
    if (!v1 || !v2) return null
    return calculateDiff(v1.content, v2.content)
  }

  // Branch operations
  createBranch(projectId: string, branchName: string, fromVersionId?: string): Branch {
    const versions = this.versions.get(projectId) || []
    const headVersion = fromVersionId 
      ? versions.find(v => v.id === fromVersionId)
      : versions[versions.length - 1]

    const branch: Branch = {
      name: branchName,
      headVersionId: headVersion?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const projectBranches = this.branches.get(projectId) || []
    projectBranches.push(branch)
    this.branches.set(projectId, projectBranches)

    return branch
  }

  // Tag a version
  tagVersion(projectId: string, versionId: string, tag: string): Version | undefined {
    const versions = this.versions.get(projectId) || []
    const version = versions.find(v => v.id === versionId)
    if (version && !version.tags.includes(tag)) {
      version.tags.push(tag)
    }
    return version
  }

  // Get versions by tag
  getVersionsByTag(projectId: string, tag: string): Version[] {
    const versions = this.versions.get(projectId) || []
    return versions.filter(v => v.tags.includes(tag))
  }

  // Auto-save with debounce
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map()
  
  scheduleAutoSave(projectId: string, content: any, author: string, delayMs = 30000): void {
    const existingTimer = this.autoSaveTimers.get(projectId)
    if (existingTimer) clearTimeout(existingTimer)

    const timer = setTimeout(() => {
      this.createVersion(projectId, content, 'Auto-save', author, ['auto-save'])
      this.autoSaveTimers.delete(projectId)
    }, delayMs)

    this.autoSaveTimers.set(projectId, timer)
  }

  cancelAutoSave(projectId: string): void {
    const timer = this.autoSaveTimers.get(projectId)
    if (timer) {
      clearTimeout(timer)
      this.autoSaveTimers.delete(projectId)
    }
  }
}

