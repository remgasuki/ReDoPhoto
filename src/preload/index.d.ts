export type {
  FileInfo,
  HashResult,
  PhashResult,
  DuplicateGroup,
  DedupDecision,
  DedupSettings,
  AppSettings,
  ScanProgress,
  DedupProgress
} from './index'

interface ElectronAPI {
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>

  selectFolder: () => Promise<string | null>
  scanFolder: (folderPath: string) => Promise<import('./index').FileInfo[]>

  computeHashes: (files: import('./index').FileInfo[]) => Promise<import('./index').HashResult[]>
  computePhashes: (files: import('./index').FileInfo[]) => Promise<import('./index').PhashResult[]>

  groupDuplicates: (data: {
    hashResults: import('./index').HashResult[]
    phashResults?: import('./index').PhashResult[]
    phashThreshold?: number
  }) => Promise<import('./index').DuplicateGroup[]>

  executeDedup: (data: {
    decisions: import('./index').DedupDecision[]
    settings: import('./index').DedupSettings
    sourceFolder: string
    files: import('./index').FileInfo[]
  }) => Promise<{ success: number; errors: string[] }>

  getThumbnail: (filePath: string, maxSize?: number) => Promise<string>

  getSettings: () => Promise<import('./index').AppSettings>
  setSettings: (s: Partial<import('./index').AppSettings>) => Promise<import('./index').AppSettings>

  onScanProgress: (cb: (data: import('./index').ScanProgress) => void) => () => void
  onHashProgress: (cb: (data: import('./index').ScanProgress) => void) => () => void
  onDedupProgress: (cb: (data: import('./index').DedupProgress) => void) => () => void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
