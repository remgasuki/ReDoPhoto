import { create } from 'zustand'
import type { FileInfo, OrientationInfo, OrientationProgress } from '../types'

type OrientationPhase = 'import' | 'scanning' | 'preview' | 'executing' | 'done'

interface OrientationState {
  phase: OrientationPhase
  folderPath: string | null
  files: FileInfo[]
  orientationInfos: OrientationInfo[]
  selectedIds: Set<string>
  progress: OrientationProgress | null
  error: string | null
  result: { success: number; errors: string[] } | null

  setPhase: (phase: OrientationPhase) => void
  setFolderPath: (path: string) => void
  setFiles: (files: FileInfo[]) => void
  setOrientationInfos: (infos: OrientationInfo[]) => void
  toggleSelection: (id: string) => void
  selectAll: (selected: boolean) => void
  setProgress: (progress: OrientationProgress | null) => void
  setError: (error: string | null) => void
  setResult: (result: { success: number; errors: string[] }) => void
  reset: () => void
}

export const useOrientationStore = create<OrientationState>((set) => ({
  phase: 'import',
  folderPath: null,
  files: [],
  orientationInfos: [],
  selectedIds: new Set(),
  progress: null,
  error: null,
  result: null,

  setPhase: (phase) => set({ phase }),
  setFolderPath: (path) => set({ folderPath: path }),
  setFiles: (files) => set({ files }),
  setOrientationInfos: (infos) => set({ orientationInfos: infos }),
  toggleSelection: (id) =>
    set((state) => {
      const newSelected = new Set(state.selectedIds)
      if (newSelected.has(id)) newSelected.delete(id)
      else newSelected.add(id)
      return { selectedIds: newSelected }
    }),
  selectAll: (selected) =>
    set((state) => ({
      selectedIds: selected
        ? new Set(state.orientationInfos.filter((i) => i.needsFix).map((i) => i.id))
        : new Set()
    })),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  setResult: (result) => set({ result }),
  reset: () =>
    set({
      phase: 'import',
      folderPath: null,
      files: [],
      orientationInfos: [],
      selectedIds: new Set(),
      progress: null,
      error: null,
      result: null
    })
}))
