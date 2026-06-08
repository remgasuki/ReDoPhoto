import { create } from 'zustand'
import type { IdPhotoSizePreset, BgColorOption, CropRect, IdPhotoProgress } from '../types/idphoto'

type IdPhotoPhase = 'import' | 'preview' | 'executing' | 'done'

interface IdPhotoState {
  phase: IdPhotoPhase

  // Import phase
  sourcePath: string | null
  sourceImageBase64: string | null
  sourceWidth: number | null
  sourceHeight: number | null
  selectedPreset: IdPhotoSizePreset | null
  selectedBgColor: BgColorOption
  error: string | null

  // Preview phase
  cropRect: CropRect | null

  // Execute phase
  outputPath: string | null
  progress: IdPhotoProgress | null
  result: { success: boolean; outputPath: string; error?: string } | null

  // Actions
  setPhase: (phase: IdPhotoPhase) => void
  setSourcePath: (path: string) => void
  setSourceImage: (base64: string, width: number, height: number) => void
  setSelectedPreset: (preset: IdPhotoSizePreset) => void
  setSelectedBgColor: (bg: BgColorOption) => void
  setCropRect: (rect: CropRect) => void
  setOutputPath: (path: string) => void
  setProgress: (progress: IdPhotoProgress | null) => void
  setError: (error: string | null) => void
  setResult: (result: { success: boolean; outputPath: string; error?: string }) => void
  reset: () => void
}

const DEFAULT_BG: BgColorOption = { key: 'none', label: '保持原背景', colorValue: '' }

export const useIdPhotoStore = create<IdPhotoState>((set) => ({
  phase: 'import',
  sourcePath: null,
  sourceImageBase64: null,
  sourceWidth: null,
  sourceHeight: null,
  selectedPreset: null,
  selectedBgColor: DEFAULT_BG,
  error: null,
  cropRect: null,
  outputPath: null,
  progress: null,
  result: null,

  setPhase: (phase) => set({ phase }),
  setSourcePath: (path) => set({ sourcePath: path }),
  setSourceImage: (base64, width, height) => set({ sourceImageBase64: base64, sourceWidth: width, sourceHeight: height }),
  setSelectedPreset: (preset) => set({ selectedPreset: preset }),
  setSelectedBgColor: (bg) => set({ selectedBgColor: bg }),
  setCropRect: (rect) => set({ cropRect: rect }),
  setOutputPath: (path) => set({ outputPath: path }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  setResult: (result) => set({ result }),
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
      outputPath: null,
      progress: null,
      result: null
    })
}))
