import { create } from 'zustand'
import type { FileInfo, ExifInfo, RenamePreview, RenameProgress } from '../types'

type RenamePhase = 'import' | 'scanning' | 'preview' | 'executing' | 'done'

interface RenameState {
  phase: RenamePhase
  folderPath: string | null
  files: FileInfo[]
  exifInfos: ExifInfo[]
  previews: RenamePreview[]
  progress: RenameProgress | null
  error: string | null
  renameResult: { success: number; errors: string[] } | null

  setPhase: (phase: RenamePhase) => void
  setFolderPath: (path: string) => void
  setFiles: (files: FileInfo[]) => void
  setExifInfos: (infos: ExifInfo[]) => void
  setPreviews: (previews: RenamePreview[]) => void
  setProgress: (progress: RenameProgress | null) => void
  setError: (error: string | null) => void
  setRenameResult: (result: { success: number; errors: string[] }) => void
  updatePreviewName: (id: string, newName: string) => void
  togglePreviewSelection: (id: string) => void
  selectAll: (selected: boolean) => void
  reset: () => void
}

export const useRenameStore = create<RenameState>((set) => ({
  phase: 'import',
  folderPath: null,
  files: [],
  exifInfos: [],
  previews: [],
  progress: null,
  error: null,
  renameResult: null,

  setPhase: (phase) => set({ phase }),
  setFolderPath: (path) => set({ folderPath: path }),
  setFiles: (files) => set({ files }),
  setExifInfos: (infos) => set({ exifInfos: infos }),
  setPreviews: (previews) => set({ previews }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  setRenameResult: (result) => set({ renameResult: result }),
  updatePreviewName: (id, newName) =>
    set((state) => ({
      previews: state.previews.map((p) => (p.id === id ? { ...p, newName } : p))
    })),
  togglePreviewSelection: (id) =>
    set((state) => ({
      previews: state.previews.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    })),
  selectAll: (selected) =>
    set((state) => ({
      previews: state.previews.map((p) => ({ ...p, selected }))
    })),
  reset: () =>
    set({
      phase: 'import',
      folderPath: null,
      files: [],
      exifInfos: [],
      previews: [],
      progress: null,
      error: null,
      renameResult: null
    })
}))
