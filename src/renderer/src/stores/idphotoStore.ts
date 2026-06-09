import { create } from 'zustand'
import type {
  IdPhotoSizePreset, BgColorOption, CropRect, IdPhotoProgress,
  CustomSizeTemplate, BeautyParams, CompressResult,
  PrintLayoutResult, FormalWearTemplate, GradientBg
} from '../types/idphoto'
import { loadCustomTemplates, saveCustomTemplate, deleteCustomTemplate } from '../utils/customTemplates'

export type IdPhotoMode = 'create' | 'recolor'
type IdPhotoPhase = 'import' | 'preview' | 'recolor_preview' | 'executing' | 'done' | 'print_layout'

interface IdPhotoState {
  phase: IdPhotoPhase
  mode: IdPhotoMode

  // Import phase
  sourcePath: string | null
  sourceImageBase64: string | null
  sourceWidth: number | null
  sourceHeight: number | null
  selectedPreset: IdPhotoSizePreset | null
  selectedBgColor: BgColorOption
  error: string | null

  // Preview phase (create mode)
  cropRect: CropRect | null

  // Recolor preview
  recoloredImageBase64: string | null

  // Execute phase
  outputPath: string | null
  progress: IdPhotoProgress | null
  result: { success: boolean; outputPath: string; error?: string } | null

  // Custom templates
  customTemplates: CustomSizeTemplate[]

  // AI matting
  useAIMatting: boolean

  // Beauty filter
  beautyParams: BeautyParams | null
  beautyPreviewBase64: string | null

  // Formal wear
  selectedFormalWear: FormalWearTemplate | null

  // Gradient background
  selectedGradient: GradientBg | null

  // Compress
  compressResult: CompressResult | null

  // Print layout
  printLayoutPreview: string | null
  printLayoutResult: PrintLayoutResult | null

  // Actions
  setPhase: (phase: IdPhotoPhase) => void
  setMode: (mode: IdPhotoMode) => void
  setSourcePath: (path: string) => void
  setSourceImage: (base64: string, width: number, height: number) => void
  setSelectedPreset: (preset: IdPhotoSizePreset) => void
  setSelectedBgColor: (bg: BgColorOption) => void
  setCropRect: (rect: CropRect) => void
  setRecoloredImageBase64: (base64: string | null) => void
  setOutputPath: (path: string) => void
  setProgress: (progress: IdPhotoProgress | null) => void
  setError: (error: string | null) => void
  setResult: (result: { success: boolean; outputPath: string; error?: string }) => void

  // Custom template actions
  addCustomTemplate: (t: CustomSizeTemplate) => void
  removeCustomTemplate: (id: string) => void

  // AI matting
  setUseAIMatting: (v: boolean) => void

  // Beauty actions
  setBeautyParams: (params: BeautyParams | null) => void
  setBeautyPreviewBase64: (base64: string | null) => void

  // Formal wear
  setSelectedFormalWear: (t: FormalWearTemplate | null) => void

  // Gradient
  setSelectedGradient: (g: GradientBg | null) => void

  // Compress
  setCompressResult: (r: CompressResult | null) => void

  // Print layout
  setPrintLayoutPreview: (s: string | null) => void
  setPrintLayoutResult: (r: PrintLayoutResult | null) => void

  reset: () => void
}

const DEFAULT_BG: BgColorOption = { key: 'none', label: '保持原背景', colorValue: '' }

export const useIdPhotoStore = create<IdPhotoState>((set) => ({
  phase: 'import',
  mode: 'create',
  sourcePath: null,
  sourceImageBase64: null,
  sourceWidth: null,
  sourceHeight: null,
  selectedPreset: null,
  selectedBgColor: DEFAULT_BG,
  error: null,
  cropRect: null,
  recoloredImageBase64: null,
  outputPath: null,
  progress: null,
  result: null,
  customTemplates: loadCustomTemplates(),
  useAIMatting: true,
  beautyParams: null,
  beautyPreviewBase64: null,
  selectedFormalWear: null,
  selectedGradient: null,
  compressResult: null,
  printLayoutPreview: null,
  printLayoutResult: null,

  setPhase: (phase) => set({ phase }),
  setMode: (mode) => set({
    mode, phase: 'import', sourcePath: null, sourceImageBase64: null,
    sourceWidth: null, sourceHeight: null, selectedPreset: null,
    selectedBgColor: DEFAULT_BG, error: null, cropRect: null,
    recoloredImageBase64: null, outputPath: null, progress: null, result: null,
    beautyParams: null, beautyPreviewBase64: null, selectedFormalWear: null,
    selectedGradient: null, compressResult: null, printLayoutPreview: null, printLayoutResult: null
  }),
  setSourcePath: (path) => set({ sourcePath: path }),
  setSourceImage: (base64, width, height) => set({ sourceImageBase64: base64, sourceWidth: width, sourceHeight: height }),
  setSelectedPreset: (preset) => set({ selectedPreset: preset }),
  setSelectedBgColor: (bg) => set({ selectedBgColor: bg }),
  setCropRect: (rect) => set({ cropRect: rect }),
  setRecoloredImageBase64: (base64) => set({ recoloredImageBase64: base64 }),
  setOutputPath: (path) => set({ outputPath: path }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  setResult: (result) => set({ result }),

  addCustomTemplate: (t) => {
    saveCustomTemplate(t)
    set({ customTemplates: loadCustomTemplates() })
  },
  removeCustomTemplate: (id) => {
    deleteCustomTemplate(id)
    set({ customTemplates: loadCustomTemplates() })
  },

  setUseAIMatting: (v) => set({ useAIMatting: v }),
  setBeautyParams: (params) => set({ beautyParams: params }),
  setBeautyPreviewBase64: (base64) => set({ beautyPreviewBase64: base64 }),
  setSelectedFormalWear: (t) => set({ selectedFormalWear: t }),
  setSelectedGradient: (g) => set({ selectedGradient: g }),
  setCompressResult: (r) => set({ compressResult: r }),
  setPrintLayoutPreview: (s) => set({ printLayoutPreview: s }),
  setPrintLayoutResult: (r) => set({ printLayoutResult: r }),

  reset: () =>
    set({
      phase: 'import',
      sourcePath: null,
      sourceImageBase64: null,
      sourceWidth: null,
      sourceHeight: null,
      selectedPreset: null,
      selectedBgColor: DEFAULT_BG,
      error: null,
      cropRect: null,
      recoloredImageBase64: null,
      outputPath: null,
      progress: null,
      result: null,
      beautyParams: null,
      beautyPreviewBase64: null,
      selectedFormalWear: null,
      selectedGradient: null,
      compressResult: null,
      printLayoutPreview: null,
      printLayoutResult: null
    })
}))
