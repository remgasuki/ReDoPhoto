export type {
  FileInfo,
  HashResult,
  PhashResult,
  DuplicateGroup,
  DedupDecision,
  DedupSettings,
  ThemeColor,
  DedupConfig,
  RenameConfig,
  OrientationConfig,
  IdPhotoConfig,
  AppSettings,
  ScanProgress,
  DedupProgress,
  ExifInfo,
  RenamePreview,
  RenameProgress,
  OrientationInfo,
  OrientationProgress,
  CropRect,
  IdPhotoProcessParams,
  RecolorParams,
  IdPhotoProgress,
  BeautyParams,
  CompressParams,
  CompressResult,
  PrintLayoutParams,
  PrintLayoutResult
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
  setSettings: (s: Partial<import('./index').AppSettings> & Record<string, any>) => Promise<import('./index').AppSettings>

  // Rename
  scanExif: (files: import('./index').FileInfo[]) => Promise<import('./index').ExifInfo[]>
  previewRename: (data: {
    exifInfos: import('./index').ExifInfo[]
    settings: import('./index').RenameConfig
    sourceFolder: string
  }) => Promise<import('./index').RenamePreview[]>
  executeRename: (data: {
    previews: import('./index').RenamePreview[]
    settings: import('./index').RenameConfig
    sourceFolder: string
  }) => Promise<{ success: number; errors: string[] }>

  // Orientation
  scanOrientations: (files: import('./index').FileInfo[]) => Promise<import('./index').OrientationInfo[]>
  fixOrientations: (data: {
    files: import('./index').OrientationInfo[]
    settings: import('./index').OrientationConfig
    sourceFolder: string
  }) => Promise<{ success: number; errors: string[] }>

  onScanProgress: (cb: (data: import('./index').ScanProgress) => void) => () => void
  onHashProgress: (cb: (data: import('./index').ScanProgress) => void) => () => void
  onDedupProgress: (cb: (data: import('./index').DedupProgress) => void) => () => void
  onRenameProgress: (cb: (data: import('./index').RenameProgress) => void) => () => void
  onOrientationProgress: (cb: (data: import('./index').OrientationProgress) => void) => () => void

  // File operations
  selectImage: () => Promise<string | null>
  getImageInfo: (filePath: string) => Promise<{ width: number; height: number; format: string }>
  showSaveDialog: (defaultName: string) => Promise<string | null>

  // ID Photo
  processIdPhoto: (params: import('./index').IdPhotoProcessParams) => Promise<{ success: boolean; outputPath: string; error?: string }>
  recolorIdPhoto: (params: import('./index').RecolorParams) => Promise<{ success: boolean; outputPath: string; error?: string }>
  getRecolorPreview: (sourcePath: string, targetBgColor: string, tolerance: number) => Promise<string>
  onIdPhotoProgress: (cb: (data: import('./index').IdPhotoProgress) => void) => () => void

  // AI Recolor
  recolorIdPhotoAI: (params: import('./index').RecolorParams) => Promise<{ success: boolean; outputPath: string; error?: string }>
  getRecolorPreviewAI: (sourcePath: string, targetBgColor: string) => Promise<string>

  // Beauty filter
  getBeautyPreview: (sourcePath: string, params: import('./index').BeautyParams) => Promise<string>

  // Compress
  compressToTargetSize: (params: import('./index').CompressParams) => Promise<import('./index').CompressResult>
  batchCompress: (sources: Array<{ sourcePath: string; outputPath: string }>, targetSizeKB: number) => Promise<import('./index').CompressResult[]>

  // Print layout
  generatePrintLayout: (params: import('./index').PrintLayoutParams) => Promise<import('./index').PrintLayoutResult>
  getPrintLayoutPreview: (photoPath: string, rows: number, cols: number, spacingMm: number) => Promise<string>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
