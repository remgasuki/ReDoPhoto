export interface IdPhotoSizePreset {
  key: string
  label: string
  widthMm: number
  heightMm: number
  widthPx: number
  heightPx: number
  dpi: number
  format: string
  category: 'common' | 'passport' | 'special'
}

export interface BgColorOption {
  key: string
  label: string
  colorValue: string
}

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

export interface IdPhotoProgress {
  phase: 'processing' | 'done'
  percentage: number
}

export const ID_PHOTO_SIZE_PRESETS: IdPhotoSizePreset[] = [
  // 常用尺寸
  {
    key: '1inch',
    label: '1寸',
    widthMm: 25,
    heightMm: 35,
    widthPx: 295,
    heightPx: 413,
    dpi: 300,
    format: 'jpg',
    category: 'common'
  },
  {
    key: '2inch',
    label: '2寸',
    widthMm: 35,
    heightMm: 49,
    widthPx: 413,
    heightPx: 579,
    dpi: 300,
    format: 'jpg',
    category: 'common'
  },
  {
    key: 'small1inch',
    label: '小1寸',
    widthMm: 22,
    heightMm: 32,
    widthPx: 260,
    heightPx: 378,
    dpi: 300,
    format: 'jpg',
    category: 'common'
  },
  {
    key: 'small2inch',
    label: '小2寸',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    dpi: 300,
    format: 'jpg',
    category: 'common'
  },
  {
    key: 'large1inch',
    label: '大1寸',
    widthMm: 33,
    heightMm: 48,
    widthPx: 390,
    heightPx: 567,
    dpi: 300,
    format: 'jpg',
    category: 'common'
  },
  {
    key: 'large2inch',
    label: '大2寸',
    widthMm: 35,
    heightMm: 53,
    widthPx: 413,
    heightPx: 626,
    dpi: 300,
    format: 'jpg',
    category: 'common'
  },
  // 护照/签证
  {
    key: 'passport',
    label: '护照',
    widthMm: 33,
    heightMm: 48,
    widthPx: 390,
    heightPx: 567,
    dpi: 300,
    format: 'jpg',
    category: 'passport'
  },
  {
    key: 'usvisa',
    label: '美国签证',
    widthMm: 51,
    heightMm: 51,
    widthPx: 600,
    heightPx: 600,
    dpi: 300,
    format: 'jpg',
    category: 'passport'
  },
  {
    key: 'schengen',
    label: '申根签证',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    dpi: 300,
    format: 'jpg',
    category: 'passport'
  },
  {
    key: 'jpvisa',
    label: '日本签证',
    widthMm: 45,
    heightMm: 45,
    widthPx: 531,
    heightPx: 531,
    dpi: 300,
    format: 'jpg',
    category: 'passport'
  },
  // 特殊尺寸
  {
    key: 'driver',
    label: '驾驶证',
    widthMm: 22,
    heightMm: 32,
    widthPx: 260,
    heightPx: 378,
    dpi: 300,
    format: 'jpg',
    category: 'special'
  },
  {
    key: 'social',
    label: '社保卡',
    widthMm: 26,
    heightMm: 32,
    widthPx: 358,
    heightPx: 441,
    dpi: 350,
    format: 'jpg',
    category: 'special'
  }
]

export const BG_COLOR_OPTIONS: BgColorOption[] = [
  { key: 'none', label: '保持原背景', colorValue: '' },
  { key: 'white', label: '白色', colorValue: '#FFFFFF' },
  { key: 'blue', label: '蓝色', colorValue: '#438EDB' },
  { key: 'red', label: '红色', colorValue: '#FF0000' }
]

export const PRESET_CATEGORY_LABELS: Record<string, string> = {
  common: '常用尺寸',
  passport: '护照/签证',
  special: '特殊用途'
}
