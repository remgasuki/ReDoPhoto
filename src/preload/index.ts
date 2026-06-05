import { contextBridge, ipcRenderer } from 'electron'

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
  themeColor: 'black' | 'white' | 'beige' | 'skyblue' | 'darkblue' | 'kleinblue' | 'qing'
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

const api = {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),

  // Folder operations
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke('folder:select'),
  scanFolder: (folderPath: string): Promise<FileInfo[]> =>
    ipcRenderer.invoke('folder:scan', { folderPath }),

  // Hash computation
  computeHashes: (files: FileInfo[]): Promise<HashResult[]> =>
    ipcRenderer.invoke('hash:computeAll', { files }),
  computePhashes: (files: FileInfo[]): Promise<PhashResult[]> =>
    ipcRenderer.invoke('phash:computeAll', { files }),

  // Deduplication
  groupDuplicates: (data: {
    hashResults: HashResult[]
    phashResults?: PhashResult[]
    phashThreshold?: number
  }): Promise<DuplicateGroup[]> => ipcRenderer.invoke('dedup:group', data),

  executeDedup: (data: {
    decisions: DedupDecision[]
    settings: DedupSettings
    sourceFolder: string
    files: FileInfo[]
  }): Promise<{ success: number; errors: string[] }> =>
    ipcRenderer.invoke('dedup:execute', data),

  // Thumbnail
  getThumbnail: (filePath: string, maxSize?: number): Promise<string> =>
    ipcRenderer.invoke('file:thumbnail', { filePath, maxSize }),

  // Settings
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  setSettings: (s: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:set', s),

  // Progress listeners
  onScanProgress: (cb: (data: ScanProgress) => void): (() => void) => {
    const handler = (_event: any, data: ScanProgress) => cb(data)
    ipcRenderer.on('scan:progress', handler)
    return () => ipcRenderer.removeListener('scan:progress', handler)
  },

  onHashProgress: (cb: (data: ScanProgress) => void): (() => void) => {
    const handler = (_event: any, data: ScanProgress) => cb(data)
    ipcRenderer.on('hash:progress', handler)
    return () => ipcRenderer.removeListener('hash:progress', handler)
  },

  onDedupProgress: (cb: (data: DedupProgress) => void): (() => void) => {
    const handler = (_event: any, data: DedupProgress) => cb(data)
    ipcRenderer.on('dedup:progress', handler)
    return () => ipcRenderer.removeListener('dedup:progress', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)
