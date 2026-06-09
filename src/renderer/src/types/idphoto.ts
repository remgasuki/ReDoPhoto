export type PresetCategory = 'common' | 'passport' | 'special' | 'visa' | 'exam' | 'custom'

export interface IdPhotoSizePreset {
  key: string
  label: string
  widthMm: number
  heightMm: number
  widthPx: number
  heightPx: number
  dpi: number
  format: string
  category: PresetCategory
}

export interface CustomSizeTemplate {
  id: string
  label: string
  widthMm: number
  heightMm: number
  widthPx: number
  heightPx: number
  dpi: number
  format: string
  category: 'custom'
  createdAt: number
}

export interface BgColorOption {
  key: string
  label: string
  colorValue: string
  gradient?: GradientBg
}

export interface GradientBg {
  type: 'linear'
  angle: number
  colorStops: Array<{ offset: number; color: string }>
}

export interface FormalWearTemplate {
  key: string
  label: string
  imagePath: string
}

export interface BeautyParams {
  smooth: number      // 0-100
  brightness: number  // -50 to 50
  contrast: number    // -50 to 50
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

export interface PrintLayoutPreset {
  key: string
  label: string
  rows: number
  cols: number
  description: string
}

export interface PrintLayoutResult {
  success: boolean
  outputPath: string
  paperSizePx: { width: number; height: number }
  actualCount: number
  error?: string
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
  {
    key: 'kr_passport',
    label: '韩国护照',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    dpi: 300,
    format: 'jpg',
    category: 'passport'
  },
  {
    key: 'cn_passport',
    label: '中国护照',
    widthMm: 33,
    heightMm: 48,
    widthPx: 390,
    heightPx: 567,
    dpi: 300,
    format: 'jpg',
    category: 'passport'
  },
  // 各国签证
  {
    key: 'kr_visa',
    label: '韩国签证',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    dpi: 300,
    format: 'jpg',
    category: 'visa'
  },
  {
    key: 'au_visa',
    label: '澳大利亚签证',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    dpi: 300,
    format: 'jpg',
    category: 'visa'
  },
  {
    key: 'ca_visa',
    label: '加拿大签证',
    widthMm: 50,
    heightMm: 70,
    widthPx: 591,
    heightPx: 827,
    dpi: 300,
    format: 'jpg',
    category: 'visa'
  },
  {
    key: 'uk_visa',
    label: '英国签证',
    widthMm: 35,
    heightMm: 45,
    widthPx: 413,
    heightPx: 531,
    dpi: 300,
    format: 'jpg',
    category: 'visa'
  },
  // 考试报名
  {
    key: 'cn_graduate',
    label: '考研报名',
    widthMm: 25,
    heightMm: 35,
    widthPx: 295,
    heightPx: 413,
    dpi: 300,
    format: 'jpg',
    category: 'exam'
  },
  {
    key: 'cn_civil',
    label: '公务员考试',
    widthMm: 25,
    heightMm: 35,
    widthPx: 295,
    heightPx: 413,
    dpi: 300,
    format: 'jpg',
    category: 'exam'
  },
  {
    key: 'cn_teacher',
    label: '教师资格证',
    widthMm: 25,
    heightMm: 35,
    widthPx: 295,
    heightPx: 413,
    dpi: 300,
    format: 'jpg',
    category: 'exam'
  },
  {
    key: 'cn_nurse',
    label: '护士资格证',
    widthMm: 25,
    heightMm: 35,
    widthPx: 295,
    heightPx: 413,
    dpi: 300,
    format: 'jpg',
    category: 'exam'
  },
  {
    key: 'cn_electrician',
    label: '电工证',
    widthMm: 25,
    heightMm: 35,
    widthPx: 295,
    heightPx: 413,
    dpi: 300,
    format: 'jpg',
    category: 'exam'
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
  },
  {
    key: 'residence_permit',
    label: '居住证',
    widthMm: 26,
    heightMm: 32,
    widthPx: 358,
    heightPx: 441,
    dpi: 300,
    format: 'jpg',
    category: 'special'
  },
  {
    key: 'id_card_renewal',
    label: '身份证换领',
    widthMm: 26,
    heightMm: 32,
    widthPx: 358,
    heightPx: 441,
    dpi: 300,
    format: 'jpg',
    category: 'special'
  },
  {
    key: 'social_v2',
    label: '社保卡(新版)',
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

export const GRADIENT_PRESETS: GradientBg[] = [
  { type: 'linear', angle: 180, colorStops: [{ offset: 0, color: '#667eea' }, { offset: 1, color: '#764ba2' }] },
  { type: 'linear', angle: 180, colorStops: [{ offset: 0, color: '#438EDB' }, { offset: 1, color: '#1a5276' }] },
  { type: 'linear', angle: 180, colorStops: [{ offset: 0, color: '#f5f7fa' }, { offset: 1, color: '#c3cfe2' }] },
]

export const FORMAL_WEAR_TEMPLATES: FormalWearTemplate[] = [
  { key: 'suit_male', label: '男士西装', imagePath: 'suit_male.png' },
  { key: 'suit_female', label: '女士职业装', imagePath: 'suit_female.png' },
]

export const PRINT_LAYOUT_PRESETS: PrintLayoutPreset[] = [
  { key: '2inch_x8', label: '2寸×8张', rows: 2, cols: 4, description: '2行4列共8张' },
  { key: '1inch_x16', label: '1寸×16张', rows: 4, cols: 4, description: '4行4列共16张' },
  { key: 'custom', label: '自定义', rows: 0, cols: 0, description: '自定义行列数' },
]

export const PRESET_CATEGORY_LABELS: Record<string, string> = {
  common: '常用尺寸',
  passport: '护照',
  visa: '各国签证',
  exam: '考试报名',
  special: '特殊用途',
  custom: '自定义'
}
