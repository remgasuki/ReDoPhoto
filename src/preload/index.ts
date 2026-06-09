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

// New nested settings types
export type ThemeColor = 'black' | 'white' | 'beige' | 'skyblue' | 'darkblue' | 'kleinblue' | 'gray'

export interface DedupConfig {
  hashMode: 'sha256' | 'phash' | 'both'
  phashThreshold: number
  outputMode: 'copy' | 'delete'
}

export interface RenameConfig {
  outputMode: 'copy' | 'rename-in-place'
  nameFormat: string
  dateFormat: string
  separator: string
}

export interface OrientationConfig {
  outputMode: 'copy' | 'fix-in-place'
}

export interface IdPhotoConfig {
  outputFormat: 'jpg' | 'png'
  quality: number
}

export interface AppSettings {
  dedup: DedupConfig
  rename: RenameConfig
  orientation: OrientationConfig
  idphoto: IdPhotoConfig
  outputFolderSuffix: string
  themeColor: ThemeColor
}

// DeepPartial for partial settings updates
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
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

// Rename types
export interface ExifInfo {
  id: string
  dateTimeOriginal: string | null  // ISO string
  gpsLatitude: number | null
  gpsLongitude: number | null
  locationName: string | null
  originalName: string
}

export interface RenamePreview {
  id: string
  originalPath: string
  originalName: string
  newName: string
  newPath: string
  exifInfo: ExifInfo
  selected: boolean
}

export interface RenameProgress {
  phase: 'scanning' | 'geocoding' | 'executing'
  current: number
  total: number
  percentage: number
}

// Orientation types
export interface OrientationInfo {
  id: string
  path: string
  name: string
  orientation: number | null
  needsFix: boolean
  description: string
}

export interface OrientationProgress {
  phase: 'scanning' | 'fixing'
  current: number
  total: number
  percentage: number
}

// ID Photo types
export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface IdPhotoProcessParams {
  sourcePath: string
  outputPath: string
  cropRect: CropRect
  targetWidthPx: number
  targetHeightPx: number
  dpi: number
  bgColor: string | null
  outputFormat: 'jpg' | 'png'
  quality: number
}

export interface RecolorParams {
  sourcePath: string
  outputPath: string
  targetBgColor: string
  tolerance: number
  outputFormat: 'jpg' | 'png'
  quality: number
}

export interface IdPhotoProgress {
  phase: 'processing' | 'ai_matting' | 'compositing' | 'saving' | 'done'
  percentage: number
}

export interface BeautyParams {
  smooth: number
  brightness: number
  contrast: number
}

export interface CompressParams {
  sourcePath: string
  outputPath: string
  targetSizeKB: number
  toleranceKB?: number
  minQuality?: number
  maxQuality?: number
}

export interface CompressResult {
  success: boolean
  outputPath: string
  originalSizeKB: number
  actualSizeKB: number
  quality: number
  iterations: number
  error?: string
}

export interface PrintLayoutParams {
  photoPath: string
  paperWidthInch: number
  paperHeightInch: number
  dpi: number
  rows: number
  cols: number
  spacingMm: number
  outputPath: string
  outputFormat: 'jpg' | 'png'
  quality: number
}

export interface PrintLayoutResult {
  success: boolean
  outputPath: string
  paperSizePx: { width: number; height: number }
  actualCount: number
  error?: string
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
  setSettings: (s: DeepPartial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:set', s),

  // Rename
  scanExif: (files: FileInfo[]): Promise<ExifInfo[]> =>
    ipcRenderer.invoke('rename:scanExif', { files }),
  previewRename: (data: {
    exifInfos: ExifInfo[]
    settings: RenameConfig
    sourceFolder: string
  }): Promise<RenamePreview[]> => ipcRenderer.invoke('rename:preview', data),
  executeRename: (data: {
    previews: RenamePreview[]
    settings: RenameConfig
    sourceFolder: string
  }): Promise<{ success: number; errors: string[] }> =>
    ipcRenderer.invoke('rename:execute', data),

  // Orientation
  scanOrientations: (files: FileInfo[]): Promise<OrientationInfo[]> =>
    ipcRenderer.invoke('orientation:scan', { files }),
  fixOrientations: (data: {
    files: OrientationInfo[]
    settings: OrientationConfig
    sourceFolder: string
  }): Promise<{ success: number; errors: string[] }> =>
    ipcRenderer.invoke('orientation:fix', data),

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
  },

  onRenameProgress: (cb: (data: RenameProgress) => void): (() => void) => {
    const handler = (_event: any, data: RenameProgress) => cb(data)
    ipcRenderer.on('rename:progress', handler)
    return () => ipcRenderer.removeListener('rename:progress', handler)
  },

  onOrientationProgress: (cb: (data: OrientationProgress) => void): (() => void) => {
    const handler = (_event: any, data: OrientationProgress) => cb(data)
    ipcRenderer.on('orientation:progress', handler)
    return () => ipcRenderer.removeListener('orientation:progress', handler)
  },

  // File operations
  selectImage: (): Promise<string | null> => ipcRenderer.invoke('file:selectImage'),

  getImageInfo: (filePath: string): Promise<{ width: number; height: number; format: string }> =>
    ipcRenderer.invoke('file:imageInfo', { filePath }),

  showSaveDialog: (defaultName: string): Promise<string | null> =>
    ipcRenderer.invoke('file:saveDialog', { defaultName }),

  // ID Photo
  processIdPhoto: (params: IdPhotoProcessParams): Promise<{ success: boolean; outputPath: string; error?: string }> =>
    ipcRenderer.invoke('idphoto:process', { params }),

  recolorIdPhoto: (params: RecolorParams): Promise<{ success: boolean; outputPath: string; error?: string }> =>
    ipcRenderer.invoke('idphoto:recolor', { params }),

  getRecolorPreview: (sourcePath: string, targetBgColor: string, tolerance: number): Promise<string> =>
    ipcRenderer.invoke('idphoto:recolorPreview', { sourcePath, targetBgColor, tolerance }),

  onIdPhotoProgress: (cb: (data: IdPhotoProgress) => void): (() => void) => {
    const handler = (_event: any, data: IdPhotoProgress) => cb(data)
    ipcRenderer.on('idphoto:progress', handler)
    return () => ipcRenderer.removeListener('idphoto:progress', handler)
  },

  // AI Recolor
  recolorIdPhotoAI: (params: RecolorParams): Promise<{ success: boolean; outputPath: string; error?: string }> =>
    ipcRenderer.invoke('idphoto:recolorAI', { params }),

  getRecolorPreviewAI: (sourcePath: string, targetBgColor: string): Promise<string> =>
    ipcRenderer.invoke('idphoto:recolorPreviewAI', { sourcePath, targetBgColor }),

  // Beauty filter
  getBeautyPreview: (sourcePath: string, params: BeautyParams): Promise<string> =>
    ipcRenderer.invoke('idphoto:beautyPreview', { sourcePath, params }),

  // Compress
  compressToTargetSize: (params: CompressParams): Promise<CompressResult> =>
    ipcRenderer.invoke('idphoto:compress', { params }),

  batchCompress: (sources: Array<{ sourcePath: string; outputPath: string }>, targetSizeKB: number): Promise<CompressResult[]> =>
    ipcRenderer.invoke('idphoto:batchCompress', { sources, targetSizeKB }),

  // Print layout
  generatePrintLayout: (params: PrintLayoutParams): Promise<PrintLayoutResult> =>
    ipcRenderer.invoke('idphoto:printLayout', { params }),

  getPrintLayoutPreview: (photoPath: string, rows: number, cols: number, spacingMm: number): Promise<string> =>
    ipcRenderer.invoke('idphoto:printLayoutPreview', { photoPath, rows, cols, spacingMm })
}

contextBridge.exposeInMainWorld('api', api)
