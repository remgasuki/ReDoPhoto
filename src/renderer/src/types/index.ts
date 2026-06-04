export interface FileInfo {
  id: string
  path: string
  name: string
  size: number
  ext: string
  modifiedTime: number
}

export interface HashResult {
  id: string
  sha256: string
}

export interface PhashResult {
  id: string
  phash: string
}

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

export interface AppSettings {
  hashMode: 'sha256' | 'phash' | 'both'
  phashThreshold: number
  outputMode: 'copy' | 'delete'
  outputFolderSuffix: string
}

export interface ScanProgress {
  phase: 'scanning' | 'hashing' | 'phashing' | 'grouping' | 'done'
  current: number
  total: number
  percentage: number
}

export interface DedupProgress {
  current: number
  total: number
  currentFile: string
  percentage: number
}
