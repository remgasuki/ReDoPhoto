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

// Nested settings types
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
  dateTimeOriginal: string | null
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
