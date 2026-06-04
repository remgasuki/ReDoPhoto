import * as fs from 'fs'
import * as path from 'path'
import type { FileInfo } from './scanner.service'
import type { HashResult, PhashResult } from './hash.service'
import { hammingDistance } from './hash.service'

export interface DuplicateGroup {
  groupId: string
  hash: string
  matchType: 'exact' | 'similar'
  files: FileInfo[]
}

export interface DedupDecision {
  groupId: string
  keepFileIds: string[]
  deleteFileIds: string[]
}

export interface DedupSettings {
  outputMode: 'copy' | 'delete'
  outputFolderName: string
}

// Union-Find for pHash grouping
class UnionFind {
  private parent: Map<string, string> = new Map()

  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x)
    const p = this.parent.get(x)!
    if (p !== x) this.parent.set(x, this.find(p))
    return this.parent.get(x)!
  }

  union(a: string, b: string): void {
    const rootA = this.find(a)
    const rootB = this.find(b)
    if (rootA !== rootB) this.parent.set(rootA, rootB)
  }
}

export function groupDuplicates(
  files: FileInfo[],
  hashResults: HashResult[],
  phashResults: PhashResult[] = [],
  phashThreshold: number = 5
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = []
  const fileMap = new Map(files.map(f => [f.id, f]))

  // Step 1: Group by SHA-256
  const shaGroups = new Map<string, string[]>()
  for (const result of hashResults) {
    if (result.sha256 === 'ERROR') continue
    if (!shaGroups.has(result.sha256)) shaGroups.set(result.sha256, [])
    shaGroups.get(result.sha256)!.push(result.id)
  }

  const exactIds = new Set<string>()
  let groupIdx = 0
  for (const [hash, ids] of shaGroups) {
    if (ids.length < 2) continue
    const groupFiles = ids.map(id => fileMap.get(id)).filter(Boolean) as FileInfo[]
    groups.push({
      groupId: `group_${groupIdx++}`,
      hash,
      matchType: 'exact',
      files: groupFiles
    })
    ids.forEach(id => exactIds.add(id))
  }

  // Step 2: Group by pHash (if enabled and results exist)
  if (phashResults.length > 0) {
    // Only consider files that are NOT in any exact group (or their representatives)
    const phashMap = new Map(phashResults.map(r => [r.id, r.phash]))
    const candidates = phashResults.filter(r => !exactIds.has(r.id))

    if (candidates.length > 1) {
      const uf = new UnionFind()
      candidates.forEach(c => uf.find(c.id))

      for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
          const dist = hammingDistance(candidates[i].phash, candidates[j].phash)
          if (dist <= phashThreshold) {
            uf.union(candidates[i].id, candidates[j].id)
          }
        }
      }

      // Collect groups
      const pGroups = new Map<string, string[]>()
      for (const c of candidates) {
        const root = uf.find(c.id)
        if (!pGroups.has(root)) pGroups.set(root, [])
        pGroups.get(root)!.push(c.id)
      }

      for (const [, ids] of pGroups) {
        if (ids.length < 2) continue
        const groupFiles = ids.map(id => fileMap.get(id)).filter(Boolean) as FileInfo[]
        groups.push({
          groupId: `group_${groupIdx++}`,
          hash: phashMap.get(ids[0]) || '',
          matchType: 'similar',
          files: groupFiles
        })
      }
    }
  }

  return groups
}

export async function executeDedup(
  decisions: DedupDecision[],
  allFiles: FileInfo[],
  groups: DuplicateGroup[],
  settings: DedupSettings,
  sourceFolder: string,
  onProgress?: (current: number, total: number, currentFile: string) => void
): Promise<{ success: number; errors: string[] }> {
  if (settings.outputMode === 'delete') {
    return executeDeleteMode(decisions, onProgress)
  } else {
    return executeCopyMode(decisions, allFiles, groups, settings, sourceFolder, onProgress)
  }
}

async function executeDeleteMode(
  decisions: DedupDecision[],
  onProgress?: (current: number, total: number, currentFile: string) => void
): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = []
  let success = 0
  const allDeletes = decisions.flatMap(d => d.deleteFileIds)
  const fileMap = new Map(allDeletes.map((id, i) => [id, i]))

  // We need file paths - get them from decisions context
  // Since we only have IDs, we need the full file info passed differently
  // This is handled by the IPC handler passing file paths
  const total = allDeletes.length
  for (let i = 0; i < allDeletes.length; i++) {
    const filePath = allDeletes[i] // In delete mode, deleteFileIds contains paths
    if (onProgress) onProgress(i + 1, total, path.basename(filePath))
    try {
      await fs.promises.unlink(filePath)
      success++
    } catch (err) {
      errors.push(`Failed to delete ${filePath}: ${err}`)
    }
    if ((i + 1) % 10 === 0) {
      await new Promise(resolve => setImmediate(resolve))
    }
  }

  return { success, errors }
}

async function executeCopyMode(
  decisions: DedupDecision[],
  allFiles: FileInfo[],
  groups: DuplicateGroup[],
  settings: DedupSettings,
  sourceFolder: string,
  onProgress?: (current: number, total: number, currentFile: string) => void
): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = []
  let success = 0

  const outputFolder = path.join(path.dirname(sourceFolder), settings.outputFolderName)

  // Create output folder
  await fs.promises.mkdir(outputFolder, { recursive: true })

  // Collect files to keep
  const keepIds = new Set(decisions.flatMap(d => d.keepFileIds))
  const deleteIds = new Set(decisions.flatMap(d => d.deleteFileIds))
  const duplicateFileIds = new Set([...keepIds, ...deleteIds])

  // Files to copy: all files NOT in any duplicate group + kept files from groups
  const filesToCopy = allFiles.filter(f => !duplicateFileIds.has(f.id) || keepIds.has(f.id))
  const total = filesToCopy.length

  for (let i = 0; i < filesToCopy.length; i++) {
    const file = filesToCopy[i]
    if (onProgress) onProgress(i + 1, total, file.name)

    const relativePath = path.relative(sourceFolder, file.path)
    const destPath = path.join(outputFolder, relativePath)

    try {
      await fs.promises.mkdir(path.dirname(destPath), { recursive: true })
      await fs.promises.copyFile(file.path, destPath)
      success++
    } catch (err) {
      errors.push(`Failed to copy ${file.name}: ${err}`)
    }

    if ((i + 1) % 20 === 0) {
      await new Promise(resolve => setImmediate(resolve))
    }
  }

  return { success, errors }
}
