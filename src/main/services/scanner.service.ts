import * as fs from 'fs'
import * as path from 'path'

const SUPPORTED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif'
])

export interface FileInfo {
  id: string
  path: string
  name: string
  size: number
  ext: string
  modifiedTime: number
}

function generateId(filePath: string): string {
  const normalized = path.resolve(filePath).toLowerCase()
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36) + '_' + path.basename(filePath)
}

export async function scanFolder(
  folderPath: string,
  onProgress?: (current: number, total: number) => void
): Promise<FileInfo[]> {
  const files: FileInfo[] = []
  const allPaths: string[] = []

  // First pass: collect all file paths
  async function collectPaths(dir: string): Promise<void> {
    let entries: fs.Dirent[]
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true })
    } catch {
      return // Skip inaccessible directories
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await collectPaths(fullPath)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          allPaths.push(fullPath)
        }
      }
    }
  }

  await collectPaths(folderPath)
  const total = allPaths.length

  // Second pass: stat files
  for (let i = 0; i < allPaths.length; i++) {
    const filePath = allPaths[i]
    try {
      const stat = await fs.promises.stat(filePath)
      files.push({
        id: generateId(filePath),
        path: filePath,
        name: path.basename(filePath),
        size: stat.size,
        ext: path.extname(filePath).toLowerCase(),
        modifiedTime: stat.mtimeMs
      })
    } catch {
      // Skip files we can't stat
    }
    if (onProgress) {
      onProgress(i + 1, total)
    }
    // Yield to event loop every 50 files
    if ((i + 1) % 50 === 0) {
      await new Promise(resolve => setImmediate(resolve))
    }
  }

  return files
}
