import { create } from 'zustand'
import type { FileInfo, DuplicateGroup, ScanProgress } from '../types'

type AppPhase = 'import' | 'scanning' | 'comparing' | 'executing' | 'done'

interface ScanState {
  phase: AppPhase
  folderPath: string | null
  files: FileInfo[]
  progress: ScanProgress | null
  error: string | null
  duplicateGroups: DuplicateGroup[]
  dedupResult: { success: number; errors: string[] } | null

  setPhase: (phase: AppPhase) => void
  setFolderPath: (path: string) => void
  setFiles: (files: FileInfo[]) => void
  setProgress: (progress: ScanProgress | null) => void
  setError: (error: string | null) => void
  setDuplicateGroups: (groups: DuplicateGroup[]) => void
  setDedupResult: (result: { success: number; errors: string[] }) => void
  reset: () => void
}

export const useScanStore = create<ScanState>((set) => ({
  phase: 'import',
  folderPath: null,
  files: [],
  progress: null,
  error: null,
  duplicateGroups: [],
  dedupResult: null,

  setPhase: (phase) => set({ phase }),
  setFolderPath: (path) => set({ folderPath: path }),
  setFiles: (files) => set({ files }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  setDuplicateGroups: (groups) => set({ duplicateGroups: groups }),
  setDedupResult: (result) => set({ dedupResult: result }),
  reset: () =>
    set({
      phase: 'import',
      folderPath: null,
      files: [],
      progress: null,
      error: null,
      duplicateGroups: [],
      dedupResult: null
    })
}))
